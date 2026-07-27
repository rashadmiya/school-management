// models/FeeApplication.js - FOR APPLYING FEES TO STUDENTS
const mongoose = require('mongoose');

const feeApplicationSchema = new mongoose.Schema({
    feeTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeTemplate',
        required: true,
        index: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        index: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        index: true
    },
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        index: true
    },
    // Scope: 'all', 'class', 'section', 'individual'
    applicationScope: {
        type: String,
        enum: ['all', 'class', 'section', 'individual'],
        required: true
    },
    // For individual student override
    customAmount: {
        type: Number,
        min: 0
    },
    // Scheduling
    effectiveFrom: {
        type: Date,
        required: true
    },
    effectiveUntil: {
        type: Date
    },
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    appliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Metadata
    notes: String,
    // For tracking generated instances
    generatedFeeInstances: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeInstance'
    }]
}, {
    timestamps: true
});

// Indexes
feeApplicationSchema.index({ feeTemplate: 1, isActive: 1 });
feeApplicationSchema.index({ student: 1, isActive: 1 });
feeApplicationSchema.index({ class: 1, isActive: 1 });
feeApplicationSchema.index({ effectiveFrom: 1, effectiveUntil: 1 });

module.exports = mongoose.model('FeeApplication', feeApplicationSchema);