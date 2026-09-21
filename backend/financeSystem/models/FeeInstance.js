// financeSystem/models/FeeInstance.js
const mongoose = require('mongoose');
const { moneyPlugin, Decimal128 } = require('../../utils/moneySchemaPlugin');
const { toDecimal } = require('../../utils/decimal');

const feeInstanceSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    feeTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeTemplate', required: true, index: true },

    // Snapshot of template data (frozen at creation, so template edits don't affect history)
    title: { type: String, required: true },   // <-- new: freeze title
    frequency: { type: String },                // <-- new: freeze frequency

    // Amounts
    originalAmount: { type: Decimal128, required: true },
    taxAmount: { type: Decimal128, default: 0 },
    lateFeeAmount: { type: Decimal128, default: 0 },
    totalAmount: { type: Decimal128, required: true },

    // Payment tracking
    paidAmount: { type: Decimal128, default: 0 },
    waivedAmount: { type: Decimal128, default: 0 },
    advanceUsed: { type: Decimal128, default: 0 },
    dueAmount: { type: Decimal128, default: 0 },

    // Dates
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    paidDate: Date,

    // Status
    status: {
        type: String,
        enum: ['pending', 'unpaid', 'partial', 'paid', 'waived', 'cancelled', 'overdue'],
        default: 'pending',
    },
    isActive: { type: Boolean, default: true },

    // Installments
    installmentPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'InstallmentPlan' },
    installmentNumber: Number,

    session: { type: String, required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,

    paymentAllocations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PaymentAllocation' }],
    waiver: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeWaiver' },
}, { timestamps: true });

feeInstanceSchema.plugin(moneyPlugin);

feeInstanceSchema.index({ student: 1, status: 1 });
feeInstanceSchema.index({ dueDate: 1, status: 1 });
feeInstanceSchema.index({ session: 1, status: 1 });
feeInstanceSchema.index({ feeTemplate: 1, student: 1 }, { unique: true });

/**
 * Recalculate dueAmount and status. Always call this before save.
 * Uses Decimal math, never JS numbers.
 */
feeInstanceSchema.methods.recalculate = function () {
    const total = toDecimal(this.totalAmount);
    const paid = toDecimal(this.paidAmount);
    const waived = toDecimal(this.waivedAmount);
    const advance = toDecimal(this.advanceUsed);

    const due = total.minus(paid).minus(waived).minus(advance);
    this.dueAmount = due;

    // if (due.lte(0) && total.gt(0)) {
    //     this.status = waived.gte(total) ? 'waived' : 'paid';
    //     if (!this.paidDate) this.paidDate = new Date();
    // } else if (paid.gt(0) || advance.gt(0)) {
    //     this.status = 'partial';
    // } else if (new Date() > this.dueDate) {
    //     this.status = 'overdue';
    // } else {
    //     this.status = 'unpaid';
    // }

    if (due.lte(0) && total.gt(0)) {
        this.status = waived.gte(total) ? 'waived' : 'paid';
        if (!this.paidDate) this.paidDate = new Date();
    } else {
        // No longer fully paid → clear the paid date
        this.paidDate = undefined;
        if (paid.gt(0) || advance.gt(0)) this.status = 'partial';
        else if (new Date() > this.dueDate) this.status = 'overdue';
        else this.status = 'unpaid';
    }
};

feeInstanceSchema.pre('save', function (next) {
    this.recalculate();
    next();
});

module.exports = mongoose.model('FeeInstance', feeInstanceSchema);