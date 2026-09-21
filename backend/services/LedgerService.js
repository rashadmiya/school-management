// services/LedgerService.js — read-only version
const LedgerEntry = require('../financeSystem/models/LedgerEntry');
const { toDecimal } = require('../utils/decimal');

class LedgerService {
    static async getStudentLedger(studentId, startDate, endDate, limit = 100) {
        const query = { student: studentId };
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        return LedgerEntry.find(query)
            .sort({ _id: -1 })
            .limit(limit)
            .lean();
    }

    /**
     * Validate that the ledger's balanceAfter column is internally consistent.
     * (Repair using StudentFinanceSummaryService.rebuild if not.)
     */
    static async validateLedger(studentId, session) {
        const entries = await LedgerEntry
            .find({ student: studentId, session })
            .sort({ _id: 1 })
            .lean();

        let running = toDecimal(0);
        const errors = [];

        for (const entry of entries) {
            const expected = running
                .plus(toDecimal(entry.debit))
                .minus(toDecimal(entry.credit));

            if (expected.minus(toDecimal(entry.balanceAfter)).abs().gt('0.01')) {
                errors.push({
                    entryId: entry._id,
                    expected: expected.toString(),
                    actual: toDecimal(entry.balanceAfter).toString(),
                });
            }

            running = toDecimal(entry.balanceAfter);
        }

        return { isValid: errors.length === 0, currentBalance: running.toString(), errors };
    }
}

module.exports = LedgerService;

// // services/LedgerService.js - UPDATED
// const LedgerEntry = require('../financeSystem/models/LedgerEntry');
// const mongoose = require('mongoose');

// class LedgerService {
//     static async getStudentBalance(studentId, session = null) {
//         const query = LedgerEntry.findOne({ student: studentId })
//             .sort({ _id: -1 })
//             .select('balanceAfter');
            
//         if (session) query.session(session);
        
//         const last = await query;
//         return last ? last.balanceAfter : 0;
//     }

//     static async createEntry(data, dbSession = null) {
//         const { student, transactionId, type, debit = 0, credit = 0, refModel, refId, description, createdBy, session } = data;
        
//         // Validate
//         if (debit < 0 || credit < 0) {
//             throw new Error('Debit and credit must be positive');
//         }
        
//         if (debit > 0 && credit > 0) {
//             throw new Error('Cannot have both debit and credit in same entry');
//         }

//         const previousBalance = await this.getStudentBalance(student, dbSession);
//         const balanceAfter = previousBalance + debit - credit;

//         const entryData = {
//             student,
//             transactionId,
//             type,
//             debit,
//             credit,
//             previousBalance,
//             balanceAfter,
//             refModel,
//             refId,
//             description,
//             createdBy,
//             session
//         };

//         const entry = new LedgerEntry(entryData);
        
//         const saveOptions = dbSession ? { session: dbSession } : {};
//         return entry.save(saveOptions);
//     }

//     static async createEntries(entries, dbSession = null) {
//         const createdEntries = [];
        
//         for (const entryData of entries) {
//             const entry = await this.createEntry(entryData, dbSession);
//             createdEntries.push(entry);
//         }
        
//         return createdEntries;
//     }

//     static async getStudentLedger(studentId, startDate, endDate, limit = 100) {
//         const query = { student: studentId };
        
//         if (startDate || endDate) {
//             query.createdAt = {};
//             if (startDate) query.createdAt.$gte = new Date(startDate);
//             if (endDate) query.createdAt.$lte = new Date(endDate);
//         }
        
//         return LedgerEntry.find(query)
//             .sort({ _id: -1 })
//             .limit(limit)
//             .populate('refId', 'amount method status')
//             .lean();
//     }

//     static async validateLedger(studentId) {
//         const entries = await LedgerEntry.find({ student: studentId })
//             .sort({ _id: 1 })
//             .lean();
        
//         let runningBalance = 0;
//         let isValid = true;
//         const errors = [];
        
//         for (let i = 0; i < entries.length; i++) {
//             const entry = entries[i];
//             const expectedBalance = runningBalance + entry.debit - entry.credit;
            
//             if (Math.abs(expectedBalance - entry.balanceAfter) > 0.01) {
//                 isValid = false;
//                 errors.push({
//                     entryId: entry._id,
//                     expected: expectedBalance,
//                     actual: entry.balanceAfter,
//                     difference: expectedBalance - entry.balanceAfter
//                 });
//             }
            
//             runningBalance = entry.balanceAfter;
//         }
        
//         return { isValid, currentBalance: runningBalance, errors };
//     }
// }

// module.exports = LedgerService;