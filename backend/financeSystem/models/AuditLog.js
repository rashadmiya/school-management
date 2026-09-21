// financeSystem/models/AuditLog.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    // What happened
    action: {
        type: String,
        required: true,
        enum: [
            'payment.received',
            'payment.voided',
            'payment.refunded',
            'fee.created',
            'fee.updated',
            'fee.applied',
            'fee.deleted',
            'waiver.requested',
            'waiver.approved',
            'waiver.rejected',
            'waiver.revoked',
            'refund.requested',
            'refund.approved',
            'refund.rejected',
            'refund.processed',
            'advance.credited',
            'advance.debited',
            'advance.reversed',
            'adjustment.created',
            'adjustment.approved',
            'adjustment.rejected',
            'adjustment.applied',
            'fee.template.created',
            'fee.template.updated',
            'fee.template.deleted',
            'fee.template.applied',
            'intent.created',
            'intent.confirmed',
            'intent.failed',
        ],
        index: true,
    },

    // Who
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: String, // snapshot at time of action
    actorIp: String,
    actorUserAgent: String,

    // On what
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', index: true },
    refModel: String,   // 'Payment', 'Refund', 'FeeInstance', etc.
    refId: mongoose.Schema.Types.ObjectId,
    refNumber: String,  // e.g. receipt number, refund number

    // What changed
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    changes: mongoose.Schema.Types.Mixed, // { field: { from, to } }

    // Why
    reason: String,
    notes: String,

    // Context
    session: { type: String, index: true },
    transactionId: String,

    // Time
    createdAt: { type: Date, default: Date.now, index: true },
}, {
    // No updates or deletes — append-only
    strict: true,
});

// Explicitly forbid updates/deletes
auditLogSchema.pre('updateOne', function () {
    throw new Error('AuditLog is append-only; updates are forbidden');
});
auditLogSchema.pre('findOneAndUpdate', function () {
    throw new Error('AuditLog is append-only; updates are forbidden');
});
auditLogSchema.pre('deleteOne', function () {
    throw new Error('AuditLog is append-only; deletes are forbidden');
});
auditLogSchema.pre('deleteMany', function () {
    throw new Error('AuditLog is append-only; deletes are forbidden');
});

// Query indexes
auditLogSchema.index({ refModel: 1, refId: 1 });
auditLogSchema.index({ student: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);