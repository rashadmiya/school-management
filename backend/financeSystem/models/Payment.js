// UPDATED models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
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
    currency: {
        type: String,
        default: 'BDT'
    },
    method: {
        type: String,
        enum: ['cash', 'bank_transfer', 'check', 'mobile_banking', 'card', 'online'],
        required: true
    },
    methodDetails: {
        bankName: String,
        accountNumber: String,
        checkNumber: String,
        transactionId: String,
        mobileOperator: String,
        cardLastFour: String
    },
    // For idempotency
    transactionId: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    reference: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'reversed'],
        default: 'completed'
    },
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: Date,
    // Allocation tracking
    allocatedAmount: {
        type: Number,
        default: 0
    },
    advanceAmount: {
        type: Number,
        default: 0
    },
    // Session
    session: {
        type: String,
        required: true,
        index: true
    },
    // Metadata
    notes: String,
    attachments: [{
        name: String,
        url: String,
        uploadedAt: Date
    }],
    // For refund tracking
    refundedAmount: {
        type: Number,
        default: 0
    },
    isFullyRefunded: {
        type: Boolean,
        default: false
    },
    receiptNumber: {
        type: String,
        unique: true,
        required: false,
        index: true
    }

}, {
    timestamps: true
});

// Indexes
paymentSchema.index({ student: 1, createdAt: -1 });
paymentSchema.index({ method: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ session: 1, createdAt: -1 });

// Virtual for remaining refundable amount
paymentSchema.virtual('refundableAmount').get(function () {
    return this.amount - this.refundedAmount;
});

paymentSchema.pre('save', function (next) {
    if (!this.receiptNumber) {
        this.receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    }
    next()
})

module.exports = mongoose.model('Payment', paymentSchema);