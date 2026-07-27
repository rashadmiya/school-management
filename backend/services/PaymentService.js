// services/PaymentService.js - COMPLETE REWRITE
const mongoose = require('mongoose');
const Payment = require('../financeSystem/models/Payment');
const PaymentAllocation = require('../financeSystem/models/PaymentAllocation');
const FeeInstance = require('../financeSystem/models/FeeInstance');
const AdvanceBalance = require('../financeSystem/models/AdvanceBalance');
const LedgerService = require('./LedgerService');
const TransactionService = require('./TransactionService');
const Student = require('../models/Student');

class PaymentService {
  static async receivePayment(paymentData, userId) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const { studentId, amount, method, methodDetails, reference, notes, session: sessionYear } = paymentData;

      // Validate
      if (amount <= 0) throw new Error('Payment amount must be positive');

      // Generate transaction ID
      const transactionId = await TransactionService.createTransactionId('payment', userId);

      // Check for duplicate transaction
      const existingPayment = await Payment.findOne({ transactionId }).session(session);
      if (existingPayment) {
        return existingPayment; // Idempotent return
      }

      await TransactionService.beginTransaction(transactionId, 'payment', {
        userId,
        studentId,
        amount
      });

      const currentSession = sessionYear || this.getCurrentSession();

      // Create payment record
      const payment = new Payment({
        student: studentId,
        amount,
        currency: 'BDT',
        method,
        methodDetails,
        reference,
        transactionId,
        receivedBy: userId,
        status: 'completed',
        session: currentSession,
        notes
      });

      await payment.save({ session });

      // Create ledger entry for payment
      await LedgerService.createEntry({
        student: studentId,
        transactionId,
        type: 'payment',
        credit: amount,
        refModel: 'Payment',
        refId: payment._id,
        description: `Payment received via ${method}`,
        createdBy: userId,
        session: currentSession
      }, session);

      // Allocate payment
      const allocationResult = await this.allocatePayment(
        studentId,
        amount,
        payment._id,
        transactionId,
        userId,
        currentSession,
        session
      );

      // Update payment with allocation details
      payment.allocatedAmount = allocationResult.allocatedAmount;
      payment.advanceAmount = allocationResult.advanceAmount;
      await payment.save({ session });

      // Handle advance balance if any
      if (allocationResult.advanceAmount > 0) {
        await this.addToAdvanceBalance(
          studentId,
          allocationResult.advanceAmount,
          payment._id,
          transactionId,
          userId,
          currentSession,
          session
        );
      }

      await TransactionService.completeTransaction(transactionId, {
        paymentId: payment._id,
        allocations: allocationResult.allocations.length,
        advanceAmount: allocationResult.advanceAmount
      });

      await session.commitTransaction();

      return {
        payment,
        allocations: allocationResult.allocations,
        advanceAmount: allocationResult.advanceAmount
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

  static async allocatePayment(studentId, amount, paymentId, transactionId, userId, sessionYear, dbSession) {
    let remaining = amount;
    const allocations = [];
    let allocatedAmount = 0;

    // Get unpaid fees sorted by due date (oldest first)
    const fees = await FeeInstance.find({
      student: studentId,
      status: { $in: ['unpaid', 'partial', 'overdue'] },
      dueAmount: { $gt: 0 },
      session: sessionYear,
      isActive: true
    })
      .sort({ dueDate: 1, createdAt: 1 })
      .session(dbSession);

    for (const fee of fees) {
      if (remaining <= 0) break;

      const maxAllocatable = fee.dueAmount;
      const allocateNow = Math.min(maxAllocatable, remaining);

      if (allocateNow <= 0) continue;

      // Update fee instance
      fee.paidAmount += allocateNow;
      fee.dueAmount = fee.totalAmount - fee.paidAmount - fee.waivedAmount - fee.advanceUsed;

      // Update status
      if (fee.dueAmount <= 0) {
        fee.status = 'paid';
        fee.paidDate = new Date();
      } else if (fee.paidAmount > 0) {
        fee.status = 'partial';
      }

      await fee.save({ session: dbSession });

      // Create payment allocation record
      const allocation = new PaymentAllocation({
        payment: paymentId,
        feeInstance: fee._id,
        student: studentId,
        amount: allocateNow,
        allocatedBy: userId,
        transactionId,
        session: sessionYear
      });

      await allocation.save({ session: dbSession });

      // Add allocation to fee instance
      fee.paymentAllocations.push(allocation._id);
      await fee.save({ session: dbSession });

      // Create ledger entry for allocation
      await LedgerService.createEntry({
        student: studentId,
        transactionId,
        type: 'payment',
        credit: allocateNow,
        refModel: 'PaymentAllocation',
        refId: allocation._id,
        description: `Payment allocation to fee: ${fee.feeTemplate}`,
        createdBy: userId,
        session: sessionYear
      }, dbSession);

      allocations.push(allocation);
      allocatedAmount += allocateNow;
      remaining -= allocateNow;
    }

    return {
      allocations,
      allocatedAmount,
      advanceAmount: remaining,
      remaining
    };
  }

  static async addToAdvanceBalance(studentId, amount, paymentId, transactionId, userId, sessionYear, dbSession) {
    // Get or create advance balance
    let advanceBalance = await AdvanceBalance.findOne({ student: studentId }).session(dbSession);

    if (!advanceBalance) {
      advanceBalance = new AdvanceBalance({
        student: studentId,
        amount: 0,
        session: sessionYear,
        transactions: []
      });
    }

    const previousBalance = advanceBalance.amount;
    const newBalance = previousBalance + amount;

    // Update advance balance
    advanceBalance.amount = newBalance;
    advanceBalance.lastUpdated = new Date();

    // Add transaction record
    advanceBalance.transactions.push({
      type: 'credit',
      amount,
      previousBalance,
      newBalance,
      paymentId,
      transactionId,
      description: `Advance from payment ${paymentId}`,
      createdAt: new Date()
    });

    await advanceBalance.save({ session: dbSession });

    // Create ledger entry for advance credit
    await LedgerService.createEntry({
      student: studentId,
      transactionId,
      type: 'advance_credit',
      credit: amount,
      refModel: 'AdvanceBalance',
      refId: advanceBalance._id,
      description: `Advance balance credit`,
      createdBy: userId,
      session: sessionYear
    }, dbSession);

    return advanceBalance;
  }
  static async getPaymentHistory(studentId, sessionYear, limit = 50) {
    return Payment.find({
      student: studentId,
      session: sessionYear
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('receivedBy', 'name email')
      .lean();
  }

  static async getPaymentAllocations(paymentId) {
    return PaymentAllocation.find({ payment: paymentId })
      .populate('feeInstance', 'totalAmount dueAmount status')
      .lean();
  }


  static getCurrentSession() {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${currentYear + 1}`;
  }

  static async autoApplyAdvanceBalance(studentId, userId) {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const advanceBalance = await AdvanceBalance.findOne({ student: studentId }).session(session);
        if (!advanceBalance || advanceBalance.amount <= 0) {
            await session.commitTransaction();
            return { applied: false, message: 'No advance balance available' };
        }

        const fees = await FeeInstance.find({
            student: studentId,
            status: { $in: ['unpaid', 'partial', 'overdue'] },
            dueAmount: { $gt: 0 },
            isActive: true
        })
            .sort({ dueDate: 1 })
            .session(session);

        let remainingAdvance = advanceBalance.amount;
        const appliedFees = [];

        for (const fee of fees) {
            if (remainingAdvance <= 0) break;

            const applicableAmount = Math.min(fee.dueAmount, remainingAdvance);

            if (applicableAmount > 0) {
                // Use the extracted core logic
                const result = await this.applyAdvanceCore(
                    studentId,
                    fee._id,
                    applicableAmount,
                    userId,
                    session // Pass the session, don't create new one
                );

                remainingAdvance -= applicableAmount;
                appliedFees.push({
                    feeInstanceId: fee._id,
                    amount: applicableAmount
                });
            }
        }

        await session.commitTransaction();

        return {
            applied: appliedFees.length > 0,
            appliedFees,
            totalApplied: advanceBalance.amount - remainingAdvance,
            remainingAdvance
        };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

// EXTRACTED CORE LOGIC - Used by both standalone and batch operations
static async applyAdvanceCore(studentId, feeInstanceId, amount, userId, dbSession) {
    const transactionId = await TransactionService.createTransactionId('advance_debit', userId);

    try {
        await TransactionService.beginTransaction(transactionId, 'advance_debit', {
            userId,
            studentId,
            feeInstanceId,
            amount
        });

        // Get advance balance WITHIN the same session
        let advanceBalance = await AdvanceBalance.findOne({ student: studentId }).session(dbSession);
        
        if (!advanceBalance) {
            throw new Error('No advance balance found');
        }

        if (advanceBalance.amount < amount) {
            throw new Error(`Insufficient advance balance. Available: ${advanceBalance.amount}, Requested: ${amount}`);
        }

        // Get fee instance
        const feeInstance = await FeeInstance.findById(feeInstanceId).session(dbSession);
        if (!feeInstance) throw new Error('Fee instance not found');

        if (feeInstance.student.toString() !== studentId) {
            throw new Error('Fee instance does not belong to student');
        }

        // Update fee instance
        feeInstance.advanceUsed += amount;
        feeInstance.dueAmount = feeInstance.totalAmount - feeInstance.paidAmount - feeInstance.waivedAmount - feeInstance.advanceUsed;

        if (feeInstance.dueAmount <= 0) {
            feeInstance.status = 'paid';
            feeInstance.paidDate = new Date();
        }

        await feeInstance.save({ session: dbSession });

        // Update advance balance
        const previousBalance = advanceBalance.amount;
        const newBalance = previousBalance - amount;

        advanceBalance.amount = newBalance;
        advanceBalance.lastUpdated = new Date();

        advanceBalance.transactions.push({
            type: 'debit',
            amount: amount,
            previousBalance: previousBalance,
            newBalance: newBalance,
            feeInstanceId: feeInstanceId,
            transactionId: transactionId,
            description: `Advance used for fee: ${feeInstance.feeTemplate}`,
            createdAt: new Date()
        });

        await advanceBalance.save({ session: dbSession });

        // Create ledger entry
        await LedgerService.createEntry({
            student: studentId,
            transactionId: transactionId,
            type: 'advance_debit',
            debit: amount,
            refModel: 'FeeInstance',
            refId: feeInstance._id,
            description: `Advance balance used for fee`,
            createdBy: userId,
            session: feeInstance.session
        }, dbSession);

        await TransactionService.completeTransaction(transactionId, {
            feeInstanceId: feeInstanceId,
            amountUsed: amount,
            remainingAdvance: newBalance
        });

        return {
            feeInstance,
            advanceBalance,
            amountUsed: amount,
            remainingAdvance: newBalance
        };

    } catch (error) {
        await TransactionService.failTransaction(transactionId, error);
        throw error;
    }
}

// MODIFIED useAdvanceBalance to use the core logic
static async useAdvanceBalance(studentId, feeInstanceId, amount, userId) {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const result = await this.applyAdvanceCore(
            studentId,
            feeInstanceId,
            amount,
            userId,
            session
        );

        await session.commitTransaction();
        return result;

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}
  // new service method ends here

  // FIX getStudentAdvanceBalance method
  static async getStudentAdvanceBalance(studentId) {
    try {
      console.log('Getting advance balance for student:', studentId);

      let advanceBalance = await AdvanceBalance.findOne({ student: studentId })
        .select('amount currency lastUpdated transactions')
        .lean();

      console.log('Found advance balance:', advanceBalance);

      // If no advance balance exists, create default structure
      if (!advanceBalance) {
        console.log('No advance balance found, creating default');
        advanceBalance = {
          amount: 0,
          currency: 'BDT',
          lastUpdated: new Date(),
          transactions: []
        };
      }

      return advanceBalance;
    } catch (error) {
      console.error('Error getting advance balance:', error);
      throw error;
    }
  }

  // Add helper method to PaymentService.js
  static async getStudentSession(studentId) {
    const student = await Student.findById(studentId).select('session');
    return student?.session || this.getCurrentSession();
  }


}

module.exports = PaymentService;

  // these are working drafts for autoApplyAdvanceBalance and useAdvanceBalance methods
  // replace the existing ones with these improved versions (for session duplicates issue)
  // static async autoApplyAdvanceBalance(studentId, userId) {
  //   const session = await mongoose.startSession();

  //   try {
  //     session.startTransaction();

  //     const advanceBalance = await AdvanceBalance.findOne({ student: studentId }).session(session);
  //     if (!advanceBalance || advanceBalance.amount <= 0) {
  //       return { applied: false, message: 'No advance balance available' };
  //     }

  //     const fees = await FeeInstance.find({
  //       student: studentId,
  //       status: { $in: ['unpaid', 'partial', 'overdue'] },
  //       dueAmount: { $gt: 0 },
  //       isActive: true
  //     })
  //       .sort({ dueDate: 1 })
  //       .session(session);

  //     let remainingAdvance = advanceBalance.amount;
  //     const appliedFees = [];

  //     for (const fee of fees) {
  //       if (remainingAdvance <= 0) break;

  //       const applicableAmount = Math.min(fee.dueAmount, remainingAdvance);

  //       if (applicableAmount > 0) {
  //         await this.useAdvanceBalance(
  //           studentId,
  //           fee._id,
  //           applicableAmount,
  //           userId
  //         );

  //         remainingAdvance -= applicableAmount;
  //         appliedFees.push({
  //           feeInstanceId: fee._id,
  //           amount: applicableAmount
  //         });
  //       }
  //     }

  //     await session.commitTransaction();

  //     return {
  //       applied: appliedFees.length > 0,
  //       appliedFees,
  //       totalApplied: advanceBalance.amount - remainingAdvance,
  //       remainingAdvance
  //     };

  //   } catch (error) {
  //     await session.abortTransaction();
  //     throw error;
  //   } finally {
  //     session.endSession();
  //   }
  // };

  //   // Also fix useAdvanceBalance method 
  // static async useAdvanceBalance(studentId, feeInstanceId, amount, userId) {
  //   const session = await mongoose.startSession();

  //   try {
  //     session.startTransaction();
  //     console.log('Using advance balance:', { studentId, feeInstanceId, amount });

  //     const transactionId = await TransactionService.createTransactionId('advance_debit', userId);

  //     await TransactionService.beginTransaction(transactionId, 'advance_debit', {
  //       userId,
  //       studentId,
  //       feeInstanceId,
  //       amount
  //     });

  //     // Get or create advance balance
  //     let advanceBalance = await AdvanceBalance.findOne({ student: studentId }).session(session);

  //     if (!advanceBalance) {
  //       console.log('Creating new advance balance for student');
  //       advanceBalance = new AdvanceBalance({
  //         student: studentId,
  //         amount: 0,
  //         currency: 'BDT',
  //         session: await this.getStudentSession(studentId), // Helper method needed
  //         transactions: []
  //       });
  //     }

  //     console.log('Current advance balance:', advanceBalance.amount);

  //     if (advanceBalance.amount < amount) {
  //       throw new Error(`Insufficient advance balance. Available: ${advanceBalance.amount}, Requested: ${amount}`);
  //     }

  //     // Get fee instance
  //     const feeInstance = await FeeInstance.findById(feeInstanceId).session(session);
  //     if (!feeInstance) throw new Error('Fee instance not found');

  //     if (feeInstance.student.toString() !== studentId) {
  //       throw new Error('Fee instance does not belong to student');
  //     }

  //     // Update fee instance
  //     feeInstance.advanceUsed += amount;
  //     feeInstance.dueAmount = feeInstance.totalAmount - feeInstance.paidAmount - feeInstance.waivedAmount - feeInstance.advanceUsed;

  //     if (feeInstance.dueAmount <= 0) {
  //       feeInstance.status = 'paid';
  //       feeInstance.paidDate = new Date();
  //     }

  //     await feeInstance.save({ session });

  //     // Update advance balance
  //     const previousBalance = advanceBalance.amount;
  //     const newBalance = previousBalance - amount;

  //     advanceBalance.amount = newBalance;
  //     advanceBalance.lastUpdated = new Date();

  //     advanceBalance.transactions.push({
  //       type: 'debit',
  //       amount: amount,
  //       previousBalance: previousBalance,
  //       newBalance: newBalance,
  //       feeInstanceId: feeInstanceId,
  //       transactionId: transactionId,
  //       description: `Advance used for fee: ${feeInstance.feeTemplate}`,
  //       createdAt: new Date()
  //     });

  //     await advanceBalance.save({ session });

  //     // Create ledger entry
  //     await LedgerService.createEntry({
  //       student: studentId,
  //       transactionId: transactionId,
  //       type: 'advance_debit',
  //       debit: amount,
  //       refModel: 'FeeInstance',
  //       refId: feeInstance._id,
  //       description: `Advance balance used for fee`,
  //       createdBy: userId,
  //       session: feeInstance.session
  //     }, session);

  //     await TransactionService.completeTransaction(transactionId, {
  //       feeInstanceId: feeInstanceId,
  //       amountUsed: amount,
  //       remainingAdvance: newBalance
  //     });

  //     await session.commitTransaction();
  //     console.log('Advance balance used successfully');

  //     return {
  //       feeInstance,
  //       advanceBalance,
  //       amountUsed: amount,
  //       remainingAdvance: newBalance
  //     };

  //   } catch (error) {
  //     await session.abortTransaction();
  //     console.error('Error using advance balance:', error);

  //     if (error.transactionId) {
  //       await TransactionService.failTransaction(error.transactionId, error);
  //     }

  //     throw error;
  //   } finally {
  //     session.endSession();
  //   }
  // }