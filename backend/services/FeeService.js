// services/FeeService.js
const mongoose = require('mongoose');
const FeeTemplate = require('../financeSystem/models/FeeTemplate');
const FeeInstance = require('../financeSystem/models/FeeInstance');
const Student = require('../models/Student');
const StudentFinanceSummaryService = require('./StudentFinanceSummaryService');
const TransactionService = require('./TransactionService');
const { toDecimal, toDecimal128, percent } = require('../utils/decimal');
const { getCurrentSession } = require('../utils/accademicSession');
const AuditService = require('../financeSystem/services/AuditService');

class FeeService {
    static async createTemplate(data, userId) {
        const currentSession = data.session || getCurrentSession();
        const [template] = await FeeTemplate.create([{
            ...data,
            amount: toDecimal128(data.amount),
            lateFee: {
                ...(data.lateFee || {}),
                amount: data.lateFee?.amount ? toDecimal128(data.lateFee.amount) : undefined,
            },
            createdBy: userId,
            updatedBy: userId,
            session: currentSession,
        }]);

        await AuditService.record({
            action: 'fee.created',    // ← was 'fee.applied'
            actor: userId,
            refModel: 'FeeTemplate',
            refId: template._id,
            after: { title: template.title, amount: template.amount.toString(), session: currentSession },
            session: currentSession,
            reason: 'Fee template created',
        });

        return template;
    }

    static async applyFeeTemplate(templateId, userId, options = {}) {
        const dbSession = await mongoose.startSession();

        try {
            dbSession.startTransaction();

            const template = await FeeTemplate.findById(templateId).session(dbSession);
            if (!template) throw new Error('Fee template not found');
            if (!template.isActive) throw new Error('Fee template is inactive');

            const transactionId = await TransactionService.createTransactionId('fee_creation', userId);
            await TransactionService.beginTransaction(transactionId, 'fee_creation', { userId, templateId });

            const currentSession = template.session || getCurrentSession();

            // Find target students
            const students = await this._resolveStudents(template, currentSession, dbSession);
            if (students.length === 0) throw new Error('No students found to apply fee to');

            const feeInstances = [];
            const dueDate = this.calculateDueDate(template);
            const baseAmount = toDecimal(template.amount);
            const taxAmount = template.taxPercentage
                ? percent(baseAmount, template.taxPercentage)
                : toDecimal(0);
            const totalAmount = baseAmount.plus(taxAmount);

            for (const student of students) {
                const existing = await FeeInstance.findOne({
                    student: student._id,
                    feeTemplate: template._id,
                    session: currentSession,
                    isActive: true,
                }).session(dbSession);

                if (existing && !options.force) continue;

                let feeInstance;
                let auditAction;

                if (existing && options.force) {
                    // Re-apply → update the amounts and due date on the existing instance
                    const previousTotal = toDecimal(existing.totalAmount);

                    existing.originalAmount = toDecimal128(baseAmount);
                    existing.taxAmount = toDecimal128(taxAmount);
                    existing.totalAmount = toDecimal128(totalAmount);
                    existing.title = template.title;
                    existing.frequency = template.frequency;
                    existing.dueDate = dueDate;
                    existing.recalculate();
                    await existing.save({ session: dbSession });

                    // Adjust the ledger + summary by the delta (may be positive or negative)
                    const delta = totalAmount.minus(previousTotal);
                    if (!delta.isZero()) {
                        await StudentFinanceSummaryService.recordMovement({
                            student: student._id,
                            session: currentSession,
                            transactionId,
                            type: 'fee',
                            debit: toDecimal128(delta.gt(0) ? delta : toDecimal(0)),
                            credit: toDecimal128(delta.lt(0) ? delta.negated() : toDecimal(0)),
                            refModel: 'FeeInstance',
                            refId: existing._id,
                            description: `Fee re-applied: ${template.title} (Δ ${delta.toString()})`,
                            createdBy: userId,
                            summaryDelta: { fee: delta },
                        }, dbSession);
                    }

                    feeInstance = existing;
                    auditAction = 'fee.updated';
                } else {
                    const [created] = await FeeInstance.create([{
                        student: student._id,
                        feeTemplate: template._id,
                        title: template.title,
                        frequency: template.frequency,
                        originalAmount: toDecimal128(baseAmount),
                        taxAmount: toDecimal128(taxAmount),
                        totalAmount: toDecimal128(totalAmount),
                        dueDate,
                        session: currentSession,
                        createdBy: userId,
                        status: 'unpaid',
                    }], { session: dbSession });

                    await StudentFinanceSummaryService.recordMovement({
                        student: student._id,
                        session: currentSession,
                        transactionId,
                        type: 'fee',
                        debit: toDecimal128(totalAmount),
                        refModel: 'FeeInstance',
                        refId: created._id,
                        description: `Fee: ${template.title}`,
                        createdBy: userId,
                        summaryDelta: { fee: totalAmount },
                    }, dbSession);

                    feeInstance = created;
                    auditAction = 'fee.created';
                }

                feeInstances.push(feeInstance);

                // Audit
                await AuditService.record({
                    action: auditAction,
                    actor: userId,
                    student: student._id,
                    refModel: 'FeeInstance',
                    refId: feeInstance._id,
                    after: {
                        title: feeInstance.title,
                        totalAmount: feeInstance.totalAmount.toString(),
                        dueDate: feeInstance.dueDate,
                        session: currentSession,
                    },
                    session: currentSession,
                    transactionId,
                    reason: options.force
                        ? `Re-applied template: ${template.title}`
                        : `Applied template: ${template.title}`,
                }, dbSession);
                // Auto-apply advance balance if the student has any
                await this._tryAutoApplyAdvance(student._id, feeInstance, currentSession, userId, dbSession);
            }

            await AuditService.record({
                action: 'fee.template.applied',
                actor: userId,
                refModel: 'FeeTemplate',
                refId: template._id,
                after: {
                    templateTitle: template.title,
                    appliedTo: feeInstances.length,
                    session: currentSession,
                },
                session: currentSession,
                transactionId,
                reason: `Applied to ${feeInstances.length} student(s)`,
            }, dbSession);

            await TransactionService.completeTransaction(transactionId, {
                feeInstances: feeInstances.length,
                students: students.length,
            });

            await dbSession.commitTransaction();

            return {
                template: template.title,
                appliedTo: feeInstances.length,
                feeInstances: feeInstances.map(fi => fi._id),
                transactionId,
            };

        } catch (error) {
            await dbSession.abortTransaction();
            throw error;
        } finally {
            dbSession.endSession();
        }
    }

    static async _resolveStudents(template, session, dbSession) {
        const base = { session, ...(await this._activeField()) };
        switch (template.appliesTo.scope) {
            case 'all':
                return Student.find(base).session(dbSession);
            case 'class':
                return Student.find({ ...base, class: template.appliesTo.class }).session(dbSession);
            case 'section':
                return Student.find({
                    ...base,
                    class: template.appliesTo.class,
                    section: template.appliesTo.section,
                }).session(dbSession);
            case 'individual':
                return Student.find({ ...base, _id: template.appliesTo.individualStudent }).session(dbSession);
            default:
                throw new Error('Invalid scope');
        }
    }

    static async _activeField() {
        // Student model may or may not have isActive — check once
        const sample = await Student.findOne().select('isActive').lean();
        return sample && sample.isActive !== undefined ? { isActive: true } : {};
    }

    /**
     * If the student has an advance balance, apply it now.
     * Runs inside the caller's transaction.
     */
    static async _tryAutoApplyAdvance(studentId, feeInstance, session, userId, dbSession) {
        const AdvanceBalance = require('../financeSystem/models/AdvanceBalance');
        const advance = await AdvanceBalance
            .findOne({ student: studentId, session })
            .session(dbSession);

        if (!advance || toDecimal(advance.amount).lte(0)) return;
        if (toDecimal(feeInstance.dueAmount).lte(0)) return;

        const available = toDecimal(advance.amount);
        const needed = toDecimal(feeInstance.dueAmount);
        const use = available.lt(needed) ? available : needed;

        // Debit advance
        const updated = await AdvanceBalance.findOneAndUpdate(
            { _id: advance._id, amount: { $gte: toDecimal128(use) } },
            {
                $inc: { amount: toDecimal128(use.negated()) },
                $set: { lastUpdated: new Date() },
                $push: {
                    transactions: {
                        type: 'debit',
                        amount: toDecimal128(use),
                        feeInstanceId: feeInstance._id,
                        description: `Auto-applied to fee: ${feeInstance.title}`,
                        createdAt: new Date(),
                    },
                },
            },
            { new: true, session: dbSession }
        );

        if (!updated) return; // race-condition fallback

        // Debit fee instance
        feeInstance.advanceUsed = toDecimal128(toDecimal(feeInstance.advanceUsed).plus(use));
        feeInstance.recalculate();
        await feeInstance.save({ session: dbSession });

        // Update summary
        const transactionId = await TransactionService.createTransactionId('advance_debit', userId);
        await TransactionService.beginTransaction(transactionId, 'advance_debit', {
            userId, studentId, feeInstanceId: feeInstance._id, amount: use.toString(),
        });

        // await StudentFinanceSummaryService.recordMovement({
        //     student: studentId,
        //     session,
        //     transactionId,
        //     type: 'advance_debit',
        //     debit: toDecimal128(use),
        //     refModel: 'FeeInstance',
        //     refId: feeInstance._id,
        //     description: `Advance applied to fee: ${feeInstance.title}`,
        //     createdBy: userId,
        //     summaryDelta: {
        //         advanceUsed: use,
        //         advanceBalance: use.negated(),
        //     },
        // }, dbSession);
        await StudentFinanceSummaryService.recordMovement({
            student: studentId,
            session,
            transactionId,
            type: 'advance_debit',
            debit: toDecimal128(0),
            credit: toDecimal128(use),              // ← was debit
            refModel: 'FeeInstance',
            refId: feeInstance._id,
            description: `Advance applied to fee: ${feeInstance.title}`,
            createdBy: userId,
            summaryDelta: {
                advanceUsed: use,
                advanceBalance: use.negated(),
            },
        }, dbSession);

        await TransactionService.completeTransaction(transactionId, {
            feeInstanceId: feeInstance._id,
            amountUsed: use.toString(),
        });
    }

    static async getStudentFees(studentId, sessionYear, status = null) {
        const query = { student: studentId, session: sessionYear, isActive: true };
        if (status) query.status = status;
        return FeeInstance.find(query)
            .populate('feeTemplate', 'title description frequency')
            .sort({ dueDate: 1 })
            .lean();
    }

    static async getFeeInstance(feeInstanceId) {
        console.log("feeInstanceId:", feeInstanceId)
        return FeeInstance.findById(feeInstanceId)
            .populate('feeTemplate', 'title description frequency')
            .populate('student', 'name rollNumber')   // optional, but useful
            .lean();
    }

    static async updateFeeInstance(feeInstanceId, updates, userId) {
        const allowed = ['notes', 'dueDate', 'status'];
        const updateData = {};
        for (const k of allowed) if (updates[k] !== undefined) updateData[k] = updates[k];
        if (Object.keys(updateData).length === 0) throw new Error('No valid updates provided');
        updateData.updatedBy = userId;
        return FeeInstance.findByIdAndUpdate(feeInstanceId, updateData, { new: true });
    }

    static calculateDueDate(template, issueDate = new Date()) {
        const dueDate = new Date(issueDate);
        switch (template.frequency) {
            case 'monthly':
                dueDate.setMonth(dueDate.getMonth() + 1);
                dueDate.setDate(template.dueDay || 1);
                break;
            case 'quarterly':
                dueDate.setMonth(dueDate.getMonth() + 3);
                dueDate.setDate(template.dueDay || 1);
                break;
            case 'yearly':
                dueDate.setFullYear(dueDate.getFullYear() + 1);
                dueDate.setDate(template.dueDay || 1);
                break;
            case 'custom':
                dueDate.setDate(template.dueDay || 1);
                if (dueDate <= issueDate) dueDate.setMonth(dueDate.getMonth() + 1);
                break;
            default:
                dueDate.setDate(dueDate.getDate() + 30);
        }
        return dueDate;
    }

    static getCurrentSession(offsetYears = 0) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth(); // 0 = January

        // Academic year logic: If current month is before June, use previous year
        let academicYearStart = currentYear;
        if (currentMonth < 5) { // Before June
            academicYearStart = currentYear - 1;
        }

        // Apply offset
        academicYearStart += offsetYears;

        return `${academicYearStart}-${academicYearStart + 1}`;
    }
}

module.exports = FeeService;

// // services/FeeService.js - COMPLETE REWRITE
// const mongoose = require('mongoose');
// const FeeTemplate = require('../financeSystem/models/FeeTemplate');
// const FeeInstance = require('../financeSystem/models/FeeInstance');
// const Student = require('../models/Student');
// const Class = require('../models/Class');
// const LedgerService = require('./LedgerService');
// const TransactionService = require('./TransactionService');

// class FeeService {
//     static async createTemplate(data, userId) {
//         const session = await mongoose.startSession();

//         try {
//             session.startTransaction();

//             // Add metadata
//             const templateData = {
//                 ...data,
//                 createdBy: userId,
//                 updatedBy: userId,
//                 session: data.session || this.getCurrentSession()
//             };

//             const template = await FeeTemplate.create([templateData], { session });

//             await session.commitTransaction();
//             return template[0];

//         } catch (error) {
//             await session.abortTransaction();
//             throw error;
//         } finally {
//             session.endSession();
//         }
//     }

//     static async applyFeeTemplate(templateId, userId, options = {}) {
//         const session = await mongoose.startSession();

//         try {
//             session.startTransaction();

//             const template = await FeeTemplate.findById(templateId).session(session);
//             if (!template) throw new Error('Fee template not found');
//             if (!template.isActive) throw new Error('Fee template is inactive');

//             // Generate transaction ID for idempotency
//             const transactionId = await TransactionService.createTransactionId(
//                 'fee_creation',
//                 userId
//             );

//             await TransactionService.beginTransaction(transactionId, 'fee_creation', {
//                 userId,
//                 templateId
//             });

//             let students = [];
//             const currentSession = template.session || this.getCurrentSession();

//             // Determine which students to apply to
//             switch (template.appliesTo.scope) {
//                 case 'all':
//                     students = await Student.find({
//                         session: currentSession,
//                         isActive: true
//                     }).session(session);
//                     break;

//                 case 'class':
//                     if (!template.appliesTo.class) {
//                         throw new Error('Class is required for class scope');
//                     }
//                     students = await Student.find({
//                         class: template.appliesTo.class,
//                         session: currentSession,
//                         isActive: true
//                     }).session(session);
//                     break;

//                 case 'section':
//                     if (!template.appliesTo.class || !template.appliesTo.section) {
//                         throw new Error('Class and section are required for section scope');
//                     }
//                     students = await Student.find({
//                         class: template.appliesTo.class,
//                         section: template.appliesTo.section,
//                         session: currentSession,
//                         isActive: true
//                     }).session(session);
//                     break;

//                 case 'individual':
//                     if (!template.appliesTo.individualStudent) {
//                         throw new Error('Student is required for individual scope');
//                     }
//                     students = await Student.find({
//                         _id: template.appliesTo.individualStudent,
//                         session: currentSession,
//                         isActive: true
//                     }).session(session);
//                     break;

//                 default:
//                     throw new Error('Invalid scope');
//             }

//             if (students.length === 0) {
//                 throw new Error('No students found to apply fee to');
//             }

//             const feeInstances = [];
//             const ledgerEntries = [];

//             // Calculate due date
//             const dueDate = this.calculateDueDate(template);

//             for (const student of students) {
//                 // Check if fee instance already exists
//                 const existing = await FeeInstance.findOne({
//                     student: student._id,
//                     feeTemplate: template._id,
//                     session: currentSession,
//                     isActive: true
//                 }).session(session);

//                 if (existing && !options.force) {
//                     continue; // Skip if already exists
//                 }

//                 // Calculate total amount with tax
//                 const taxAmount = template.taxPercentage ?
//                     (template.amount * template.taxPercentage) / 100 : 0;
//                 const totalAmount = template.amount + taxAmount;

//                 // Create fee instance
//                 const feeInstance = new FeeInstance({
//                     student: student._id,
//                     feeTemplate: template._id,
//                     originalAmount: template.amount,
//                     taxAmount,
//                     totalAmount,
//                     dueDate,
//                     session: currentSession,
//                     createdBy: userId,
//                     status: 'unpaid'
//                 });

//                 await feeInstance.save({ session });
//                 feeInstances.push(feeInstance);

//                 // Create ledger entry
//                 const ledgerEntry = await LedgerService.createEntry({
//                     student: student._id,
//                     transactionId,
//                     type: 'fee',
//                     debit: totalAmount,
//                     refModel: 'FeeInstance',
//                     refId: feeInstance._id,
//                     description: `Fee: ${template.title}`,
//                     createdBy: userId,
//                     session: currentSession
//                 }, session);

//                 ledgerEntries.push(ledgerEntry);
//             }

//             await TransactionService.completeTransaction(transactionId, {
//                 feeInstances: feeInstances.length,
//                 students: students.length
//             });

//             await session.commitTransaction();

//             return {
//                 template: template.title,
//                 appliedTo: feeInstances.length,
//                 feeInstances: feeInstances.map(fi => fi._id),
//                 transactionId
//             };

//         } catch (error) {
//             await session.abortTransaction();

//             // Mark transaction as failed if we have transactionId
//             if (error.transactionId) {
//                 await TransactionService.failTransaction(error.transactionId, error);
//             }

//             throw error;
//         } finally {
//             session.endSession();
//         }
//     }

//     static async getStudentFees(studentId, sessionYear, status = null) {
//         const query = {
//             student: studentId,
//             session: sessionYear,
//             isActive: true
//         };

//         if (status) {
//             query.status = status;
//         }

//         return FeeInstance.find(query)
//             .populate('feeTemplate', 'title description frequency')
//             .sort({ dueDate: 1 })
//             .lean();
//     }

//     static async getFeeSummary(studentId, sessionYear) {
//         const fees = await this.getStudentFees(studentId, sessionYear);

//         const summary = {
//             totalFees: 0,
//             totalPaid: 0,
//             totalWaived: 0,
//             totalDue: 0,
//             totalAdvanceUsed: 0,
//             feeCount: fees.length,
//             byStatus: {
//                 unpaid: 0,
//                 partial: 0,
//                 paid: 0,
//                 waived: 0,
//                 overdue: 0
//             }
//         };

//         fees.forEach(fee => {
//             summary.totalFees += fee.totalAmount;
//             summary.totalPaid += fee.paidAmount;
//             summary.totalWaived += fee.waivedAmount;
//             summary.totalAdvanceUsed += fee.advanceUsed;
//             summary.totalDue += fee.dueAmount;

//             if (summary.byStatus[fee.status] !== undefined) {
//                 summary.byStatus[fee.status]++;
//             }
//         });

//         return summary;
//     }


//     static async updateFeeInstance(feeInstanceId, updates, userId) {
//         const session = await mongoose.startSession();

//         try {
//             session.startTransaction();

//             const feeInstance = await FeeInstance.findById(feeInstanceId).session(session);
//             if (!feeInstance) throw new Error('Fee instance not found');

//             // Only allow certain updates
//             const allowedUpdates = ['notes', 'dueDate', 'status'];
//             const updateData = {};

//             Object.keys(updates).forEach(key => {
//                 if (allowedUpdates.includes(key)) {
//                     updateData[key] = updates[key];
//                 }
//             });

//             if (Object.keys(updateData).length === 0) {
//                 throw new Error('No valid updates provided');
//             }

//             const updated = await FeeInstance.findByIdAndUpdate(
//                 feeInstanceId,
//                 updateData,
//                 { new: true, session }
//             );

//             await session.commitTransaction();
//             return updated;

//         } catch (error) {
//             await session.abortTransaction();
//             throw error;
//         } finally {
//             session.endSession();
//         }
//     }

//     // FeeService.js - ADD THIS STATIC METHOD
//     static getCurrentSession(offsetYears = 0) {
//         const currentDate = new Date();
//         const currentYear = currentDate.getFullYear();
//         const currentMonth = currentDate.getMonth(); // 0 = January

//         // Academic year logic: If current month is before June, use previous year
//         let academicYearStart = currentYear;
//         if (currentMonth < 5) { // Before June
//             academicYearStart = currentYear - 1;
//         }

//         // Apply offset
//         academicYearStart += offsetYears;

//         return `${academicYearStart}-${academicYearStart + 1}`;
//     }

//     // static getCurrentSession(offsetYears = 0) {
//     //     const year = new Date().getFullYear() + offsetYears;
//     //     return `${year}`;
//     // }

//     // Also add to calculate due date more accurately
//     static calculateDueDate(template, issueDate = new Date()) {
//         const dueDate = new Date(issueDate);

//         switch (template.frequency) {
//             case 'monthly':
//                 dueDate.setMonth(dueDate.getMonth() + 1);
//                 dueDate.setDate(template.dueDay || 1);
//                 break;
//             case 'quarterly':
//                 dueDate.setMonth(dueDate.getMonth() + 3);
//                 dueDate.setDate(template.dueDay || 1);
//                 break;
//             case 'yearly':
//                 dueDate.setFullYear(dueDate.getFullYear() + 1);
//                 dueDate.setDate(template.dueDay || 1);
//                 break;
//             case 'custom':
//                 dueDate.setDate(template.dueDay || 1);
//                 if (dueDate <= issueDate) {
//                     dueDate.setMonth(dueDate.getMonth() + 1);
//                 }
//                 break;
//             // one_time - due in 30 days
//             default:
//                 dueDate.setDate(dueDate.getDate() + 30);
//         }

//         return dueDate;
//     }
// }

// module.exports = FeeService;