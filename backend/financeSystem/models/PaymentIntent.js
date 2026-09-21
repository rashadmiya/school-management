// financeSystem/models/PaymentIntent.js
const mongoose = require('mongoose');
const { moneyPlugin, Decimal128 } = require('../../utils/moneySchemaPlugin');

const paymentIntentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true,
    },
    amount: { type: Decimal128, required: true, min: 0 },
    currency: { type: String, default: 'BDT' },

    // What is this payment for?
    purpose: {
        type: String,
        enum: ['fee_payment', 'advance_topup', 'other'],
        required: true,
        default: 'fee_payment',
    },
    // Optional explicit fee targets (if parent chooses)
    feeInstances: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeInstance',
    }],

    // How the user plans to pay
    method: {
        type: String,
        enum: ['cash', 'bank_transfer', 'check', 'mobile_banking', 'card', 'online'],
    },
    // Which gateway (only for online)
    gateway: {
        type: String,
        enum: ['cash', 'manual', 'sslcommerz', 'bkash', 'stripe', 'none'],
        default: 'cash',
    },
    gatewayReference: String,        // external ID from gateway
    gatewayPayload: mongoose.Schema.Types.Mixed, // raw webhook / response

    // Lifecycle
    status: {
        type: String,
        enum: ['pending', 'processing', 'succeeded', 'failed', 'expired', 'cancelled'],
        default: 'pending',
        index: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
    completedAt: Date,
    failedAt: Date,
    failureReason: String,

    // Link to actual payment once completed
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
    },

    // Audit
    initiatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    session: { type: String, required: true, index: true },
    notes: String,

    // Idempotency
    // idempotencyKey: { type: String, sparse: true, index: true },
    idempotencyKey: { type: String,},

}, { timestamps: true });

paymentIntentSchema.plugin(moneyPlugin);

paymentIntentSchema.index({ student: 1, status: 1 });
paymentIntentSchema.index({ status: 1, expiresAt: 1 }); // for cron cleanup
paymentIntentSchema.index({ gatewayReference: 1 }, { sparse: true });
paymentIntentSchema.index(
    { idempotencyKey: 1 },
    {
        unique: true,
        partialFilterExpression: { idempotencyKey: { $type: 'string' } },
    }
);

module.exports = mongoose.model('PaymentIntent', paymentIntentSchema);