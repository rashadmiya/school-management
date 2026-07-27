// services/WaiverService.js - COMPLETE REWRITE
const mongoose = require('mongoose');
const FeeWaiver = require('../financeSystem/models/FeeWaiver');
const FeeInstance = require('../financeSystem/models/FeeInstance');
const LedgerService = require('./LedgerService');
const TransactionService = require('./TransactionService');

class WaiverService {
    static async requestWaiver(waiverData, userId) {
        const session = await mongoose.startSession();
        
        try {
            session.startTransaction();
            
            const { feeInstanceId, type, amount, percentage, reason, supportingDocuments, effectiveFrom, effectiveUntil } = waiverData;
            
            // Get fee instance
            const feeInstance = await FeeInstance.findById(feeInstanceId).session(session);
            if (!feeInstance) throw new Error('Fee instance not found');
            
            // Calculate waiver amount
            let waiverAmount = amount;
            if (percentage) {
                waiverAmount = (feeInstance.totalAmount * percentage) / 100;
            }
            
            // Validate waiver amount
            const maxWaivable = feeInstance.totalAmount - feeInstance.waivedAmount;
            if (waiverAmount > maxWaivable) {
                throw new Error(`Maximum waivable amount is ${maxWaivable}`);
            }
            
            // Check for existing pending/approved waiver
            const existingWaiver = await FeeWaiver.findOne({
                feeInstance: feeInstanceId,
                status: { $in: ['pending', 'approved'] }
            }).session(session);
            
            if (existingWaiver) {
                throw new Error('A waiver already exists for this fee instance');
            }
            
            // Create waiver request
            const waiver = new FeeWaiver({
                student: feeInstance.student,
                feeInstance: feeInstanceId,
                type,
                amount: waiverAmount,
                percentage: percentage || null,
                reason,
                supportingDocuments: supportingDocuments || [],
                status: 'pending',
                requestedBy: userId,
                requestDate: new Date(),
                effectiveFrom: effectiveFrom || new Date(),
                effectiveUntil: effectiveUntil || null
            });
            
            await waiver.save({ session });
            
            await session.commitTransaction();
            
            return waiver;
            
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async approveWaiver(waiverId, userId, remarks = '') {
        const session = await mongoose.startSession();
        
        try {
            session.startTransaction();
            
            const transactionId = await TransactionService.createTransactionId('waiver', userId);
            
            await TransactionService.beginTransaction(transactionId, 'waiver', {
                userId,
                waiverId
            });
            
            // Get waiver
            const waiver = await FeeWaiver.findById(waiverId).session(session);
            if (!waiver) throw new Error('Waiver not found');
            
            if (waiver.status !== 'pending') {
                throw new Error(`Waiver is already ${waiver.status}`);
            }
            
            // Get fee instance
            const feeInstance = await FeeInstance.findById(waiver.feeInstance).session(session);
            if (!feeInstance) throw new Error('Fee instance not found');
            
            // Update waiver
            waiver.status = 'approved';
            waiver.approvedBy = userId;
            waiver.approvedDate = new Date();
            waiver.remarks = remarks;
            
            // Add to revision history
            waiver.revisionHistory.push({
                changedBy: userId,
                changedAt: new Date(),
                changes: { status: 'approved' },
                reason: 'Approved waiver'
            });
            
            await waiver.save({ session });
            
            // Update fee instance
            const previousWaivedAmount = feeInstance.waivedAmount;
            feeInstance.waivedAmount += waiver.amount;
            feeInstance.waiver = waiver._id;
            feeInstance.dueAmount = feeInstance.totalAmount - feeInstance.paidAmount - feeInstance.waivedAmount - feeInstance.advanceUsed;
            
            // Update status
            if (feeInstance.dueAmount <= 0) {
                feeInstance.status = 'waived';
                feeInstance.paidDate = new Date();
            } else if (feeInstance.waivedAmount > 0) {
                feeInstance.status = 'partial';
            }
            
            await feeInstance.save({ session });
            
            // Create ledger entry
            await LedgerService.createEntry({
                student: feeInstance.student,
                transactionId,
                type: 'waiver',
                credit: waiver.amount,
                refModel: 'FeeWaiver',
                refId: waiver._id,
                description: `Waiver approved: ${waiver.reason}`,
                createdBy: userId,
                session: feeInstance.session
            }, session);
            
            await TransactionService.completeTransaction(transactionId, {
                waiverId: waiver._id,
                amount: waiver.amount,
                feeInstanceId: feeInstance._id
            });
            
            await session.commitTransaction();
            
            return {
                waiver,
                feeInstance,
                amountWaived: waiver.amount
            };
            
        } catch (error) {
            await session.abortTransaction();
            
            if (error.transactionId) {
                await TransactionService.failTransaction(error.transactionId, error);
            }
            
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async rejectWaiver(waiverId, userId, reason) {
        const waiver = await FeeWaiver.findByIdAndUpdate(
            waiverId,
            {
                status: 'rejected',
                reviewedBy: userId,
                remarks: reason,
                $push: {
                    revisionHistory: {
                        changedBy: userId,
                        changedAt: new Date(),
                        changes: { status: 'rejected' },
                        reason
                    }
                }
            },
            { new: true }
        );
        
        if (!waiver) throw new Error('Waiver not found');
        
        return waiver;
    }

    static async revokeWaiver(waiverId, userId, reason) {
        const session = await mongoose.startSession();
        
        try {
            session.startTransaction();
            
            const transactionId = await TransactionService.createTransactionId('waiver_revocation', userId);
            
            await TransactionService.beginTransaction(transactionId, 'waiver_revocation', {
                userId,
                waiverId
            });
            
            // Get waiver
            const waiver = await FeeWaiver.findById(waiverId).session(session);
            if (!waiver) throw new Error('Waiver not found');
            
            if (waiver.status !== 'approved') {
                throw new Error('Only approved waivers can be revoked');
            }
            
            // Get fee instance
            const feeInstance = await FeeInstance.findById(waiver.feeInstance).session(session);
            if (!feeInstance) throw new Error('Fee instance not found');
            
            // Update waiver
            waiver.status = 'revoked';
            waiver.remarks = reason;
            
            waiver.revisionHistory.push({
                changedBy: userId,
                changedAt: new Date(),
                changes: { status: 'revoked' },
                reason
            });
            
            await waiver.save({ session });
            
            // Update fee instance (reverse the waiver)
            feeInstance.waivedAmount -= waiver.amount;
            feeInstance.dueAmount = feeInstance.totalAmount - feeInstance.paidAmount - feeInstance.waivedAmount - feeInstance.advanceUsed;
            feeInstance.waiver = null;
            
            // Update status
            if (feeInstance.dueAmount > 0) {
                if (feeInstance.paidAmount > 0) {
                    feeInstance.status = 'partial';
                } else {
                    feeInstance.status = 'unpaid';
                }
            }
            
            await feeInstance.save({ session });
            
            // Create reversal ledger entry
            await LedgerService.createEntry({
                student: feeInstance.student,
                transactionId,
                type: 'waiver',
                debit: waiver.amount, // Debit to reverse the credit
                refModel: 'FeeWaiver',
                refId: waiver._id,
                description: `Waiver revoked: ${reason}`,
                createdBy: userId,
                session: feeInstance.session,
                isReversal: true
            }, session);
            
            await TransactionService.completeTransaction(transactionId, {
                waiverId: waiver._id,
                amountReversed: waiver.amount,
                feeInstanceId: feeInstance._id
            });
            
            await session.commitTransaction();
            
            return {
                waiver,
                feeInstance,
                amountReversed: waiver.amount
            };
            
        } catch (error) {
            await session.abortTransaction();
            
            if (error.transactionId) {
                await TransactionService.failTransaction(error.transactionId, error);
            }
            
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async getWaiverRequests(studentId = null, status = null, limit = 50) {
        const query = {};
        
        if (studentId) {
            query.student = studentId;
        }
        
        if (status) {
            query.status = status;
        }
        
        return FeeWaiver.find(query)
            .sort({ requestDate: -1 })
            .limit(limit)
            .populate('student', 'name rollNumber')
            .populate('feeInstance', 'totalAmount dueAmount status')
            .populate('requestedBy', 'name email')
            .populate('approvedBy', 'name email')
            .lean();
    }

    static async calculateEligibleWaiver(feeInstanceId) {
        const feeInstance = await FeeInstance.findById(feeInstanceId);
        if (!feeInstance) throw new Error('Fee instance not found');
        
        return {
            feeInstanceId,
            totalAmount: feeInstance.totalAmount,
            alreadyWaived: feeInstance.waivedAmount,
            maxWaivable: feeInstance.totalAmount - feeInstance.waivedAmount,
            paidAmount: feeInstance.paidAmount,
            dueAmount: feeInstance.dueAmount
        };
    }
}

module.exports = WaiverService;