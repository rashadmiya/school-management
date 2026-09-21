// services/StudentFinanceSummaryService.js
const mongoose = require('mongoose');
const StudentFinanceSummary = require('../financeSystem/models/StudentFinanceSummary');
const LedgerEntry = require('../financeSystem/models/LedgerEntry');
const { toDecimal, toDecimal128 } = require('../utils/decimal');

class StudentFinanceSummaryService {

    /**
     * Fetch (or lazily create) the summary for a student+session, inside a session.
     * Never call outside a transaction when you intend to write.
     */
    // static async getOrCreate(studentId, session, dbSession) {
    //     let summary = await StudentFinanceSummary
    //         .findOne({ student: studentId, session })
    //         .session(dbSession);

    //     if (!summary) {
    //         summary = new StudentFinanceSummary({
    //             student: studentId,
    //             session,
    //             totalFee: 0,
    //             totalPaid: 0,
    //             totalWaived: 0,
    //             totalAdvanceUsed: 0,
    //             totalRefunded: 0,
    //             totalLateFee: 0,
    //             advanceBalance: 0,
    //             dueBalance: 0,
    //             status: 'clear',
    //         });
    //         await summary.save({ session: dbSession });
    //     }

    //     return summary;
    // }

    static async getOrCreate(studentId, session, dbSession) {
        return StudentFinanceSummary.findOneAndUpdate(
            { student: studentId, session },
            {
                $setOnInsert: {
                    totalFee: 0, totalPaid: 0, totalWaived: 0,
                    totalAdvanceUsed: 0, totalRefunded: 0, totalLateFee: 0,
                    advanceBalance: 0, dueBalance: 0, status: 'clear',
                },
            },
            { new: true, upsert: true, session: dbSession, setDefaultsOnInsert: true }
        );
    }

    /**
     * Apply a delta to the summary AND append a ledger entry.
     * The single source of truth for every money movement.
     *
     * @param {Object} params
     * @param {ObjectId} params.student
     * @param {String}   params.session
     * @param {ObjectId} params.transactionId
     * @param {String}   params.type          - one of LedgerEntry enums
     * @param {Decimal}  params.debit         - increases what student owes
     * @param {Decimal}  params.credit        - decreases what student owes
     * @param {String}   params.refModel
     * @param {ObjectId} params.refId
     * @param {String}   params.description
     * @param {ObjectId} params.createdBy
     * @param {Object}   params.summaryDelta  - { fee, paid, waived, advanceUsed, refunded, advanceBalance, lateFee } deltas
     * @param {Object}   dbSession            - mongoose session
     */
    static async recordMovement(params, dbSession) {
        const {
            student, session, transactionId, type,
            debit = 0, credit = 0,
            refModel, refId, description, createdBy,
            summaryDelta = {},
        } = params;

        // 1. Lock the summary doc
        const summary = await this.getOrCreate(student, session, dbSession);

        // 2. Compute new totals using Decimal math
        const fee = toDecimal(summary.totalFee).plus(summaryDelta.fee || 0);
        const paid = toDecimal(summary.totalPaid).plus(summaryDelta.paid || 0);
        const waived = toDecimal(summary.totalWaived).plus(summaryDelta.waived || 0);
        const advanceUsed = toDecimal(summary.totalAdvanceUsed).plus(summaryDelta.advanceUsed || 0);
        const refunded = toDecimal(summary.totalRefunded).plus(summaryDelta.refunded || 0);
        const advanceBal = toDecimal(summary.advanceBalance).plus(summaryDelta.advanceBalance || 0);
        const lateFee = toDecimal(summary.totalLateFee).plus(summaryDelta.lateFee || 0);

        // 3. Compute the running balance (the "amount owed") - uses ledger semantics
        //    Balance = fees charged - everything that reduces it
        // const dueBalance = fee
        //     .plus(lateFee)
        //     .minus(paid)
        //     .minus(waived)
        //     .minus(advanceUsed)
        //     .minus(refunded);

        const dueBalance = fee
            .plus(lateFee)
            .minus(paid)
            .minus(waived)
            .minus(advanceUsed);
        // `refunded` is a metric only — not part of the balance equation.

        // 4. Update summary atomically
        summary.totalFee = fee;
        summary.totalPaid = paid;
        summary.totalWaived = waived;
        summary.totalAdvanceUsed = advanceUsed;
        summary.totalRefunded = refunded;
        summary.totalLateFee = lateFee;
        summary.advanceBalance = advanceBal;
        summary.dueBalance = dueBalance;

        // 5. Update status
        if (dueBalance.lte(0) && advanceBal.gt(0)) {
            summary.status = 'advanced';
        } else if (dueBalance.lte(0)) {
            summary.status = 'clear';
        } else if (dueBalance.gt(0)) {
            // Check for overdue
            summary.status = 'due'; // refined below if there are overdue instances
        }

        summary.lastUpdated = new Date();
        await summary.save({ session: dbSession });

        // 6. Append ledger entry using the summary's new balance
        const [ledgerEntry] = await LedgerEntry.create([{
            student,
            transactionId,
            type,
            debit: toDecimal128(debit),
            credit: toDecimal128(credit),
            previousBalance: toDecimal128(dueBalance.minus(toDecimal(debit)).plus(toDecimal(credit))),
            balanceAfter: toDecimal128(dueBalance),
            refModel,
            refId,
            description,
            createdBy,
            session,
        }], { session: dbSession });

        summary.lastLedgerEntry = ledgerEntry._id;
        await summary.save({ session: dbSession });

        return { summary, ledgerEntry };
    }

    /**
     * Read-only fast path for dashboards.
     */
    static async getSummary(studentId, session) {
        return StudentFinanceSummary
            .findOne({ student: studentId, session })
            .lean();
    }

    /**
     * Bulk read for lists (e.g. class roster).
     */
    static async getSummaries(studentIds, session) {
        return StudentFinanceSummary
            .find({ student: { $in: studentIds }, session })
            .lean();
    }

    /**
     * Full rebuild from ledger — used for reconciliation / repair.
     */
    static async rebuild(studentId, session, dbSession) {
        const entries = await LedgerEntry
            .find({ student: studentId, session })
            .sort({ createdAt: 1 })
            .session(dbSession)
            .lean();

        let dueBalance = toDecimal(0);
        let advanceBalance = toDecimal(0);
        let totalFee = toDecimal(0);
        let totalPaid = toDecimal(0);
        let totalWaived = toDecimal(0);
        let totalAdvanceUsed = toDecimal(0);
        let totalRefunded = toDecimal(0);

        for (const e of entries) {
            dueBalance = dueBalance.plus(e.debit).minus(e.credit);
            if (e.type === 'fee') totalFee = totalFee.plus(e.debit);
            if (e.type === 'payment') totalPaid = totalPaid.plus(e.credit);
            if (e.type === 'waiver') totalWaived = totalWaived.plus(e.credit);
            // if (e.type === 'advance_debit') totalAdvanceUsed = totalAdvanceUsed.plus(e.debit);
            // if (e.type === 'refund') totalRefunded = totalRefunded.plus(e.debit);
            if (e.type === 'advance_debit') totalAdvanceUsed = totalAdvanceUsed.plus(e.credit); // was e.debit
            if (e.type === 'refund') totalRefunded = totalRefunded.plus(e.credit);    // was e.debit
        }

        const summary = await this.getOrCreate(studentId, session, dbSession);
        summary.totalFee = totalFee;
        summary.totalPaid = totalPaid;
        summary.totalWaived = totalWaived;
        summary.totalAdvanceUsed = totalAdvanceUsed;
        summary.totalRefunded = totalRefunded;
        summary.advanceBalance = advanceBalance; // recompute separately if needed
        summary.dueBalance = dueBalance;
        summary.status = dueBalance.gt(0) ? 'due' : (dueBalance.lt(0) ? 'advanced' : 'clear');
        summary.lastRebuiltAt = new Date();
        await summary.save({ session: dbSession });

        return summary;
    }
}

module.exports = StudentFinanceSummaryService;