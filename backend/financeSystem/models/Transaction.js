// models/Transaction.js - For idempotency
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    type: {
        type: String,
        enum: ['payment', 'refund', 'waiver', 'fee_creation', 'allocation'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'reversed'],
        default: 'pending'
    },
    data: mongoose.Schema.Types.Mixed,
    metadata: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        ipAddress: String,
        userAgent: String
    },
    error: String,
    retryCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Auto-expire after 30 days for cleanup
transactionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Transaction', transactionSchema);