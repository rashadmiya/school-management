// services/PaymentService.js
const mongoose = require('mongoose');
const Payment = require('../financeSystem/models/Payment');
const PaymentAllocation = require('../financeSystem/models/PaymentAllocation');
const FeeInstance = require('../financeSystem/models/FeeInstance');
const AdvanceBalance = require('../financeSystem/models/AdvanceBalance');
const StudentFinanceSummaryService = require('./StudentFinanceSummaryService');
const TransactionService = require('./TransactionService');
const { toDecimal, toDecimal128, round, min } = require('../utils/decimal');
const { getCurrentSession } = require('../utils/accademicSession');
const AuditService = require('../financeSystem/services/AuditService')
const Student = require('../models/Student');
const { signReceiptToken } = require('../utils/receiptToken')
const NotificationService = require("../financeSystem/services/NotificationService")

class PaymentService {
    static async receivePayment(paymentData, userId, idempotencyKey = undefined) {
        const dbSession = await mongoose.startSession();

        try {
            dbSession.startTransaction();

            const {
                studentId, amount, method, methodDetails,
                reference, notes, session: sessionYear,
            } = paymentData;

            const payAmount = toDecimal(amount);
            if (payAmount.lte(0)) throw new Error('Payment amount must be positive');

            const currentSession = sessionYear || getCurrentSession();

            // 1. Idempotency at payment layer
            if (idempotencyKey) {
                const existing = await Payment.findOne({ idempotencyKey }).session(dbSession);
                if (existing) {
                    await dbSession.commitTransaction();
                    return { payment: existing, allocations: [], advanceAmount: 0, idempotent: true };
                }
            }

            // 2. Transaction record
            const transactionId = await TransactionService.createTransactionId('payment', userId);
            await TransactionService.beginTransaction(transactionId, 'payment', {
                userId, studentId, amount: payAmount.toString(),
            });

            // 3. Receipt number (sequential, inside txn)
            const receiptNumber = await Payment.generateReceiptNumber(currentSession, dbSession);

            // 4. Create payment
            // const [payment] = await Payment.create([{
            //     student: studentId,
            //     amount: toDecimal128(payAmount),
            //     method,
            //     methodDetails,
            //     reference,
            //     transactionId,
            //     idempotencyKey,
            //     receiptNumber,
            //     receivedBy: userId,
            //     status: 'completed',
            //     session: currentSession,
            //     notes,
            // }], { session: dbSession });

            const paymentDoc = {
                student: studentId,
                amount: toDecimal128(payAmount),
                method,
                methodDetails,
                reference,
                transactionId,
                receiptNumber,
                receivedBy: userId,
                status: 'completed',
                session: currentSession,
                notes,
            };
            // Only attach the key when we actually have one — a null value would
            // still be indexed by a plain unique index.
            if (idempotencyKey) paymentDoc.idempotencyKey = idempotencyKey;

            const [payment] = await Payment.create([paymentDoc], { session: dbSession });

            // 5. Allocate
            const allocResult = await this._allocate(
                studentId, payAmount, payment._id, transactionId,
                userId, currentSession, dbSession
            );

            // 6. Update payment totals
            payment.allocatedAmount = toDecimal128(allocResult.allocatedAmount);
            payment.advanceAmount = toDecimal128(allocResult.advanceAmount);
            await payment.save({ session: dbSession });


            // 7. Advance balance if leftover
            if (allocResult.advanceAmount.gt(0)) {
                await this._creditAdvance(
                    studentId, allocResult.advanceAmount, payment._id,
                    transactionId, userId, currentSession, dbSession
                );
            }

            // 8. Summary update
            //    Payment increases credit → reduces dueBalance
            //    Advance credit increases advanceBalance (already counted via advanceUsed?)
            await StudentFinanceSummaryService.recordMovement({
                student: studentId,
                session: currentSession,
                transactionId,
                type: 'payment',
                credit: toDecimal128(payAmount),
                refModel: 'Payment',
                refId: payment._id,
                description: `Payment received via ${method}`,
                createdBy: userId,
                summaryDelta: {
                    paid: allocResult.allocatedAmount,
                    advanceBalance: allocResult.advanceAmount,
                },
            }, dbSession);

            // 🔵 AUDIT — payment received
            await AuditService.record({
                action: 'payment.received',
                actor: userId,
                student: studentId,
                refModel: 'Payment',
                refId: payment._id,
                refNumber: payment.receiptNumber,
                after: {
                    amount: payment.amount.toString(),
                    method: payment.method,
                    allocated: payment.allocatedAmount.toString(),
                    advance: payment.advanceAmount.toString(),
                    session: currentSession,
                },
                session: currentSession,
                transactionId,
                notes,
            }, dbSession);

            await TransactionService.completeTransaction(transactionId, {
                paymentId: payment._id,
                allocations: allocResult.allocations.length,
                advanceAmount: allocResult.advanceAmount.toString(),
            });

            await dbSession.commitTransaction();

            // 🔔 Notify parent (fire-and-forget; failures don't roll back the payment)
            try {
                const [student, summary] = await Promise.all([
                    Student.findById(studentId)
                        .populate('parent', 'name email phone')
                        .lean(),
                    StudentFinanceSummaryService.getSummary(studentId, currentSession),
                ]);

                const token = signReceiptToken(payment._id);
                await NotificationService.notifyPaymentReceived({
                    payment,
                    summary: {
                        studentName: student?.name,
                        parentName: student?.parent?.name,
                        parentEmail: student?.parent?.email,
                        parentPhone: student?.parent?.phone,
                        dueBalance: summary?.dueBalance,
                    },
                    receiptUrl: `${process.env.PUBLIC_URL}/api/s2/public/receipts/${token}`,
                });
            } catch (err) {
                // Notification failure must never break a completed payment
                console.error('[payment] notification failed', err);
            }

            return {
                payment,
                allocations: allocResult.allocations,
                advanceAmount: allocResult.advanceAmount,
                idempotent: false,
            };

        } catch (e) {
            if (e.code === 11000 && idempotencyKey) {
                const existing = await Payment.findOne({ idempotencyKey }).session(dbSession);
                await dbSession.commitTransaction();
                return { payment: existing, allocations: [], advanceAmount: 0, idempotent: true };
            }
            throw e;
        } finally {
            dbSession.endSession();
        }
    }

    /**
     * Allocate payment against fees — oldest overdue first.
     * All math via decimal.js.
     */
    static async _allocate(studentId, amount, paymentId, transactionId, userId, sessionYear, dbSession) {
        let remaining = toDecimal(amount);
        const allocations = [];
        let allocatedAmount = toDecimal(0);

        const fees = await FeeInstance.find({
            student: studentId,
            status: { $in: ['unpaid', 'partial', 'overdue'] },
            session: sessionYear,
            isActive: true,
        })
            .sort({ dueDate: 1, createdAt: 1 })
            .session(dbSession);

        for (const fee of fees) {
            if (remaining.lte(0)) break;

            const dueNow = toDecimal(fee.dueAmount);
            if (dueNow.lte(0)) continue;

            const take = min(dueNow, remaining);

            // Update fee atomically
            fee.paidAmount = toDecimal128(toDecimal(fee.paidAmount).plus(take));
            fee.recalculate();
            await fee.save({ session: dbSession });

            // Allocation record
            const [allocation] = await PaymentAllocation.create([{
                payment: paymentId,
                feeInstance: fee._id,
                student: studentId,
                amount: toDecimal128(take),
                allocatedBy: userId,
                transactionId,
                session: sessionYear,
            }], { session: dbSession });

            fee.paymentAllocations.push(allocation._id);
            await fee.save({ session: dbSession });

            allocations.push(allocation);
            allocatedAmount = allocatedAmount.plus(take);
            remaining = remaining.minus(take);
        }

        return {
            allocations,
            allocatedAmount,
            advanceAmount: remaining,
        };
    }

    /**
     * Credit advance balance — atomic.
     */
    static async _creditAdvance(studentId, amount, paymentId, transactionId, userId, sessionYear, dbSession) {
        const updated = await AdvanceBalance.findOneAndUpdate(
            { student: studentId, session: sessionYear },
            {
                $inc: { amount: toDecimal128(amount) },
                $set: { lastUpdated: new Date() },
                $push: {
                    transactions: {
                        type: 'credit',
                        amount: toDecimal128(amount),
                        paymentId,
                        transactionId,
                        description: `Advance from payment ${paymentId}`,
                        createdAt: new Date(),
                    },
                },
            },
            { upsert: true, new: true, session: dbSession }
        );

        return updated;
    }

    static async getPaymentAllocations(paymentId) {
        return PaymentAllocation.find({ payment: paymentId })
            .populate('feeInstance', 'title totalAmount dueAmount status')
            .lean();
    }

    static async getStudentAdvanceBalance(studentId, sessionYear) {
        const doc = await AdvanceBalance.findOne({ student: studentId, session: sessionYear }).lean();
        return doc || { amount: 0, currency: 'BDT', transactions: [] };
    }

    static async getPaymentHistory(studentId, sessionYear, limit = 50) {
        return Payment.find({ student: studentId, session: sessionYear })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('receivedBy', 'name email')
            .lean();
    }

    // services/PaymentService.js — add this method

    static async voidPayment(paymentId, reason, userId) {
        const dbSession = await mongoose.startSession();

        try {
            dbSession.startTransaction();

            const payment = await Payment.findById(paymentId).session(dbSession);
            if (!payment) throw new Error('Payment not found');
            if (payment.status === 'voided') throw new Error('Payment already voided');
            if (payment.status === 'reversed') throw new Error('Payment already reversed');
            if (toDecimal(payment.refundedAmount).gt(0)) {
                throw new Error('Cannot void a payment that has been refunded');
            }

            const transactionId = await TransactionService.createTransactionId('payment_void', userId);
            await TransactionService.beginTransaction(transactionId, 'payment_void', {
                userId, paymentId, reason,
            });

            const amount = toDecimal(payment.amount);
            const session = payment.session;

            // Reverse all active allocations
            const allocations = await PaymentAllocation
                .find({ payment: paymentId, isReversed: false })
                .session(dbSession);

            for (const alloc of allocations) {
                const fee = await FeeInstance.findById(alloc.feeInstance).session(dbSession);
                if (!fee) continue;

                const allocAmount = toDecimal(alloc.amount);
                fee.paidAmount = toDecimal128(toDecimal(fee.paidAmount).minus(allocAmount));
                fee.recalculate();
                await fee.save({ session: dbSession });

                alloc.isReversed = true;
                alloc.reversalTransactionId = transactionId;
                alloc.reversalReason = `Voided: ${reason}`;
                alloc.reversedAt = new Date();
                alloc.reversedBy = userId;
                await alloc.save({ session: dbSession });
            }

            // Reverse advance balance if any was credited
            const advanceAmount = toDecimal(payment.advanceAmount);
            if (advanceAmount.gt(0)) {
                const updated = await AdvanceBalance.findOneAndUpdate(
                    { student: payment.student, session, amount: { $gte: toDecimal128(advanceAmount) } },
                    {
                        $inc: { amount: toDecimal128(advanceAmount.negated()) },
                        $set: { lastUpdated: new Date() },
                        $push: {
                            transactions: {
                                type: 'debit',
                                amount: toDecimal128(advanceAmount),
                                paymentId: payment._id,
                                transactionId,
                                description: `Void of payment ${payment._id}`,
                                createdAt: new Date(),
                            },
                        },
                    },
                    { new: true, session: dbSession }
                );
                if (!updated) {
                    throw new Error('Cannot void: advance balance already spent');
                }
            }

            // Mark payment voided
            payment.status = 'voided';
            payment.voidedAt = new Date();
            payment.voidedBy = userId;
            payment.voidReason = reason;
            await payment.save({ session: dbSession });

            const allocAmount = toDecimal(payment.allocatedAmount);
            const advAmount = toDecimal(payment.advanceAmount);

            await StudentFinanceSummaryService.recordMovement({
                student: payment.student,
                session,
                transactionId,
                type: 'adjustment',
                debit: toDecimal128(allocAmount),        // ← was amount
                refModel: 'Payment',
                refId: payment._id,
                description: `Void of payment ${payment.receiptNumber}: ${reason}`,
                createdBy: userId,
                summaryDelta: {
                    paid: allocAmount.negated(),         // ← was amount
                    advanceBalance: advAmount.negated(),
                },
            }, dbSession);

            await AuditService.record({
                action: 'payment.voided',
                actor: userId,
                student: payment.student,
                refModel: 'Payment',
                refId: payment._id,
                refNumber: payment.receiptNumber,
                before: {
                    status: 'completed',
                    amount: payment.amount.toString(),
                    allocated: payment.allocatedAmount.toString(),
                },
                after: {
                    status: 'voided',
                    reason,
                },
                session,
                transactionId,
                reason,
            }, dbSession);

            // // Reverse summary + ledger: this payment's credit goes away
            // await StudentFinanceSummaryService.recordMovement({
            //     student: payment.student,
            //     session,
            //     transactionId,
            //     type: 'adjustment',
            //     debit: toDecimal128(amount),
            //     refModel: 'Payment',
            //     refId: payment._id,
            //     description: `Void of payment ${payment.receiptNumber}: ${reason}`,
            //     createdBy: userId,
            //     summaryDelta: {
            //         paid: amount.negated(),
            //         advanceBalance: advanceAmount.negated(),
            //     },
            // }, dbSession);

            await TransactionService.completeTransaction(transactionId, {
                paymentId: payment._id,
                voidedAmount: amount.toString(),
                reversedAllocations: allocations.length,
            });

            await dbSession.commitTransaction();

            return {
                payment,
                reversedAllocations: allocations.length,
                voidedAmount: amount,
            };

        } catch (error) {
            await dbSession.abortTransaction();
            throw error;
        } finally {
            dbSession.endSession();
        }
    }
}

module.exports = PaymentService;
