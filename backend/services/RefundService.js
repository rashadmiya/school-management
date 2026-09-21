// services/RefundService.js (rewritten)
const mongoose = require('mongoose');
const Refund = require('../financeSystem/models/Refund');
const Payment = require('../financeSystem/models/Payment');
const PaymentAllocation = require('../financeSystem/models/PaymentAllocation');
const FeeInstance = require('../financeSystem/models/FeeInstance');
const AdvanceBalance = require('../financeSystem/models/AdvanceBalance');
const StudentFinanceSummaryService = require('./StudentFinanceSummaryService');
const TransactionService = require('./TransactionService');
const { toDecimal, toDecimal128, min } = require('../utils/decimal');
const AuditService = require('../financeSystem/services/AuditService')
const NotificationService = require('../financeSystem/services/NotificationService');
const Student = require('../models/Student');

class RefundService {
    /**
     * STEP 1: request — no money moves yet.
     */
    static async requestRefund({ paymentId, amount, reason, description }, userId, idempotencyKey = undefined) {
        const payment = await Payment.findById(paymentId);
        if (!payment) throw new Error('Payment not found');
        if (payment.status === 'voided') throw new Error('Cannot refund a voided payment');

        const refundAmount = toDecimal(amount);
        if (refundAmount.lte(0)) throw new Error('Amount must be positive');

        const refundable = toDecimal(payment.amount).minus(toDecimal(payment.refundedAmount));
        if (refundAmount.gt(refundable)) {
            throw new Error(`Max refundable is ${refundable.toString()}`);
        }

        if (idempotencyKey) {
            const existing = await Refund.findOne({ idempotencyKey });
            if (existing) return existing;
        }

        const refundDoc = {
            student: payment.student,
            payment: paymentId,
            amount: toDecimal128(refundAmount),
            reason,
            description,
            status: 'pending',
            requestedBy: userId,
            requestedAt: new Date(),
            session: payment.session,
        };

        if (idempotencyKey) refundDoc.idempotencyKey = idempotencyKey;
        const [refund] = await Refund.create([refundDoc]);

        // requestRefund — after Refund.create
        await AuditService.record({
            action: 'refund.requested',
            actor: userId,
            student: refund.student,
            refModel: 'Refund',
            refId: refund._id,
            after: { amount: refund.amount.toString(), reason },
            session: refund.session,
            reason,
        });

        return refund;
    }

    /**
     * STEP 2: approve — no money moves yet.
     */
    static async approveRefund(refundId, userId, remarks = '') {
        const refund = await Refund.findById(refundId);
        if (!refund) throw new Error('Refund not found');
        if (refund.status !== 'pending') throw new Error(`Cannot approve refund in status ${refund.status}`);

        refund.status = 'approved';
        refund.approvedBy = userId;
        refund.approvedAt = new Date();
        refund.revisionHistory.push({
            changedBy: userId,
            changedAt: new Date(),
            changes: { status: 'approved' },
            reason: remarks || 'Approved',
        });
        await refund.save();

        // approveRefund
        await AuditService.record({
            action: 'refund.approved',
            actor: userId,
            student: refund.student,
            refModel: 'Refund',
            refId: refund._id,
            session: refund.session,
            notes: remarks,
        });

        return refund;
    }

    /**
     * STEP 3: reject.
     */
    static async rejectRefund(refundId, userId, reason) {
        if (!reason) throw new Error('Rejection reason is required');
        const refund = await Refund.findById(refundId);
        if (!refund) throw new Error('Refund not found');
        if (refund.status !== 'pending') throw new Error(`Cannot reject refund in status ${refund.status}`);

        refund.status = 'rejected';
        refund.rejectedBy = userId;
        refund.rejectedAt = new Date();
        refund.rejectionReason = reason;
        refund.revisionHistory.push({
            changedBy: userId,
            changedAt: new Date(),
            changes: { status: 'rejected' },
            reason,
        });
        await refund.save();

        // rejectRefund
        await AuditService.record({
            action: 'refund.rejected',
            actor: userId,
            student: refund.student,
            refModel: 'Refund',
            refId: refund._id,
            session: refund.session,
            reason,
        });

        return refund;
    }

    /**
     * STEP 4: process — this is where money actually moves.
     * Requires status = approved.
     */
    static async processRefund(refundId, methodData, userId) {
        const dbSession = await mongoose.startSession();

        try {
            dbSession.startTransaction();

            const refund = await Refund.findById(refundId).session(dbSession);
            if (!refund) throw new Error('Refund not found');
            if (refund.status !== 'approved') {
                throw new Error(`Refund must be approved first (current: ${refund.status})`);
            }

            const payment = await Payment.findById(refund.payment).session(dbSession);
            if (!payment) throw new Error('Payment not found');

            const amount = toDecimal(refund.amount);

            // Re-check refundable
            const refundable = toDecimal(payment.amount).minus(toDecimal(payment.refundedAmount));
            if (amount.gt(refundable)) {
                throw new Error(`Payment refundable amount has changed. Max: ${refundable.toString()}`);
            }

            const transactionId = await TransactionService.createTransactionId('refund', userId);
            await TransactionService.beginTransaction(transactionId, 'refund', {
                userId, refundId, amount: amount.toString(),
            });

            // Sequential refund number
            refund.refundNumber = await Refund.generateRefundNumber(refund.session, dbSession);

            // Update payment refund totals
            payment.refundedAmount = toDecimal128(toDecimal(payment.refundedAmount).plus(amount));
            if (toDecimal(payment.refundedAmount).gte(toDecimal(payment.amount))) {
                payment.isFullyRefunded = true;
            }
            await payment.save({ session: dbSession });

            // Reverse allocations LIFO
            const reverseResult = await this._reverseAllocations(
                refund.payment, amount, refund._id, transactionId, userId, refund.session, dbSession
            );

            // Advance deduction if any remaining
            let advanceDeducted = toDecimal(0);
            if (reverseResult.remaining.gt(0)) {
                const updated = await AdvanceBalance.findOneAndUpdate(
                    {
                        student: refund.student,
                        session: refund.session,
                        amount: { $gte: toDecimal128(reverseResult.remaining) },
                    },
                    {
                        $inc: { amount: toDecimal128(reverseResult.remaining.negated()) },
                        $set: { lastUpdated: new Date() },
                        $push: {
                            transactions: {
                                type: 'debit',
                                amount: toDecimal128(reverseResult.remaining),
                                refundId: refund._id,
                                transactionId,
                                description: `Refund deduction ${refund.refundNumber}`,
                                createdAt: new Date(),
                            },
                        },
                    },
                    { new: true, session: dbSession }
                );
                if (!updated) {
                    throw new Error('Insufficient advance balance to complete refund');
                }
                advanceDeducted = reverseResult.remaining;
            }

            // Update refund
            refund.status = 'processed';
            refund.processedBy = userId;
            refund.processedAt = new Date();
            refund.method = methodData.method;
            refund.methodDetails = methodData.methodDetails;
            refund.reference = methodData.reference;
            refund.transactionId = transactionId;
            refund.revisionHistory.push({
                changedBy: userId,
                changedAt: new Date(),
                changes: { status: 'processed' },
                reason: 'Processed',
            });
            await refund.save({ session: dbSession });

            // Summary + ledger — refund re-opens debt
            // await StudentFinanceSummaryService.recordMovement({
            //     student: refund.student,
            //     session: refund.session,
            //     transactionId,
            //     type: 'refund',
            //     debit: toDecimal128(amount),
            //     refModel: 'Refund',
            //     refId: refund._id,
            //     description: `Refund ${refund.refundNumber}: ${refund.reason}`,
            //     createdBy: userId,
            //     summaryDelta: {
            //         refunded: amount,
            //         paid: reverseResult.reversedAmount.negated(),
            //         advanceBalance: advanceDeducted.negated(),
            //     },
            // }, dbSession);
            await StudentFinanceSummaryService.recordMovement({
                student: refund.student,
                session: refund.session,
                transactionId,
                type: 'refund',
                debit: toDecimal128(reverseResult.reversedAmount),   // ← was `amount`
                refModel: 'Refund',
                refId: refund._id,
                description: `Refund ${refund.refundNumber}: ${refund.reason}`,
                createdBy: userId,
                summaryDelta: {
                    refunded: amount,
                    paid: reverseResult.reversedAmount.negated(),
                    advanceBalance: advanceDeducted.negated(),
                },
            }, dbSession);

            // processRefund — inside the transaction, before completeTransaction
            await AuditService.record({
                action: 'refund.processed',
                actor: userId,
                student: refund.student,
                refModel: 'Refund',
                refId: refund._id,
                refNumber: refund.refundNumber,
                after: {
                    method: refund.method,
                    amount: refund.amount.toString(),
                    reversed: reverseResult.reversedAmount.toString(),
                    advanceDeducted: advanceDeducted.toString(),
                },
                session: refund.session,
                transactionId,
            }, dbSession);

            await TransactionService.completeTransaction(transactionId, {
                refundId: refund._id,
                reversed: reverseResult.reversedAmount.toString(),
                advanceDeducted: advanceDeducted.toString(),
            });

            await dbSession.commitTransaction();

            try {
                const student = await Student.findById(refund.student)
                    .populate('parent')
                    .lean();

                await NotificationService.notifyRefundProcessed({
                    refund,
                    student,
                    parent: student?.parent,
                    payment,
                });
            } catch (err) {
                console.error('[refund] notification failed', err);
            }

            return {
                refund,
                reversedAmount: reverseResult.reversedAmount,
                advanceDeducted,
            };

        } catch (error) {
            await dbSession.abortTransaction();
            throw error;
        } finally {
            dbSession.endSession();
        }
    }

    static async _reverseAllocations(paymentId, refundAmount, refundId, transactionId, userId, sessionYear, dbSession) {
        let remaining = toDecimal(refundAmount);
        let reversedAmount = toDecimal(0);
        const reversedAllocations = [];

        const allocations = await PaymentAllocation.find({
            payment: paymentId,
            isReversed: false,
        }).sort({ _id: -1 }).session(dbSession);

        // for (const alloc of allocations) {
        //     if (remaining.lte(0)) break;

        //     const fee = await FeeInstance.findById(alloc.feeInstance).session(dbSession);
        //     if (!fee) continue;

        //     const maxReversible = min(
        //         min(toDecimal(alloc.amount), toDecimal(fee.paidAmount)),
        //         remaining
        //     );
        //     if (maxReversible.lte(0)) continue;

        //     fee.paidAmount = toDecimal128(toDecimal(fee.paidAmount).minus(maxReversible));
        //     fee.recalculate();
        //     await fee.save({ session: dbSession });

        //     alloc.isReversed = true;
        //     alloc.reversalTransactionId = transactionId;
        //     alloc.reversalReason = `Refund ${refundId}`;
        //     alloc.reversedAt = new Date();
        //     alloc.reversedBy = userId;
        //     await alloc.save({ session: dbSession });

        //     reversedAllocations.push({
        //         allocationId: alloc._id,
        //         feeInstanceId: fee._id,
        //         amount: maxReversible.toString(),
        //     });

        //     reversedAmount = reversedAmount.plus(maxReversible);
        //     remaining = remaining.minus(maxReversible);
        // }

        for (const alloc of allocations) {
            if (remaining.lte(0)) break;

            const fee = await FeeInstance.findById(alloc.feeInstance).session(dbSession);
            if (!fee) continue;

            const allocAmount = toDecimal(alloc.amount);
            const alreadyReversed = toDecimal(alloc.reversedAmount || 0);
            const remainingOnAlloc = allocAmount.minus(alreadyReversed);

            const maxReversible = min(
                min(remainingOnAlloc, toDecimal(fee.paidAmount)),
                remaining
            );
            if (maxReversible.lte(0)) continue;

            fee.paidAmount = toDecimal128(toDecimal(fee.paidAmount).minus(maxReversible));
            fee.recalculate();
            await fee.save({ session: dbSession });

            alloc.reversedAmount = toDecimal128(alreadyReversed.plus(maxReversible));
            if (toDecimal(alloc.reversedAmount).gte(allocAmount)) {
                alloc.isReversed = true;
            }
            alloc.reversalTransactionId = transactionId;
            alloc.reversalReason = `Refund ${refundId}`;
            alloc.reversedAt = new Date();
            alloc.reversedBy = userId;
            await alloc.save({ session: dbSession });

            reversedAmount = reversedAmount.plus(maxReversible);
            remaining = remaining.minus(maxReversible);
        }
        return { reversedAllocations, reversedAmount, remaining };
    }

    static async getRefundHistory(studentId, session, limit = 20) {
        return Refund.find({ student: studentId, session })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('requestedBy', 'name')
            .populate('approvedBy', 'name')
            .populate('processedBy', 'name')
            .populate('payment', 'amount method receiptNumber')
            .lean();
    }

    static async listRefunds(query = {}, limit = 50) {
        return Refund.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('student', 'name rollNumber')
            .populate('payment', 'amount method receiptNumber')
            .lean();
    }
}

module.exports = RefundService;