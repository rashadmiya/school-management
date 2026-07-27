// models/InstallmentPlan.js
const mongoose = require('mongoose');

const installmentPlanSchema = new mongoose.Schema({
    // Plan Identification
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    
    // Financial Details
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    numberOfInstallments: {
        type: Number,
        required: true,
        min: 2,
        max: 24
    },
    downPayment: {
        amount: {
            type: Number,
            default: 0,
            min: 0
        },
        percentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    
    // Schedule Configuration
    installmentSchedule: [{
        installmentNumber: {
            type: Number,
            required: true
        },
        dueDate: {
            type: Date,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'overdue'],
            default: 'pending'
        }
    }],
    
    // Interest & Charges
    interestRate: {
        type: Number,
        default: 0,
        min: 0
    },
    latePaymentFee: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Eligibility Rules
    eligibleFeeTypes: [String],
    minimumAmount: {
        type: Number,
        default: 0
    },
    maximumAmount: {
        type: Number,
        default: Number.MAX_SAFE_INTEGER
    },
    
    // Status & Metadata
    isActive: {
        type: Boolean,
        default: true
    },
    autoApprove: {
        type: Boolean,
        default: false
    },
    
    // Audit Trail
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Virtual for installment amount
installmentPlanSchema.virtual('installmentAmount').get(function() {
    return (this.totalAmount - this.downPayment.amount) / this.numberOfInstallments;
});

// Pre-save to generate installment schedule
installmentPlanSchema.pre('save', function(next) {
    if (this.isModified('totalAmount') || this.isModified('numberOfInstallments') || 
        this.isModified('downPayment') || this.installmentSchedule.length === 0) {
        
        // Clear existing schedule
        this.installmentSchedule = [];
        
        // Calculate installment amount
        const installmentAmount = (this.totalAmount - this.downPayment.amount) / this.numberOfInstallments;
        
        // Generate schedule (starting from next month)
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() + 1);
        startDate.setDate(1); // First of the month
        
        for (let i = 1; i <= this.numberOfInstallments; i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + i - 1);
            
            this.installmentSchedule.push({
                installmentNumber: i,
                dueDate: dueDate,
                amount: installmentAmount,
                status: 'pending'
            });
        }
    }
    next();
});

// Indexes for performance
installmentPlanSchema.index({ code: 1 }, { unique: true });
installmentPlanSchema.index({ isActive: 1, minimumAmount: 1, maximumAmount: 1 });

module.exports = mongoose.model('InstallmentPlan', installmentPlanSchema);