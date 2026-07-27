// controllers/PaymentController.js - UPDATED
const Student = require('../models/Student');
const PaymentService = require('../services/PaymentService');
const { validationResult } = require('express-validator');
const Payment = require('./models/Payment');
const mongoose = require('mongoose');


class PaymentController {
    // POST /api/payments
    static async receivePayment(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const result = await PaymentService.receivePayment(req.body, req.user._id);

            res.status(201).json({
                success: true,
                message: 'Payment received successfully',
                data: result
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // GET /api/payments/student/:studentId
    // static async getPaymentHistory(req, res) {
    //     try {
    //         const { session = PaymentService.getCurrentSession(), limit = 50 } = req.query;
    //         const payments = await PaymentService.getPaymentHistory(
    //             req.params.studentId, 
    //             session,
    //             parseInt(limit)
    //         );

    //         res.json({
    //             success: true,
    //             data: payments
    //         });
    //     } catch (err) {
    //         res.status(400).json({
    //             success: false,
    //             message: err.message
    //         });
    //     }
    // }

    static async getPaymentHistory(req, res) {
        try {

            const { session = PaymentService.getCurrentSession(), limit = 50 } = req.query;
            const studentParam = req.params.studentId;

            // console.log('Looking for student with:', studentParam);

            let student;

            // Check if it's a valid MongoDB ObjectId
            if (mongoose.Types.ObjectId.isValid(studentParam)) {
                student = await Student.findById(studentParam);
                // console.log('Found by ID:', student ? student.name : 'NOT FOUND');
            }
            // If not ObjectId, search by roll number
            else if (/^\d+$/.test(studentParam)) {
                student = await Student.findOne({ rollNumber: studentParam });
                // console.log('Found by roll number:', student ? student.name : 'NOT FOUND');
            }
            // Search by name
            else {
                student = await Student.findOne({
                    name: { $regex: studentParam, $options: 'i' }
                });
                // console.log('Found by name:', student ? student.name : 'NOT FOUND');
            }

            if (!student) {
                // console.log('Student not found with any method');
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            // console.log('Student found:', {
            //     id: student._id,
            //     name: student.name,
            //     rollNumber: student.rollNumber
            // });

            const payments = await Payment.find({
                student: student._id,
                session: session
            })
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .populate('student', 'name rollNumber class')
                .populate('receivedBy', 'name email')
                .lean();

            // console.log(`Found ${payments.length} payments for student`);

            res.json({
                success: true,
                data: payments
            });

        } catch (err) {
            console.error('Error in getPaymentHistory:', err);
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // NEW: Search payments with multiple criteria
    static async searchPayments(req, res) {
        try {
            const {
                search = '',
                session = PaymentService.getCurrentSession(),
                method,
                status = 'completed',
                startDate,
                endDate,
                limit = 50,
                page = 1
            } = req.query;

            // console.log('searchPayments called with:', req.query);

            let query = {
                session,
                status // Only show completed payments by default
            };

            // Search by student name or roll number
            if (search) {
                // Find students matching search
                const students = await Student.find({
                    $or: [
                        { rollNumber: { $regex: search, $options: 'i' } },
                        { name: { $regex: search, $options: 'i' } }
                    ]
                }).select('_id');

                const studentIds = students.map(s => s._id);

                if (studentIds.length > 0) {
                    query.student = { $in: studentIds };
                } else {
                    // If no students found, return empty
                    return res.json({
                        success: true,
                        data: [],
                        pagination: {
                            page: 1,
                            limit: parseInt(limit),
                            total: 0,
                            pages: 0
                        }
                    });
                }
            }

            if (method) query.method = method;
            if (status) query.status = status;

            // Date range
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            // Calculate pagination
            const skip = (page - 1) * limit;
            const total = await Payment.countDocuments(query);

            const payments = await Payment.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('student', 'name rollNumber class')
                .populate('receivedBy', 'name email')
                .lean();

            // console.log(`Found ${payments.length} payments`);

            res.json({
                success: true,
                data: payments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (err) {
            console.error('Error in searchPayments:', err);
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // GET /api/payments/:id/allocations
    static async getPaymentAllocations(req, res) {
        try {
            const allocations = await PaymentService.getPaymentAllocations(req.params.id);

            res.json({
                success: true,
                data: allocations
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // GET /api/payments/student/:studentId/advance
    static async getAdvanceBalance(req, res) {
        try {
            const advanceBalance = await PaymentService.getStudentAdvanceBalance(req.params.studentId);

            res.json({
                success: true,
                data: advanceBalance || { amount: 0, currency: 'BDT', transactions: [] }
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // POST /api/payments/use-advance
    static async useAdvanceBalance(req, res) {
        try {
            const { studentId, feeInstanceId, amount } = req.body;

            const result = await PaymentService.useAdvanceBalance(
                studentId,
                feeInstanceId,
                amount,
                req.user._id
            );

            res.json({
                success: true,
                message: 'Advance balance used successfully',
                data: result
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // POST /api/payments/auto-apply-advance
    static async autoApplyAdvance(req, res) {
        try {
            const { studentId } = req.body;

            const result = await PaymentService.autoApplyAdvanceBalance(
                studentId,
                req.user._id
            );

            res.json({
                success: true,
                message: result.message || 'Advance balance applied successfully',
                data: result
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
}

module.exports = PaymentController;