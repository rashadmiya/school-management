// models/PaymentAllocation.js - CRITICAL
const mongoose = require('mongoose');

const paymentAllocationSchema = new mongoose.Schema({
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true,
        index: true
    },
    feeInstance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeInstance',
        required: true,
        index: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    allocatedAt: {
        type: Date,
        default: Date.now
    },
    allocatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // For rollback and audit
    transactionId: {
        type: String,
        index: true
    },
    isReversed: {
        type: Boolean,
        default: false
    },
    reversalTransactionId: String,
    reversalReason: String,
    reversedAt: Date,
    reversedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Session tracking
    session: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Prevent duplicate allocations
paymentAllocationSchema.index(
    { payment: 1, feeInstance: 1 }, 
    { unique: true, partialFilterExpression: { isReversed: false } }
);

// For query performance
paymentAllocationSchema.index({ student: 1, allocatedAt: -1 });
paymentAllocationSchema.index({ feeInstance: 1, isReversed: 1 });

module.exports = mongoose.model('PaymentAllocation', paymentAllocationSchema);

