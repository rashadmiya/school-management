// UPDATED models/LedgerEntry.js
const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema({
    // Core references
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    // Transaction tracking
    transactionId: {
        type: String,
        required: true,
        // index: true
    },
    type: {
        type: String,
        enum: ['fee', 'payment', 'refund', 'waiver', 'advance_credit', 'advance_debit', 'adjustment', 'late_fee'],
        required: true
    },
    // Amount fields
    debit: {
        type: Number,
        default: 0,
        min: 0
    },
    credit: {
        type: Number,
        default: 0,
        min: 0
    },
    // Balance tracking
    previousBalance: {
        type: Number,
        required: true
    },
    balanceAfter: {
        type: Number,
        required: true
    },
    // References
    refModel: {
        type: String,
        enum: ['FeeInstance', 'Payment', 'Refund', 'FeeWaiver', 'AdvanceBalance', 'PaymentAllocation'],
        required: true
    },
    refId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    // Description for clarity
    description: String,
    // Metadata
    session: {
        type: String,
        required: true,
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // For reversal tracking
    isReversal: {
        type: Boolean,
        default: false
    },
    reversalOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LedgerEntry'
    },
    reversalReason: String
}, {
    timestamps: true
});

// Indexes for performance
ledgerEntrySchema.index({ student: 1, createdAt: -1 });
ledgerEntrySchema.index({ student: 1, transactionId: 1 });
ledgerEntrySchema.index({ refModel: 1, refId: 1 });
ledgerEntrySchema.index({ session: 1, createdAt: -1 });

// Compound index for balance queries
ledgerEntrySchema.index({ student: 1, _id: -1 });

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);