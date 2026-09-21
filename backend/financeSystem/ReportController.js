// controllers/ReportController.js - FIXED VERSION
const ReportService = require('../services/ReportService');
const { validationResult } = require('express-validator');

class ReportController {
    // GET /api/finance/reports/collection/payments
    static async getPaymentCollectionReport(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const {
                session,
                startDate,
                endDate,
                method,
                classId
            } = req.query;

            // Format dates properly
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            
            if (start) start.setHours(0, 0, 0, 0);
            if (end) end.setHours(23, 59, 59, 999);

            // Get payment statistics
            const paymentStats = await ReportService.getCollectionStatistics({
                session,
                startDate: start,
                endDate: end,
                method,
                classId
            });

            // Get payment method breakdown
            const methodData = await ReportService.getPaymentMethodData({
                session,
                startDate: start,
                endDate: end,
                method,
                classId
            });

            // Get daily collection data
            const dailyData = await ReportService.getDailyCollectionForChart({
                session,
                startDate: start,
                endDate: end
            });

            // Get top students
            const topStudents = await ReportService.getTopStudentsFormatted({
                session,
                startDate: start,
                endDate: end,
                limit: 5
            });

            // Get fee collection rate
            const feeStats = await ReportService.getFeeCollectionReport({
                session,
                startDate: start,
                endDate: end,
                classId
            });

            // Build response matching frontend expectations
            const response = {
                totalAmount: paymentStats.totalCollection || 0,
                totalTransactions: paymentStats.totalTransactions || 0,
                averageTransaction: paymentStats.averageTransaction || 0,
                collectionRate: feeStats.summary?.collectionRate || 0,
                byMethod: methodData.map(item => ({
                    method: item.method,
                    amount: item.amount || 0,
                    count: item.count || 0,
                    percentage: item.percentage || 0
                })),
                dailyCollection: dailyData.map(item => ({
                    date: item.date,
                    amount: item.amount || 0,
                    transactions: item.transactions || 0
                })),
                topStudents: topStudents.map(item => ({
                    name: item.name,
                    class: item.class,
                    amount: item.amount || 0,
                    payments: item.payments || 0
                }))
            };

            res.json({
                success: true,
                data: response
            });

        } catch (err) {
            console.error('Error in getPaymentCollectionReport:', err);
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // GET /api/finance/reports/collection/fees
    static async getFeeCollectionReport(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const {
                session,
                startDate,
                endDate,
                classId
            } = req.query;

            // Format dates properly
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            
            if (start) start.setHours(0, 0, 0, 0);
            if (end) end.setHours(23, 59, 59, 999);

            const result = await ReportService.getFeeCollectionReport({
                session,
                startDate: start,
                endDate: end,
                classId
            });

            // Format response to match frontend
            const response = {
                summary: result.summary || {
                    totalGenerated: 0,
                    totalPaid: 0,
                    totalDue: 0,
                    totalWaived: 0,
                    totalAdvanceUsed: 0,
                    count: 0,
                    paidCount: 0,
                    unpaidCount: 0,
                    collectionRate: 0
                },
                statusDistribution: result.statusDistribution || [],
                classWise: result.classWise || []
            };

            res.json({
                success: true,
                data: response
            });

        } catch (err) {
            console.error('Error in getFeeCollectionReport:', err);
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // Additional endpoints for dashboard report types can be added here
    static async getFinanceDashboard(req, res) {
        try {
            const { session } = req.query;
            
            const dashboardData = await ReportService.getDashboardData(session);
            
            res.json({
                success: true,
                data: dashboardData
            });
            
        } catch (err) {
            console.error('Error in getFinanceDashboard:', err);
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
}

module.exports = ReportController;