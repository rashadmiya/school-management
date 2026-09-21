// services/ReconciliationService.js
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const Adjustment = require('../models/Adjustment');
const { toDecimal, toString, sum } = require('../../utils/decimal');
const FeeInstance = require('../models/FeeInstance');

class ReconciliationService {
    /**
     * Daily reconciliation for a given date and session.
     */
    static async getDailyReconciliation({ date, session }) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const [payments, refunds, adjustments] = await Promise.all([
            Payment.find({
                createdAt: { $gte: start, $lte: end },
                session,
                status: 'completed',
            })
                .populate('student', 'name rollNumber')
                .populate('receivedBy', 'name')
                .lean(),
            Refund.find({
                processedAt: { $gte: start, $lte: end },
                session,
                status: 'processed',
            })
                .populate('student', 'name rollNumber')
                .lean(),
            Adjustment.find({
                appliedAt: { $gte: start, $lte: end },
                session,
                status: 'applied',
            })
                .populate('student', 'name rollNumber')
                .lean(),
        ]);

        // Group payments by method
        const byMethod = {};
        for (const p of payments) {
            const m = p.method || 'unknown';
            if (!byMethod[m]) byMethod[m] = { count: 0, amount: toDecimal(0) };
            byMethod[m].count += 1;
            byMethod[m].amount = byMethod[m].amount.plus(toDecimal(p.amount));
        }


        // const totalCollected = sum(payments.map(p => p.amount));           // all methods — for reporting
        // const totalRefunded = sum(refunds.map(r => r.amount));            // all methods — for reporting

        // const totalAdjustedDebit = sum(adjustments.filter(a => a.type === 'debit').map(a => a.amount));
        // const totalAdjustedCredit = sum(adjustments.filter(a => a.type === 'credit').map(a => a.amount));

        // // --- cash-only flows (what's physically in the drawer) ---
        // const cashIn = sum(
        //     payments.filter(p => p.method === 'cash').map(p => p.amount)
        // );
        // const cashOut = sum(
        //     refunds.filter(r => r.method === 'cash').map(r => r.amount)
        // );

        // const netCash = cashIn.minus(cashOut);

        const totalCollected = sum(payments.map(p => p.amount));
        const totalRefunded = sum(refunds.map(r => r.amount));

        const totalAdjustedDebit = sum(adjustments.filter(a => a.type === 'debit').map(a => a.amount));
        const totalAdjustedCredit = sum(adjustments.filter(a => a.type === 'credit').map(a => a.amount));

        const cashIn = sum(payments.filter(p => p.method === 'cash').map(p => p.amount));
        const cashOut = sum(refunds.filter(r => r.method === 'cash').map(r => r.amount));
        const netCash = cashIn.minus(cashOut);

        return {
            date: start.toISOString().split('T')[0],
            session,
            totals: {
                totalCollected: toString(totalCollected),
                totalRefunded: toString(totalRefunded),
                totalAdjustedDebit: toString(totalAdjustedDebit),
                totalAdjustedCredit: toString(totalAdjustedCredit),
                netCash: toString(netCash),
            },
            byMethod: Object.entries(byMethod).map(([method, data]) => ({
                method,
                count: data.count,
                amount: toString(data.amount),
            })),
            payments: payments.map(p => ({
                receiptNumber: p.receiptNumber,
                student: p.student?.name,
                rollNumber: p.student?.rollNumber,
                amount: toString(p.amount),
                method: p.method,
                receivedBy: p.receivedBy?.name,
                time: p.createdAt,
            })),
            refunds: refunds.map(r => ({
                refundNumber: r.refundNumber,
                student: r.student?.name,
                amount: toString(r.amount),
                method: r.method,
                time: r.processedAt,
            })),
            adjustments: adjustments.map(a => ({
                adjustmentNumber: a.adjustmentNumber,
                student: a.student?.name,
                type: a.type,
                amount: toString(a.amount),
                category: a.category,
                reason: a.reason,
                time: a.appliedAt,
            })),
        };
    }

    /**
     * Range reconciliation (weekly, monthly).
     */
    static async getRangeReconciliation({ startDate, endDate, session }) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const payments = await Payment.find({
            createdAt: { $gte: start, $lte: end },
            session,
            status: 'completed',
        }).lean();

        const byMethod = {};
        for (const p of payments) {
            const m = p.method || 'unknown';
            if (!byMethod[m]) byMethod[m] = { count: 0, amount: toDecimal(0) };
            byMethod[m].count += 1;
            byMethod[m].amount = byMethod[m].amount.plus(toDecimal(p.amount));
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
            session,
            totalCollected: toString(sum(payments.map(p => p.amount))),
            totalTransactions: payments.length,
            byMethod: Object.entries(byMethod).map(([method, data]) => ({
                method,
                count: data.count,
                amount: toString(data.amount),
            })),
        };
    }

    /**
     * Aging buckets: how much is owed for 0-30, 31-60, 61-90, 90+ days.
     */
    static async getAgingReport({ session, classId, asOfDate = new Date() }) {
        console.log("aging classId :", classId)
        console.log("aging asOfDate :", asOfDate)
        console.log("aging session :", session)

        const q = {
            session,
            status: { $in: ['unpaid', 'partial', 'overdue'] },
            isActive: true,
        };

        let fees = await FeeInstance.find(q)
            .populate('student', 'name rollNumber class')
            .lean();

        if (classId) {
            fees = fees.filter(f => String(f.student?.class) === String(classId));
        }

        const buckets = { '0-30': toDecimal(0), '31-60': toDecimal(0), '61-90': toDecimal(0), '90+': toDecimal(0) };
        const byStudent = {};

        for (const fee of fees) {
            const due = toDecimal(fee.dueAmount);
            if (due.lte(0)) continue;

            // const ageMs = asOfDate - new Date(fee.dueDate);
            const asOf = asOfDate instanceof Date ? asOfDate : new Date(asOfDate);
            const ageMs = asOf.getTime() - new Date(fee.dueDate).getTime();

            const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

            let bucket = '0-30';
            if (ageDays > 90) bucket = '90+';
            else if (ageDays > 60) bucket = '61-90';
            else if (ageDays > 30) bucket = '31-60';

            buckets[bucket] = buckets[bucket].plus(due);

            const sid = String(fee.student?._id);
            if (!byStudent[sid]) {
                byStudent[sid] = {
                    student: fee.student?.name,
                    rollNumber: fee.student?.rollNumber,
                    total: toDecimal(0),
                    buckets: { '0-30': toDecimal(0), '31-60': toDecimal(0), '61-90': toDecimal(0), '90+': toDecimal(0) },
                };
            }
            byStudent[sid].total = byStudent[sid].total.plus(due);
            byStudent[sid].buckets[bucket] = byStudent[sid].buckets[bucket].plus(due);
        }

        return {
            asOf: asOfDate.toISOString().split('T')[0],
            totals: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, toString(v)])),
            topDebtors: Object.values(byStudent)
                .sort((a, b) => b.total.comparedTo(a.total))
                .slice(0, 20)
                .map(s => ({
                    student: s.student,
                    rollNumber: s.rollNumber,
                    total: toString(s.total),
                    buckets: Object.fromEntries(Object.entries(s.buckets).map(([k, v]) => [k, toString(v)])),
                })),
        };
    }
}

module.exports = ReconciliationService;