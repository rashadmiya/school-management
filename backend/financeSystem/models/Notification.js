// financeSystem/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', index: true },  // ← add
    type: {
        type: String,
        enum: [
            'payment_received',
            'fee_created',
            'fee_due_soon',
            'fee_overdue',
            'waiver_requested',
            'waiver_approved',
            'waiver_rejected',
            'refund_processed',
            'advance_credited',
            'daily_summary',
        ],
        required: true,
    },

    channel: {
        type: String,
        enum: ['email', 'sms', 'in_app'],
        required: true,
    },

    recipient: String,              // email address or phone number
    subject: String,
    body: String,

    status: {
        type: String,
        enum: ['queued', 'sending', 'sent', 'failed'],
        default: 'queued',
        index: true,
    },

    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastError: String,
    sentAt: Date,

    // For in-app
    readAt: Date,

    // Context
    refModel: String,
    refId: mongoose.Schema.Types.ObjectId,
    metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);