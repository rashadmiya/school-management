// financeSystem/models/Payment.js
const mongoose = require('mongoose');
const { moneyPlugin, Decimal128 } = require('../../utils/moneySchemaPlugin');
const Counter = require('../models/Counter');

const paymentSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    amount: { type: Decimal128, required: true, min: 0 },
    currency: { type: String, default: 'BDT' },
    method: {
        type: String,
        enum: ['cash', 'bank_transfer', 'check', 'mobile_banking', 'card', 'online'],
        required: true,
    },
    methodDetails: {
        bankName: String,
        accountNumber: String,
        checkNumber: String,
        transactionId: String,
        mobileOperator: String,
        cardLastFour: String,
    },
    transactionId: { type: String, unique: true, sparse: true, index: true },
    reference: String,
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'reversed', 'voided'],
        default: 'completed',
    },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,

    allocatedAmount: { type: Decimal128, default: 0 },
    advanceAmount: { type: Decimal128, default: 0 },
    refundedAmount: { type: Decimal128, default: 0 },
    isFullyRefunded: { type: Boolean, default: false },

    session: { type: String, required: true, index: true },
    notes: String,
    attachments: [{ name: String, url: String, uploadedAt: Date }],

    receiptNumber: { type: String, unique: true, sparse: true, index: true },

    // For idempotency at the API layer
    // idempotencyKey: { type: String, sparse: true, index: true },
    idempotencyKey: { type: String,},
    // For reversal/void
    voidedAt: Date,
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    voidReason: String,
    reversalOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
}, { timestamps: true });

paymentSchema.plugin(moneyPlugin);

paymentSchema.index({ student: 1, createdAt: -1 });
paymentSchema.index({ method: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ session: 1, createdAt: -1 });

paymentSchema.index(
    { idempotencyKey: 1 },
    {
        unique: true,
        partialFilterExpression: { idempotencyKey: { $type: 'string' } },
    }
);
/**
 * Generate receipt number if not set.
 * MUST be done inside the transaction (see PaymentService).
 */
paymentSchema.statics.generateReceiptNumber = async function (session, dbSession) {
    const seq = await Counter.getNext(`receipt_${session}`, dbSession);
    const year = session.split('-')[0];
    return `RCPT-${year}-${String(seq).padStart(6, '0')}`;
};

module.exports = mongoose.model('Payment', paymentSchema);

// // UPDATED models/Payment.js
// const mongoose = require('mongoose');

// const paymentSchema = new mongoose.Schema({
//     student: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Student',
//         required: true,
//         index: true
//     },
//     amount: {
//         type: Number,
//         required: true,
//         min: 0
//     },
//     currency: {
//         type: String,
//         default: 'BDT'
//     },
//     method: {
//         type: String,
//         enum: ['cash', 'bank_transfer', 'check', 'mobile_banking', 'card', 'online'],
//         required: true
//     },
//     methodDetails: {
//         bankName: String,
//         accountNumber: String,
//         checkNumber: String,
//         transactionId: String,
//         mobileOperator: String,
//         cardLastFour: String
//     },
//     // For idempotency
//     transactionId: {
//         type: String,
//         unique: true,
//         sparse: true,
//         index: true
//     },
//     reference: {
//         type: String
//     },
//     status: {
//         type: String,
//         enum: ['pending', 'completed', 'failed', 'reversed'],
//         default: 'completed'
//     },
//     receivedBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     },
//     verifiedBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User'
//     },
//     verifiedAt: Date,
//     // Allocation tracking
//     allocatedAmount: {
//         type: Number,
//         default: 0
//     },
//     advanceAmount: {
//         type: Number,
//         default: 0
//     },
//     // Session
//     session: {
//         type: String,
//         required: true,
//         index: true
//     },
//     // Metadata
//     notes: String,
//     attachments: [{
//         name: String,
//         url: String,
//         uploadedAt: Date
//     }],
//     // For refund tracking
//     refundedAmount: {
//         type: Number,
//         default: 0
//     },
//     isFullyRefunded: {
//         type: Boolean,
//         default: false
//     },
//     receiptNumber: {
//         type: String,
//         unique: true,
//         required: false,
//         index: true
//     }

// }, {
//     timestamps: true
// });

// // Indexes
// paymentSchema.index({ student: 1, createdAt: -1 });
// paymentSchema.index({ method: 1, createdAt: -1 });
// paymentSchema.index({ status: 1 });
// paymentSchema.index({ session: 1, createdAt: -1 });

// // Virtual for remaining refundable amount
// paymentSchema.virtual('refundableAmount').get(function () {
//     return this.amount - this.refundedAmount;
// });

// paymentSchema.pre('save', function (next) {
//     if (!this.receiptNumber) {
//         this.receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`
//     }
//     next()
// })

// module.exports = mongoose.model('Payment', paymentSchema);