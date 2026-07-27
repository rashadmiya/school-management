// models/AdvanceBalance.js
const mongoose = require('mongoose');

const advanceBalanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    currency: {
        type: String,
        default: 'BDT'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    // Audit trail
    transactions: [{
        type: {
            type: String,
            enum: ['credit', 'debit', 'transfer', 'adjustment']
        },
        amount: Number,
        previousBalance: Number,
        newBalance: Number,
        reference: String,
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment'
        },
        refundId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Refund'
        },
        feeInstanceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FeeInstance'
        },
        description: String,
        transactionId: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    session: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Indexes
advanceBalanceSchema.index({ student: 1, session: 1 });
advanceBalanceSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('AdvanceBalance', advanceBalanceSchema);

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

// UPDATED models/LedgerEntry.js
const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema({
    // Core references
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    // Transaction tracking
    transactionId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['fee', 'payment', 'refund', 'waiver', 'advance_credit', 'advance_debit', 'adjustment', 'late_fee'],
        required: true
    },
    // Amount fields
    debit: {
        type: Number,
        default: 0,
        min: 0
    },
    credit: {
        type: Number,
        default: 0,
        min: 0
    },
    // Balance tracking
    previousBalance: {
        type: Number,
        required: true
    },
    balanceAfter: {
        type: Number,
        required: true
    },
    // References
    refModel: {
        type: String,
        enum: ['FeeInstance', 'Payment', 'Refund', 'FeeWaiver', 'AdvanceBalance', 'PaymentAllocation'],
        required: true
    },
    refId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    // Description for clarity
    description: String,
    // Metadata
    session: {
        type: String,
        required: true,
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // For reversal tracking
    isReversal: {
        type: Boolean,
        default: false
    },
    reversalOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LedgerEntry'
    },
    reversalReason: String
}, {
    timestamps: true
});

// Indexes for performance
ledgerEntrySchema.index({ student: 1, createdAt: -1 });
ledgerEntrySchema.index({ student: 1, transactionId: 1 });
ledgerEntrySchema.index({ transactionId: 1 });
ledgerEntrySchema.index({ refModel: 1, refId: 1 });
ledgerEntrySchema.index({ session: 1, createdAt: -1 });

// Compound index for balance queries
ledgerEntrySchema.index({ student: 1, _id: -1 });

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);

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

// models/PaymentAllocation.js - CRITICAL
const mongoose = require('mongoose');

const paymentAllocationSchema = new mongoose.Schema({
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true,
        index: true
    },
    feeInstance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeInstance',
        required: true,
        index: true
    },
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
    allocatedAt: {
        type: Date,
        default: Date.now
    },
    allocatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // For rollback and audit
    transactionId: {
        type: String,
        index: true
    },
    isReversed: {
        type: Boolean,
        default: false
    },
    reversalTransactionId: String,
    reversalReason: String,
    reversedAt: Date,
    reversedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Session tracking
    session: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Prevent duplicate allocations
paymentAllocationSchema.index(
    { payment: 1, feeInstance: 1 }, 
    { unique: true, partialFilterExpression: { isReversed: false } }
);

// For query performance
paymentAllocationSchema.index({ student: 1, allocatedAt: -1 });
paymentAllocationSchema.index({ feeInstance: 1, isReversed: 1 });

module.exports = mongoose.model('PaymentAllocation', paymentAllocationSchema);

const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },

  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  reason: {
    type: String,
    required: true
  },

  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Refund", refundSchema);


// models/Transaction.js - For idempotency
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    type: {
        type: String,
        enum: ['payment', 'refund', 'waiver', 'fee_creation', 'allocation'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'reversed'],
        default: 'pending'
    },
    data: mongoose.Schema.Types.Mixed,
    metadata: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        ipAddress: String,
        userAgent: String
    },
    error: String,
    retryCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Auto-expire after 30 days for cleanup
transactionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Transaction', transactionSchema);