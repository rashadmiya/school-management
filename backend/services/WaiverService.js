// services/WaiverService.js
const mongoose = require('mongoose');
const FeeWaiver = require('../financeSystem/models/FeeWaiver');
const FeeInstance = require('../financeSystem/models/FeeInstance');
const StudentFinanceSummaryService = require('./StudentFinanceSummaryService');
const TransactionService = require('./TransactionService');
const { toDecimal, toDecimal128, percent } = require('../utils/decimal');

const NotificationService = require('../financeSystem/services/NotificationService');
const Student = require('../models/Student');

class WaiverService {
    static async requestWaiver(data, userId) {
        const { feeInstanceId, type, amount, percentage, reason, supportingDocuments, effectiveFrom, effectiveUntil } = data;
        const feeInstance = await FeeInstance.findById(feeInstanceId);
        if (!feeInstance) throw new Error('Fee instance not found');

        let waiverAmount = toDecimal(amount || 0);
        // if (percentage) waiverAmount = percent(toDecimal(feeInstance.totalAmount), percentage);
        if (percentage) {
            const total = toDecimal(feeInstance.totalAmount);
            const alreadyWaived = toDecimal(feeInstance.waivedAmount || 0);
            const maxWaivable = total.minus(alreadyWaived);
            waiverAmount = maxWaivable.times(percentage).dividedBy(100);
        }
        const maxWaivable = toDecimal(feeInstance.totalAmount).minus(toDecimal(feeInstance.waivedAmount));
        if (waiverAmount.gt(maxWaivable)) throw new Error(`Max waivable is ${maxWaivable.toString()}`);

        const existing = await FeeWaiver.findOne({
            feeInstance: feeInstanceId,
            status: { $in: ['pending', 'approved'] },
        });
        if (existing) throw new Error('A waiver already exists for this fee');

        const [waiver] = await FeeWaiver.create([{
            student: feeInstance.student,
            feeInstance: feeInstanceId,
            type,
            amount: toDecimal128(waiverAmount),
            percentage: percentage || null,
            reason,
            supportingDocuments: supportingDocuments || [],
            status: 'pending',
            requestedBy: userId,
            requestDate: new Date(),
            effectiveFrom: effectiveFrom || new Date(),
            effectiveUntil: effectiveUntil || null,
        }]);

        return waiver;
    }

    static async approveWaiver(waiverId, userId, remarks = '') {
        const dbSession = await mongoose.startSession();
        try {
            dbSession.startTransaction();

            const waiver = await FeeWaiver.findById(waiverId).session(dbSession);
            if (!waiver) throw new Error('Waiver not found');
            if (waiver.status !== 'pending') throw new Error(`Waiver already ${waiver.status}`);

            const feeInstance = await FeeInstance.findById(waiver.feeInstance).session(dbSession);
            if (!feeInstance) throw new Error('Fee instance not found');

            const transactionId = await TransactionService.createTransactionId('waiver', userId);
            await TransactionService.beginTransaction(transactionId, 'waiver', { userId, waiverId });

            const amount = toDecimal(waiver.amount);

            waiver.status = 'approved';
            waiver.approvedBy = userId;
            waiver.approvedDate = new Date();
            waiver.remarks = remarks;
            waiver.revisionHistory.push({
                changedBy: userId,
                changedAt: new Date(),
                changes: { status: 'approved' },
                reason: 'Approved',
            });
            await waiver.save({ session: dbSession });

            feeInstance.waivedAmount = toDecimal128(toDecimal(feeInstance.waivedAmount).plus(amount));
            feeInstance.waiver = waiver._id;
            feeInstance.recalculate();
            await feeInstance.save({ session: dbSession });

            await StudentFinanceSummaryService.recordMovement({
                student: feeInstance.student,
                session: feeInstance.session,
                transactionId,
                type: 'waiver',
                credit: toDecimal128(amount),
                refModel: 'FeeWaiver',
                refId: waiver._id,
                description: `Waiver approved: ${waiver.reason}`,
                createdBy: userId,
                summaryDelta: { waived: amount },
            }, dbSession);

            await TransactionService.completeTransaction(transactionId, {
                waiverId: waiver._id, amount: amount.toString(),
            });

            await dbSession.commitTransaction();
            // 🔔 Notify parent
            try {

                const student = await Student.findById(feeInstance.student)
                    .populate('parent')
                    .lean();

                await NotificationService.notifyWaiverApproved({
                    waiver,
                    feeInstance,
                    student,
                    parent: student?.parent,
                });
            } catch (err) {
                console.error('[waiver] notification failed', err);
            }
            return { waiver, feeInstance, amountWaived: amount };

        } catch (e) {
            await dbSession.abortTransaction();
            throw e;
        } finally {
            dbSession.endSession();
        }
    }

    static async rejectWaiver(waiverId, userId, reason) {
        const waiver = await FeeWaiver.findByIdAndUpdate(
            waiverId,
            {
                status: 'rejected',
                reviewedBy: userId,
                remarks: reason,
                $push: {
                    revisionHistory: {
                        changedBy: userId,
                        changedAt: new Date(),
                        changes: { status: 'rejected' },
                        reason,
                    },
                },
            },
            { new: true }
        );
        if (!waiver) throw new Error('Waiver not found');
        // 🔔 Notify parent
        try {
            const NotificationService = require('./NotificationService');
            const Student = require('../models/Student');
            const FeeInstance = require('../financeSystem/models/FeeInstance');

            const fee = await FeeInstance.findById(waiver.feeInstance).lean();
            const student = await Student.findById(waiver.student)
                .populate('parent')
                .lean();

            await NotificationService.notifyWaiverRejected({
                waiver,
                student,
                parent: student?.parent,
                reason,
            });
        } catch (err) {
            console.error('[waiver] reject notification failed', err);
        }

        return waiver;
    }

    static async revokeWaiver(waiverId, userId, reason) {
        const dbSession = await mongoose.startSession();
        try {
            dbSession.startTransaction();

            const waiver = await FeeWaiver.findById(waiverId).session(dbSession);
            if (!waiver) throw new Error('Waiver not found');
            if (waiver.status !== 'approved') throw new Error('Only approved waivers can be revoked');

            const feeInstance = await FeeInstance.findById(waiver.feeInstance).session(dbSession);
            if (!feeInstance) throw new Error('Fee instance not found');

            const transactionId = await TransactionService.createTransactionId('waiver_revocation', userId);
            await TransactionService.beginTransaction(transactionId, 'waiver_revocation', { userId, waiverId });

            const amount = toDecimal(waiver.amount);

            waiver.status = 'revoked';
            waiver.remarks = reason;
            waiver.revisionHistory.push({
                changedBy: userId, changedAt: new Date(),
                changes: { status: 'revoked' }, reason,
            });
            await waiver.save({ session: dbSession });

            feeInstance.waivedAmount = toDecimal128(toDecimal(feeInstance.waivedAmount).minus(amount));
            feeInstance.waiver = null;
            feeInstance.recalculate();
            await feeInstance.save({ session: dbSession });

            await StudentFinanceSummaryService.recordMovement({
                student: feeInstance.student,
                session: feeInstance.session,
                transactionId,
                type: 'waiver',
                debit: toDecimal128(amount),
                refModel: 'FeeWaiver',
                refId: waiver._id,
                description: `Waiver revoked: ${reason}`,
                createdBy: userId,
                summaryDelta: { waived: amount.negated() },
            }, dbSession);

            await TransactionService.completeTransaction(transactionId, {
                waiverId: waiver._id, amountReversed: amount.toString(),
            });

            await dbSession.commitTransaction();
            return { waiver, feeInstance, amountReversed: amount };

        } catch (e) {
            await dbSession.abortTransaction();
            throw e;
        } finally {
            dbSession.endSession();
        }
    }

    static async getWaiverRequests(studentId = null, status = null, limit = 50) {
        const q = {};
        if (studentId) q.student = studentId;
        if (status) q.status = status;
        return FeeWaiver.find(q)
            .sort({ requestDate: -1 })
            .limit(limit)
            .populate('student', 'name rollNumber')
            .populate('feeInstance', 'title totalAmount dueAmount status')
            .populate('requestedBy', 'name email')
            .populate('approvedBy', 'name email')
            .lean();
    }

    static async calculateEligibleWaiver(feeInstanceId) {
        const f = await FeeInstance.findById(feeInstanceId);
        if (!f) throw new Error('Fee instance not found');
        const total = toDecimal(f.totalAmount);
        const waived = toDecimal(f.waivedAmount);
        return {
            feeInstanceId,
            totalAmount: total.toString(),
            alreadyWaived: waived.toString(),
            maxWaivable: total.minus(waived).toString(),
            paidAmount: toDecimal(f.paidAmount).toString(),
            dueAmount: toDecimal(f.dueAmount).toString(),
        };
    }
}

module.exports = WaiverService;