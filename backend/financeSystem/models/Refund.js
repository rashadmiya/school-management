// financeSystem/models/Refund.js (rewritten)
const mongoose = require('mongoose');
const { moneyPlugin, Decimal128 } = require('../../utils/moneySchemaPlugin');
const Counter = require('../models/Counter');

const refundSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    amount: { type: Decimal128, required: true, min: 0 },
    reason: { type: String, required: true },
    description: String,

    status: {
        type: String,
        enum: ['pending', 'approved', 'processed', 'rejected', 'cancelled'],
        default: 'pending',
        index: true,
    },

    // Approval workflow
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedAt: { type: Date, default: Date.now },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionReason: String,

    // Processing
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: Date,
    method: {
        type: String,
        enum: ['cash', 'bank_transfer', 'check', 'mobile_banking', 'adjustment'],
    },
    methodDetails: mongoose.Schema.Types.Mixed,
    reference: String,
    refundNumber: { type: String, unique: true, sparse: true, index: true },

    // Summary link
    transactionId: String,
    session: { type: String, required: true, index: true },

    // Idempotency
    idempotencyKey: { type: String, sparse: true, index: true },

    // Revisions
    revisionHistory: [{
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: Date,
        changes: mongoose.Schema.Types.Mixed,
        reason: String,
    }],
}, { timestamps: true });

refundSchema.plugin(moneyPlugin);

refundSchema.index({ student: 1, status: 1 });
refundSchema.index({ payment: 1 });
refundSchema.index({ session: 1, status: 1 });

refundSchema.statics.generateRefundNumber = async function (session, dbSession) {
    const seq = await Counter.getNext(`refund_${session}`, dbSession);
    const year = session.split('-')[0];
    return `REF-${year}-${String(seq).padStart(6, '0')}`;
};

module.exports = mongoose.model('Refund', refundSchema);