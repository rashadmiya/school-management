// services/RefundService.js - COMPLETE REWRITE
const mongoose = require('mongoose');
const Refund = require('../financeSystem/models/Refund');
const Payment = require("../financeSystem/models/Payment")
const PaymentAllocation = require('../financeSystem/models/PaymentAllocation');
const FeeInstance = require('../financeSystem/models/FeeInstance');
const AdvanceBalance = require('../financeSystem/models/AdvanceBalance');
const LedgerService = require('./LedgerService');
const TransactionService = require('./TransactionService');

class RefundService {
    static async processRefund(refundData, userId) {
        const session = await mongoose.startSession();
        
        try {
            session.startTransaction();
            
            const { paymentId, amount, reason, description } = refundData;
            
            // Validate
            if (amount <= 0) throw new Error('Refund amount must be positive');
            
            // Get payment
            const payment = await Payment.findById(paymentId).session(session);
            if (!payment) throw new Error('Payment not found');
            
            if (payment.status === 'reversed') {
                throw new Error('Payment has already been reversed');
            }
            
            // Check refundable amount
            const refundableAmount = payment.amount - payment.refundedAmount;
            if (amount > refundableAmount) {
                throw new Error(`Maximum refundable amount is ${refundableAmount}`);
            }
            
            // Generate transaction ID
            const transactionId = await TransactionService.createTransactionId('refund', userId);
            
            await TransactionService.beginTransaction(transactionId, 'refund', {
                userId,
                paymentId,
                amount
            });
            
            // Create refund record
            const refund = new Refund({
                student: payment.student,
                payment: paymentId,
                amount,
                reason,
                description,
                refundedBy: userId,
                transactionId,
                session: payment.session
            });
            
            await refund.save({ session });
            
            // Update payment refund tracking
            payment.refundedAmount += amount;
            if (payment.refundedAmount >= payment.amount) {
                payment.isFullyRefunded = true;
            }
            
            await payment.save({ session });
            
            // Handle refund allocation (reverse allocations if needed)
            const allocationResult = await this.handleRefundAllocation(
                paymentId,
                amount,
                refund._id,
                transactionId,
                userId,
                payment.session,
                session
            );
            
            // Create ledger entry for refund
            await LedgerService.createEntry({
                student: payment.student,
                transactionId,
                type: 'refund',
                debit: amount,
                refModel: 'Refund',
                refId: refund._id,
                description: `Refund: ${reason}`,
                createdBy: userId,
                session: payment.session
            }, session);
            
            // Handle any remaining amount as advance deduction
            if (allocationResult.remaining > 0) {
                await this.deductFromAdvanceBalance(
                    payment.student,
                    allocationResult.remaining,
                    refund._id,
                    transactionId,
                    userId,
                    payment.session,
                    session
                );
            }
            
            await TransactionService.completeTransaction(transactionId, {
                refundId: refund._id,
                reversedAllocations: allocationResult.reversedAllocations,
                advanceDeducted: allocationResult.remaining
            });
            
            await session.commitTransaction();
            
            return {
                refund,
                allocationResult
            };
            
        } catch (error) {
            await session.abortTransaction();
            
            if (error.transactionId) {
                await TransactionService.failTransaction(error.transactionId, error);
            }
            
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async handleRefundAllocation(paymentId, refundAmount, refundId, transactionId, userId, sessionYear, dbSession) {
        let remaining = refundAmount;
        const reversedAllocations = [];
        
        // Get allocations for this payment, newest first (LIFO)
        const allocations = await PaymentAllocation.find({
            payment: paymentId,
            isReversed: false
        })
        .sort({ _id: -1 })
        .session(dbSession);
        
        for (const allocation of allocations) {
            if (remaining <= 0) break;
            
            const feeInstance = await FeeInstance.findById(allocation.feeInstance).session(dbSession);
            if (!feeInstance) continue;
            
            // Determine how much to reverse from this allocation
            const maxReversible = Math.min(allocation.amount, feeInstance.paidAmount, remaining);
            
            if (maxReversible <= 0) continue;
            
            // Update fee instance
            feeInstance.paidAmount -= maxReversible;
            feeInstance.dueAmount = feeInstance.totalAmount - feeInstance.paidAmount - feeInstance.waivedAmount - feeInstance.advanceUsed;
            
            // Update status
            if (feeInstance.paidAmount <= 0 && feeInstance.waivedAmount <= 0 && feeInstance.advanceUsed <= 0) {
                feeInstance.status = 'unpaid';
                feeInstance.paidDate = null;
            } else if (feeInstance.paidAmount > 0) {
                feeInstance.status = 'partial';
            }
            
            await feeInstance.save({ session: dbSession });
            
            // Mark allocation as reversed
            allocation.isReversed = true;
            allocation.reversalTransactionId = transactionId;
            allocation.reversalReason = 'Refund processed';
            allocation.reversedAt = new Date();
            allocation.reversedBy = userId;
            
            await allocation.save({ session: dbSession });
            
            // Create reversed allocation record (optional - for audit)
            const reversedAllocation = new PaymentAllocation({
                payment: paymentId,
                feeInstance: feeInstance._id,
                student: feeInstance.student,
                amount: -maxReversible, // Negative amount to indicate reversal
                allocatedBy: userId,
                transactionId,
                isReversed: false, // This is the reversal record itself
                description: `Reversal of allocation ${allocation._id} due to refund`,
                session: sessionYear
            });
            
            await reversedAllocation.save({ session: dbSession });
            
            // Create ledger entry for reversal
            await LedgerService.createEntry({
                student: feeInstance.student,
                transactionId,
                type: 'refund',
                debit: maxReversible,
                refModel: 'PaymentAllocation',
                refId: reversedAllocation._id,
                description: `Refund allocation reversal`,
                createdBy: userId,
                session: sessionYear
            }, dbSession);
            
            reversedAllocations.push({
                allocationId: allocation._id,
                feeInstanceId: feeInstance._id,
                amount: maxReversible
            });
            
            remaining -= maxReversible;
        }
        
        return {
            reversedAllocations,
            remaining,
            reversedAmount: refundAmount - remaining
        };
    }

    static async deductFromAdvanceBalance(studentId, amount, refundId, transactionId, userId, sessionYear, dbSession) {
        const advanceBalance = await AdvanceBalance.findOne({ student: studentId }).session(dbSession);
        
        if (!advanceBalance || advanceBalance.amount < amount) {
            throw new Error('Insufficient advance balance for refund deduction');
        }
        
        const previousBalance = advanceBalance.amount;
        const newBalance = previousBalance - amount;
        
        // Update advance balance
        advanceBalance.amount = newBalance;
        advanceBalance.lastUpdated = new Date();
        
        advanceBalance.transactions.push({
            type: 'debit',
            amount,
            previousBalance,
            newBalance,
            refundId,
            transactionId,
            description: `Advance deducted for refund ${refundId}`,
            createdAt: new Date()
        });
        
        await advanceBalance.save({ session: dbSession });
        
        // Create ledger entry
        await LedgerService.createEntry({
            student: studentId,
            transactionId,
            type: 'advance_debit',
            debit: amount,
            refModel: 'AdvanceBalance',
            refId: advanceBalance._id,
            description: `Advance balance deduction for refund`,
            createdBy: userId,
            session: sessionYear
        }, dbSession);
        
        return advanceBalance;
    }

    static async getRefundHistory(studentId, sessionYear, limit = 20) {
        return Refund.find({
            student: studentId,
            session: sessionYear
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('refundedBy', 'name email')
        .populate('payment', 'amount method reference')
        .lean();
    }

    static async validateRefund(paymentId, amount) {
        const payment = await Payment.findById(paymentId);
        if (!payment) return { valid: false, reason: 'Payment not found' };
        
        const refundableAmount = payment.amount - payment.refundedAmount;
        
        if (amount > refundableAmount) {
            return {
                valid: false,
                reason: `Amount exceeds refundable limit. Maximum: ${refundableAmount}`
            };
        }
        
        // Check if payment has allocations that can be reversed
        const allocations = await PaymentAllocation.find({
            payment: paymentId,
            isReversed: false
        });
        
        if (allocations.length === 0 && payment.advanceAmount === 0) {
            return {
                valid: false,
                reason: 'Payment has no allocations to reverse'
            };
        }
        
        return {
            valid: true,
            refundableAmount,
            hasAdvance: payment.advanceAmount > 0
        };
    }
}

module.exports = RefundService;

// const Refund = require("../models/Refund");
// const LedgerService = require("./LedgerService");
// const Payment = require("../models/Payment");

// class RefundService {

//   static async refund({ paymentId, amount, reason }, user) {
//     const payment = await Payment.findById(paymentId);
//     if (!payment) throw new Error("Payment not found");

//     if (amount <= 0 || amount > payment.amount) {
//       throw new Error("Invalid refund amount");
//     }

//     const refund = await Refund.create({
//       student: payment.student,
//       payment: payment._id,
//       amount,
//       reason,
//       refundedBy: user._id
//     });

//     // ledger: refund increases balance again (debit)
//     await LedgerService.createEntry({
//       student: payment.student,
//       type: "refund",
//       debit: amount,
//       refModel: "Refund",
//       refId: refund._id
//     });

//     return refund;
//   }
// }

// module.exports = RefundService;
