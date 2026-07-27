// models/FeeWaiver.js
const mongoose = require('mongoose');

const feeWaiverSchema = new mongoose.Schema({
    // Core References
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    feeInstance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeInstance',
        required: true
    },
    
    // Waiver Details
    type: {
        type: String,
        enum: ['full', 'partial', 'scholarship', 'staff_discount', 'sibling_discount'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    percentage: {
        type: Number,
        min: 0,
        max: 100
    },
    
    // Approval Workflow
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'revoked'],
        default: 'pending'
    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    approvedDate: Date,
    effectiveFrom: Date,
    effectiveUntil: Date,
    
    // Reason & Documentation
    reason: {
        type: String,
        required: true
    },
    supportingDocuments: [{
        name: String,
        url: String,
        uploadedAt: Date
    }],
    
    // Approval Chain
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Audit Trail
    remarks: String,
    revisionHistory: [{
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        changedAt: Date,
        changes: mongoose.Schema.Types.Mixed,
        reason: String
    }]
}, {
    timestamps: true
});

// Indexes for performance
feeWaiverSchema.index({ student: 1, status: 1 });
feeWaiverSchema.index({ feeInstance: 1, status: 1 });
feeWaiverSchema.index({ type: 1, effectiveFrom: 1, effectiveUntil: 1 });

// Pre-save to calculate amount from percentage if needed
feeWaiverSchema.pre('save', async function(next) {
    if (this.percentage && !this.amount) {
        const feeInstance = await mongoose.model('FeeInstance').findById(this.feeInstance);
        if (feeInstance) {
            this.amount = (feeInstance.netAmount * this.percentage) / 100;
        }
    }
    next();
});

module.exports = mongoose.model('FeeWaiver', feeWaiverSchema);