// financeSystem/models/Adjustment.js
const mongoose = require('mongoose');
const { moneyPlugin, Decimal128 } = require('../../utils/moneySchemaPlugin');
const Counter = require('../models/Counter');

const adjustmentSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    session: { type: String, required: true, index: true },

    // What kind of adjustment
    type: {
        type: String,
        enum: ['debit', 'credit'], // debit = student owes more; credit = student owes less
        required: true,
    },

    // Amount
    amount: { type: Decimal128, required: true },

    // Reason & category
    category: {
        type: String,
        enum: ['correction', 'fine', 'write_off', 'scholarship', 'misc', 'late_fee'],
        required: true,
    },
    reason: { type: String, required: true },

    // Optional link to a specific fee
    feeInstance: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeInstance' },

    // Approval
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'applied'],
        default: 'pending',
        index: true,
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionReason: String,
    approvalRemarks: String,
    // Reference
    adjustmentNumber: { type: String, unique: true, sparse: true, index: true },
    transactionId: String,

    // Audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appliedAt: Date,
}, { timestamps: true });

adjustmentSchema.plugin(moneyPlugin);

adjustmentSchema.index({ student: 1, session: 1 });
adjustmentSchema.index({ status: 1, createdAt: -1 });

adjustmentSchema.statics.generateAdjustmentNumber = async function (session, dbSession) {
    const seq = await Counter.getNext(`adjustment_${session}`, dbSession);
    const year = session.split('-')[0];
    return `ADJ-${year}-${String(seq).padStart(6, '0')}`;
};

module.exports = mongoose.model('Adjustment', adjustmentSchema);