// UPDATED models/FeeTemplate.js
const mongoose = require('mongoose');

const feeTemplateSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'BDT'
    },
    frequency: {
        type: String,
        enum: ['one_time', 'monthly', 'quarterly', 'yearly', 'custom'],
        default: 'one_time'
    },
    appliesTo: {
        scope: {
            type: String,
            enum: ['all', 'class', 'section', 'individual'],
            required: true
        },
        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
            default: null
        },
        section: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Section',
            default: null
        },
        individualStudent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            default: null
        },
        grade: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Grade',
            default: null
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    dueDay: {
        type: Number,
        min: 1,
        max: 31,
        default: 1
    },
    lateFee: {
        amount: Number,
        percentage: Number,
        afterDays: Number
    },
    taxPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    session: {
        type: String,
        required: true,
        index: true
    },
    // For installment plans
    installmentPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InstallmentPlan'
    },
    allowPartialPayments: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
feeTemplateSchema.index({ isActive: 1, session: 1 });
feeTemplateSchema.index({ 'appliesTo.scope': 1, 'appliesTo.class': 1 });
feeTemplateSchema.index({ 'appliesTo.scope': 1, 'appliesTo.section': 1 });

module.exports = mongoose.model('FeeTemplate', feeTemplateSchema);