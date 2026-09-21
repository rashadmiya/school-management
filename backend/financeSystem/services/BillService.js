// services/BillService.js
const FeeInstance = require('../models/FeeInstance');
const { toDecimal, toString, add } = require('../../utils/decimal');
const { getCurrentSession } = require('../../utils/accademicSession');

class BillService {
    /**
     * Group a student's fee instances into monthly bills.
     * Returns an array of months, newest first.
     */
    static async getMonthlyBills(studentId, sessionYear, options = {}) {
        const { includeEmpty = false } = options;
        const session = sessionYear || getCurrentSession();

        const fees = await FeeInstance.find({
            student: studentId,
            session,
            isActive: true,
        })
            .populate('feeTemplate', 'title description frequency')
            .sort({ dueDate: 1 })
            .lean();

        // Group by the month of `dueDate` — this is what parents naturally associate with
        const groups = new Map();

        for (const fee of fees) {
            const key = monthKey(fee.dueDate);        // "2026-01"
            if (!groups.has(key)) {
                groups.set(key, {
                    monthKey: key,
                    monthLabel: monthLabel(fee.dueDate), // "January 2026"
                    year: new Date(fee.dueDate).getFullYear(),
                    month: new Date(fee.dueDate).getMonth() + 1,
                    items: [],
                    total: toDecimal(0),
                    paid: toDecimal(0),
                    waived: toDecimal(0),
                    advanceUsed: toDecimal(0),
                    due: toDecimal(0),
                    status: 'clear',
                });
            }
            const g = groups.get(key);
            g.items.push({
                _id: fee._id,
                title: fee.title,
                frequency: fee.frequency,
                originalAmount: fee.originalAmount,
                taxAmount: fee.taxAmount,
                totalAmount: fee.totalAmount,
                paidAmount: fee.paidAmount,
                waivedAmount: fee.waivedAmount,
                advanceUsed: fee.advanceUsed,
                dueAmount: fee.dueAmount,
                status: fee.status,
                dueDate: fee.dueDate,
            });
            g.total = add(g.total, fee.totalAmount);
            g.paid = add(g.paid, fee.paidAmount);
            g.waived = add(g.waived, fee.waivedAmount);
            g.advanceUsed = add(g.advanceUsed, fee.advanceUsed);
            g.due = add(g.due, fee.dueAmount);
        }

        // Sort newest first, compute status per bill
        const bills = [...groups.values()]
            .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
            .map(g => ({
                ...g,
                total: toString(g.total),
                paid: toString(g.paid),
                waived: toString(g.waived),
                advanceUsed: toString(g.advanceUsed),
                due: toString(g.due),
                status: computeBillStatus(g),
            }));

        return bills;
    }

    /**
     * Summary of the current month's bill (single month).
     */
    static async getCurrentBill(studentId, sessionYear) {
        const bills = await this.getMonthlyBills(studentId, sessionYear);
        return bills[0] || null;
    }

    /**
     * Full statement: header, monthly bills, payments, waivers, advance.
     * This is the single call the parent portal makes.
     */
    static async getStudentStatement(studentId, sessionYear) {
        const Student = require('../models/Student');
        const Payment = require('../financeSystem/models/Payment');
        const FeeWaiver = require('../financeSystem/models/FeeWaiver');
        const AdvanceBalance = require('../financeSystem/models/AdvanceBalance');
        const StudentFinanceSummaryService = require('./StudentFinanceSummaryService');
        const mongoose = require('mongoose');

        const session = sessionYear || getCurrentSession();
        const student = await Student.findById(studentId)
            .populate('user', 'name email')
            .populate('class', 'name section')
            .populate('parent', 'name email phone')
            .lean();
        if (!student) throw new Error('Student not found');

        const summary = await StudentFinanceSummaryService.getSummary(studentId, session);

        const [bills, payments, waivers, advance] = await Promise.all([
            this.getMonthlyBills(studentId, session),
            Payment.find({ student: studentId, session })
                .sort({ createdAt: -1 })
                .limit(50)
                .select('receiptNumber amount method createdAt status')
                .lean(),
            FeeWaiver.find({ student: studentId, status: 'approved' })
                .sort({ createdAt: -1 })
                .populate('feeInstance', 'title dueDate')
                .limit(20)
                .lean(),
            AdvanceBalance.findOne({ student: studentId, session }).lean(),
        ]);

        return {
            student: {
                _id: student._id,
                name: student.name,
                rollNumber: student.rollNumber,
                class: student.class?.name,
                section: student.class?.section?.name,
            },
            session,
            summary: summary ? {
                totalFee: summary.totalFee?.toString() || '0',
                totalPaid: summary.totalPaid?.toString() || '0',
                totalWaived: summary.totalWaived?.toString() || '0',
                totalAdvanceUsed: summary.totalAdvanceUsed?.toString() || '0',
                totalRefunded: summary.totalRefunded?.toString() || '0',
                advanceBalance: summary.advanceBalance?.toString() || '0',
                dueBalance: summary.dueBalance?.toString() || '0',
                status: summary.status || 'clear',
            } : null,
            bills,
            payments: payments.map(p => ({
                receiptNumber: p.receiptNumber,
                amount: p.amount.toString(),
                method: p.method,
                createdAt: p.createdAt,
                status: p.status,
            })),
            waivers: waivers.map(w => ({
                _id: w._id,
                feeTitle: w.feeInstance?.title,
                amount: w.amount.toString(),
                reason: w.reason,
                approvedDate: w.approvedDate,
            })),
            advance: advance ? {
                amount: advance.amount.toString(),
                currency: advance.currency || 'BDT',
                lastUpdated: advance.lastUpdated,
            } : { amount: '0', currency: 'BDT' },
        };
    }
}

// ---- helpers ----

function monthKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date) {
    const d = new Date(date);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function computeBillStatus(g) {
    if (toDecimal(g.due).lte(0)) return 'paid';
    if (toDecimal(g.paid).gt(0) || toDecimal(g.advanceUsed).gt(0)) return 'partial';
    if (new Date(g.items[0].dueDate) < new Date()) return 'overdue';
    return 'unpaid';
}

module.exports = BillService;