// UPDATED models/FeeInstance.js
const mongoose = require('mongoose');

const feeInstanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    feeTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeTemplate',
        required: true,
        index: true
    },
    // Amount fields
    originalAmount: {
        type: Number,
        required: true
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    lateFeeAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    // Payment tracking
    paidAmount: {
        type: Number,
        default: 0
    },
    waivedAmount: {
        type: Number,
        default: 0
    },
    advanceUsed: {
        type: Number,
        default: 0
    },
    dueAmount: {
        type: Number,
        default: function() {
            return this.totalAmount - this.paidAmount - this.waivedAmount - this.advanceUsed;
        }
    },
    // Dates
    issueDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    paidDate: Date,
    // Status
    status: {
        type: String,
        enum: ['pending', 'unpaid', 'partial', 'paid', 'waived', 'cancelled', 'overdue'],
        default: 'pending'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // For installments
    installmentPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InstallmentPlan'
    },
    installmentNumber: Number,
    // Session
    session: {
        type: String,
        required: true,
        index: true
    },
    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: String,
    // For audit
    paymentAllocations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentAllocation'
    }],
    waiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeWaiver'
    }
}, {
    timestamps: true
});

// Virtual for net amount (calculated)
feeInstanceSchema.virtual('netAmount').get(function() {
    return this.totalAmount - this.waivedAmount;
});

// Indexes for performance
feeInstanceSchema.index({ student: 1, status: 1 });
feeInstanceSchema.index({ dueDate: 1, status: 1 });
feeInstanceSchema.index({ session: 1, status: 1 });
feeInstanceSchema.index({ feeTemplate: 1, student: 1 }, { unique: true });

// Pre-save to update dueAmount
feeInstanceSchema.pre('save', function(next) {
    this.dueAmount = this.totalAmount - this.paidAmount - this.waivedAmount - this.advanceUsed;
    
    // Update status based on amounts
    if (this.dueAmount <= 0 && this.totalAmount > 0) {
        this.status = this.waivedAmount >= this.totalAmount ? 'waived' : 'paid';
        this.paidDate = this.paidDate || new Date();
    } else if (this.paidAmount > 0) {
        this.status = 'partial';
    } else if (new Date() > this.dueDate && this.dueAmount > 0) {
        this.status = 'overdue';
    } else {
        this.status = 'unpaid';
    }
    
    next();
});

module.exports = mongoose.model('FeeInstance', feeInstanceSchema);
