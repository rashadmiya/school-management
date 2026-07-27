// services/FeeService.js - COMPLETE REWRITE
const mongoose = require('mongoose');
const FeeTemplate = require('../financeSystem/models/FeeTemplate');
const FeeInstance = require('../financeSystem/models/FeeInstance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const LedgerService = require('./LedgerService');
const TransactionService = require('./TransactionService');

class FeeService {
    static async createTemplate(data, userId) {
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            // Add metadata
            const templateData = {
                ...data,
                createdBy: userId,
                updatedBy: userId,
                session: data.session || this.getCurrentSession()
            };

            const template = await FeeTemplate.create([templateData], { session });

            await session.commitTransaction();
            return template[0];

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async applyFeeTemplate(templateId, userId, options = {}) {
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const template = await FeeTemplate.findById(templateId).session(session);
            if (!template) throw new Error('Fee template not found');
            if (!template.isActive) throw new Error('Fee template is inactive');

            // Generate transaction ID for idempotency
            const transactionId = await TransactionService.createTransactionId(
                'fee_creation',
                userId
            );

            await TransactionService.beginTransaction(transactionId, 'fee_creation', {
                userId,
                templateId
            });

            let students = [];
            const currentSession = template.session || this.getCurrentSession();

            // Determine which students to apply to
            switch (template.appliesTo.scope) {
                case 'all':
                    students = await Student.find({
                        session: currentSession,
                        isActive: true
                    }).session(session);
                    break;

                case 'class':
                    if (!template.appliesTo.class) {
                        throw new Error('Class is required for class scope');
                    }
                    students = await Student.find({
                        class: template.appliesTo.class,
                        session: currentSession,
                        isActive: true
                    }).session(session);
                    break;

                case 'section':
                    if (!template.appliesTo.class || !template.appliesTo.section) {
                        throw new Error('Class and section are required for section scope');
                    }
                    students = await Student.find({
                        class: template.appliesTo.class,
                        section: template.appliesTo.section,
                        session: currentSession,
                        isActive: true
                    }).session(session);
                    break;

                case 'individual':
                    if (!template.appliesTo.individualStudent) {
                        throw new Error('Student is required for individual scope');
                    }
                    students = await Student.find({
                        _id: template.appliesTo.individualStudent,
                        session: currentSession,
                        isActive: true
                    }).session(session);
                    break;

                default:
                    throw new Error('Invalid scope');
            }

            if (students.length === 0) {
                throw new Error('No students found to apply fee to');
            }

            const feeInstances = [];
            const ledgerEntries = [];

            // Calculate due date
            const dueDate = this.calculateDueDate(template);

            for (const student of students) {
                // Check if fee instance already exists
                const existing = await FeeInstance.findOne({
                    student: student._id,
                    feeTemplate: template._id,
                    session: currentSession,
                    isActive: true
                }).session(session);

                if (existing && !options.force) {
                    continue; // Skip if already exists
                }

                // Calculate total amount with tax
                const taxAmount = template.taxPercentage ?
                    (template.amount * template.taxPercentage) / 100 : 0;
                const totalAmount = template.amount + taxAmount;

                // Create fee instance
                const feeInstance = new FeeInstance({
                    student: student._id,
                    feeTemplate: template._id,
                    originalAmount: template.amount,
                    taxAmount,
                    totalAmount,
                    dueDate,
                    session: currentSession,
                    createdBy: userId,
                    status: 'unpaid'
                });

                await feeInstance.save({ session });
                feeInstances.push(feeInstance);

                // Create ledger entry
                const ledgerEntry = await LedgerService.createEntry({
                    student: student._id,
                    transactionId,
                    type: 'fee',
                    debit: totalAmount,
                    refModel: 'FeeInstance',
                    refId: feeInstance._id,
                    description: `Fee: ${template.title}`,
                    createdBy: userId,
                    session: currentSession
                }, session);

                ledgerEntries.push(ledgerEntry);
            }

            await TransactionService.completeTransaction(transactionId, {
                feeInstances: feeInstances.length,
                students: students.length
            });

            await session.commitTransaction();

            return {
                template: template.title,
                appliedTo: feeInstances.length,
                feeInstances: feeInstances.map(fi => fi._id),
                transactionId
            };

        } catch (error) {
            await session.abortTransaction();

            // Mark transaction as failed if we have transactionId
            if (error.transactionId) {
                await TransactionService.failTransaction(error.transactionId, error);
            }

            throw error;
        } finally {
            session.endSession();
        }
    }

    static async getStudentFees(studentId, sessionYear, status = null) {
        const query = {
            student: studentId,
            session: sessionYear,
            isActive: true
        };

        if (status) {
            query.status = status;
        }

        return FeeInstance.find(query)
            .populate('feeTemplate', 'title description frequency')
            .sort({ dueDate: 1 })
            .lean();
    }

    static async getFeeSummary(studentId, sessionYear) {
        const fees = await this.getStudentFees(studentId, sessionYear);

        const summary = {
            totalFees: 0,
            totalPaid: 0,
            totalWaived: 0,
            totalDue: 0,
            totalAdvanceUsed: 0,
            feeCount: fees.length,
            byStatus: {
                unpaid: 0,
                partial: 0,
                paid: 0,
                waived: 0,
                overdue: 0
            }
        };

        fees.forEach(fee => {
            summary.totalFees += fee.totalAmount;
            summary.totalPaid += fee.paidAmount;
            summary.totalWaived += fee.waivedAmount;
            summary.totalAdvanceUsed += fee.advanceUsed;
            summary.totalDue += fee.dueAmount;

            if (summary.byStatus[fee.status] !== undefined) {
                summary.byStatus[fee.status]++;
            }
        });

        return summary;
    }

    // static calculateDueDate(template) {
    //     const dueDate = new Date();

    //     switch (template.frequency) {
    //         case 'monthly':
    //             dueDate.setMonth(dueDate.getMonth() + 1);
    //             break;
    //         case 'quarterly':
    //             dueDate.setMonth(dueDate.getMonth() + 3);
    //             break;
    //         case 'yearly':
    //             dueDate.setFullYear(dueDate.getFullYear() + 1);
    //             break;
    //         case 'custom':
    //             // Use dueDay from template
    //             dueDate.setDate(template.dueDay || 1);
    //             if (dueDate < new Date()) {
    //                 dueDate.setMonth(dueDate.getMonth() + 1);
    //             }
    //             break;
    //         // one_time - due in 30 days
    //         default:
    //             dueDate.setDate(dueDate.getDate() + 30);
    //     }

    //     return dueDate;
    // }

    // static getCurrentSession() {
    //     const currentYear = new Date().getFullYear();
    //     return `${currentYear}-${currentYear + 1}`;
    // }

    static async updateFeeInstance(feeInstanceId, updates, userId) {
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const feeInstance = await FeeInstance.findById(feeInstanceId).session(session);
            if (!feeInstance) throw new Error('Fee instance not found');

            // Only allow certain updates
            const allowedUpdates = ['notes', 'dueDate', 'status'];
            const updateData = {};

            Object.keys(updates).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updateData[key] = updates[key];
                }
            });

            if (Object.keys(updateData).length === 0) {
                throw new Error('No valid updates provided');
            }

            const updated = await FeeInstance.findByIdAndUpdate(
                feeInstanceId,
                updateData,
                { new: true, session }
            );

            await session.commitTransaction();
            return updated;

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // FeeService.js - ADD THIS STATIC METHOD
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

    // static getCurrentSession(offsetYears = 0) {
    //     const year = new Date().getFullYear() + offsetYears;
    //     return `${year}`;
    // }

    // Also add to calculate due date more accurately
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
                if (dueDate <= issueDate) {
                    dueDate.setMonth(dueDate.getMonth() + 1);
                }
                break;
            // one_time - due in 30 days
            default:
                dueDate.setDate(dueDate.getDate() + 30);
        }

        return dueDate;
    }
}

module.exports = FeeService;

// const FeeTemplate = require("../models/FeeTemplate");
// const FeeInstance = require("../models/FeeInstance");
// const LedgerService = require("./LedgerService");
// const Student = require("../models/Student");

// class FeeService {

//   // create fee template
//   static async createTemplate(data) {
//     return FeeTemplate.create(data);
//   }

//   // apply fee to students
//   static async applyFee(templateId) {
//     const template = await FeeTemplate.findById(templateId);
//     if (!template) throw new Error("Fee template not found");

//     let students = [];

//     if (template.appliesTo.scope === "school") {
//       students = await Student.find({});
//     }

//     if (template.appliesTo.scope === "class") {
//       students = await Student.find({ class: template.appliesTo.class });
//     }

//     if (template.appliesTo.scope === "section") {
//       students = await Student.find({
//         class: template.appliesTo.class,
//         section: template.appliesTo.section
//       });
//     }

//     for (const student of students) {
//       const feeInstance = await FeeInstance.create({
//         student: student._id,
//         feeTemplate: template._id,
//         originalAmount: template.amount
//       });

//       // ledger: fee increases balance (debit)
//       await LedgerService.createEntry({
//         student: student._id,
//         type: "fee",
//         debit: template.amount,
//         refModel: "FeeInstance",
//         refId: feeInstance._id
//       });
//     }

//     return { appliedTo: students.length };
//   }
// }

// module.exports = FeeService;
