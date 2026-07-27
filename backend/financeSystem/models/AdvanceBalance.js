// models/AdvanceBalance.js
const mongoose = require('mongoose');

const advanceBalanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    currency: {
        type: String,
        default: 'BDT'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    // Audit trail
    transactions: [{
        type: {
            type: String,
            enum: ['credit', 'debit', 'transfer', 'adjustment']
        },
        amount: Number,
        previousBalance: Number,
        newBalance: Number,
        reference: String,
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment'
        },
        refundId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Refund'
        },
        feeInstanceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FeeInstance'
        },
        description: String,
        transactionId: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    session: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Indexes
advanceBalanceSchema.index({ student: 1, session: 1 });
advanceBalanceSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('AdvanceBalance', advanceBalanceSchema);