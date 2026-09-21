// financeSystem/models/StudentFinanceSummary.js
const mongoose = require('mongoose');
const { moneyPlugin, Decimal128 } = require('../../utils/moneySchemaPlugin');

const studentFinanceSummarySchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true,
    },
    session: {
        type: String,
        required: true,
        index: true,
    },

    // Running totals — all Decimal128
    totalFee:        { type: Decimal128, default: 0 },  // total billed
    totalPaid:       { type: Decimal128, default: 0 },  // via payments
    totalWaived:     { type: Decimal128, default: 0 },  // via waivers
    totalAdvanceUsed:{ type: Decimal128, default: 0 },  // advance debited to fees
    totalRefunded:   { type: Decimal128, default: 0 },  // refunded to student
    totalLateFee:    { type: Decimal128, default: 0 },

    // Derived caches — updated atomically with every op
    advanceBalance:  { type: Decimal128, default: 0 },  // current advance
    dueBalance:      { type: Decimal128, default: 0 },  // negative = they owe us

    // Status flag for fast filtering
    status: {
        type: String,
        enum: ['clear', 'due', 'overdue', 'advanced'],
        default: 'clear',
        index: true,
    },

    // Counters for stats
    feeCount:     { type: Number, default: 0 },
    paidCount:    { type: Number, default: 0 },
    overdueCount: { type: Number, default: 0 },

    // Track last ledger entry (for reconciliation)
    lastLedgerEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'LedgerEntry' },
    lastUpdated: { type: Date, default: Date.now },
    lastRebuiltAt: Date,
}, { timestamps: true });

studentFinanceSummarySchema.plugin(moneyPlugin);

// One summary per student per session
studentFinanceSummarySchema.index({ student: 1, session: 1 }, { unique: true });
studentFinanceSummarySchema.index({ session: 1, status: 1 });

module.exports = mongoose.model('StudentFinanceSummary', studentFinanceSummarySchema);