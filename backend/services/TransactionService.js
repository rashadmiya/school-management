// services/TransactionService.js - For idempotency
const Transaction = require('../financeSystem/models/Transaction');
const { v4: uuidv4 } = require('uuid');

class TransactionService {
    static async createTransactionId(type, userId) {
        return `${type}_${uuidv4()}_${Date.now()}`;
    }

    static async beginTransaction(transactionId, type, metadata = {}) {
        const transaction = await Transaction.findOneAndUpdate(
            { transactionId },
            {
                $setOnInsert: {
                    transactionId,
                    type,
                    status: 'pending',
                    metadata
                }
            },
            { upsert: true, new: true }
        );

        // If transaction already exists and is completed, throw error
        if (transaction.status === 'completed') {
            throw new Error(`Transaction ${transactionId} already completed`);
        }

        return transaction;
    }

    static async completeTransaction(transactionId, result) {
        return Transaction.findOneAndUpdate(
            { transactionId },
            {
                status: 'completed',
                data: result,
                $inc: { retryCount: 1 }
            },
            { new: true }
        );
    }

    static async failTransaction(transactionId, error) {
        return Transaction.findOneAndUpdate(
            { transactionId },
            {
                status: 'failed',
                error: error.message,
                $inc: { retryCount: 1 }
            },
            { new: true }
        );
    }
}

module.exports = TransactionService;