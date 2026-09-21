// services/AdjustmentService.js
const mongoose = require('mongoose');
const Adjustment = require('../models/Adjustment');
const StudentFinanceSummaryService = require('../../services/StudentFinanceSummaryService');
const TransactionService = require('../../services/TransactionService');
const AuditService = require('./AuditService');
const { toDecimal, toDecimal128 } = require('../../utils/decimal');
const { getContext } = require('../../utils/requestContext');

class AdjustmentService {
    /**
     * Step 1: Request. No money moves yet.
     */
    static async request(data, userId) {
        const { studentId, session, type, amount, category, reason, feeInstance } = data;

        const amt = toDecimal(amount);
        if (amt.lte(0)) throw new Error('Amount must be positive');
        if (!['debit', 'credit'].includes(type)) throw new Error('Invalid adjustment type');
        if (!reason || reason.length < 5) throw new Error('Reason is required (min 5 chars)');

        const adjustment = await Adjustment.create({
            student: studentId,
            session,
            type,
            amount: toDecimal128(amt),
            category,
            reason,
            feeInstance: feeInstance || null,
            status: 'pending',
            createdBy: userId,
        });

        await AuditService.record({
            action: 'adjustment.created',
            ...getContext(),
            student: studentId,
            refModel: 'Adjustment',
            refId: adjustment._id,
            after: { type, amount: amt.toString(), category, reason },
            session,
            reason,
        });

        return adjustment;
    }

    /**
     * Step 2: Approve. Still no money moves.
     */
    static async approve(adjustmentId, userId, remarks = '') {
        const adjustment = await Adjustment.findById(adjustmentId);
        if (!adjustment) throw new Error('Adjustment not found');
        if (adjustment.status !== 'pending') throw new Error(`Cannot approve adjustment in ${adjustment.status}`);

        adjustment.status = 'approved';
        adjustment.approvedBy = userId;
        adjustment.approvedAt = new Date();
        await adjustment.save();

        await AuditService.record({
            action: 'adjustment.created', // reuse or add 'adjustment.approved'
            ...getContext(),
            student: adjustment.student,
            refModel: 'Adjustment',
            refId: adjustment._id,
            notes: remarks,
            session: adjustment.session,
            reason: 'Approved',
        });

        return adjustment;
    }

    /**
     * Step 3: Reject.
     */
    static async reject(adjustmentId, userId, reason) {
        const adjustment = await Adjustment.findById(adjustmentId);
        if (!adjustment) throw new Error('Adjustment not found');
        if (adjustment.status !== 'pending') throw new Error(`Cannot reject adjustment in ${adjustment.status}`);

        adjustment.status = 'rejected';
        adjustment.rejectedBy = userId;
        adjustment.rejectedAt = new Date();
        adjustment.rejectionReason = reason;
        await adjustment.save();

        await AuditService.record({
            action: 'adjustment.created',
            ...getContext(),
            student: adjustment.student,
            refModel: 'Adjustment',
            refId: adjustment._id,
            reason,
            session: adjustment.session,
        });

        return adjustment;
    }

    /**
     * Step 4: Apply. Money moves here.
     */
    static async apply(adjustmentId, userId) {
        const dbSession = await mongoose.startSession();
        try {
            dbSession.startTransaction();

            const adjustment = await Adjustment.findById(adjustmentId).session(dbSession);
            if (!adjustment) throw new Error('Adjustment not found');
            if (adjustment.status !== 'approved') {
                throw new Error('Adjustment must be approved first');
            }

            const transactionId = await TransactionService.createTransactionId('adjustment', userId);
            await TransactionService.beginTransaction(transactionId, 'adjustment', {
                userId, adjustmentId,
            });

            adjustment.adjustmentNumber = await Adjustment.generateAdjustmentNumber(adjustment.session, dbSession);

            const amount = toDecimal(adjustment.amount);
            const isDebit = adjustment.type === 'debit';

            // Record in summary: debit increases due, credit decreases
            await StudentFinanceSummaryService.recordMovement({
                student: adjustment.student,
                session: adjustment.session,
                transactionId,
                type: 'adjustment',
                debit: isDebit ? toDecimal128(amount) : toDecimal128(0),
                credit: isDebit ? toDecimal128(0) : toDecimal128(amount),
                refModel: 'Adjustment',
                refId: adjustment._id,
                description: `Adjustment (${adjustment.category}): ${adjustment.reason}`,
                createdBy: userId,
                summaryDelta: {
                    // For reporting we track as "fee" if debit, "waived" if credit? Better: add a dedicated field
                    // For simplicity, we treat debit as additional "fee" and credit as additional "waived"
                    fee: isDebit ? amount : 0,
                    waived: !isDebit ? amount : 0,
                },
            }, dbSession);

            adjustment.status = 'applied';
            adjustment.appliedBy = userId;
            adjustment.appliedAt = new Date();
            adjustment.transactionId = transactionId;
            await adjustment.save({ session: dbSession });

            await AuditService.record({
                action: 'adjustment.created',
                ...getContext(),
                student: adjustment.student,
                refModel: 'Adjustment',
                refId: adjustment._id,
                refNumber: adjustment.adjustmentNumber,
                after: { status: 'applied', type: adjustment.type, amount: amount.toString() },
                session: adjustment.session,
                transactionId,
                reason: adjustment.reason,
            }, dbSession);

            await TransactionService.completeTransaction(transactionId, {
                adjustmentId: adjustment._id,
                amount: amount.toString(),
            });

            await dbSession.commitTransaction();
            return adjustment;

        } catch (err) {
            await dbSession.abortTransaction();
            throw err;
        } finally {
            dbSession.endSession();
        }
    }

    static async list(query = {}, limit = 50) {
        return Adjustment.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('student', 'name rollNumber')
            .populate('createdBy', 'name')
            .populate('approvedBy', 'name')
            .lean();
    }
}

module.exports = AdjustmentService;