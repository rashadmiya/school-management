// services/ReportService.js - FIXED VERSION
const mongoose = require('mongoose');
const Payment = require('../financeSystem/models/Payment');
const FeeInstance = require('../financeSystem/models/FeeInstance');
const Student = require('../models/Student');
const FeeWaiver = require('../financeSystem/models/FeeWaiver');
const Refund = require('../financeSystem/models/Refund');

class ReportService {
    static getCurrentSession() {
        const currentYear = new Date().getFullYear();
        return `${currentYear}-${currentYear + 1}`;
    }

    // Get collection statistics
    static async getCollectionStatistics(filters = {}) {
        const {
            session = this.getCurrentSession(),
            startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)),
            endDate = new Date(),
            method = null,
            classId = null
        } = filters;

        const query = {
            session,
            status: 'completed'
        };

        // Date filter
        if (startDate) query.createdAt = { $gte: startDate };
        if (endDate) query.createdAt = { ...query.createdAt, $lte: endDate };

        // Method filter
        if (method) query.method = method;

        // Class filter
        if (classId) {
            const students = await Student.find({ class: classId }).select('_id');
            const studentIds = students.map(s => s._id);
            query.student = { $in: studentIds };
        }

        const stats = await Payment.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalCollection: { $sum: '$amount' },
                    totalTransactions: { $sum: 1 },
                    averageTransaction: { $avg: '$amount' }
                }
            }
        ]);

        return stats[0] || {
            totalCollection: 0,
            totalTransactions: 0,
            averageTransaction: 0
        };
    }

    // Get payment method data
    static async getPaymentMethodData(filters = {}) {
        const {
            session = this.getCurrentSession(),
            startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)),
            endDate = new Date(),
            method = null,
            classId = null
        } = filters;

        const query = {
            session,
            status: 'completed'
        };

        if (startDate) query.createdAt = { $gte: startDate };
        if (endDate) query.createdAt = { ...query.createdAt, $lte: endDate };
        if (method) query.method = method;

        if (classId) {
            const students = await Student.find({ class: classId }).select('_id');
            const studentIds = students.map(s => s._id);
            query.student = { $in: studentIds };
        }

        const methodData = await Payment.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$method',
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    method: '$_id',
                    amount: 1,
                    count: 1,
                    _id: 0
                }
            },
            { $sort: { amount: -1 } }
        ]);

        // Calculate total for percentages
        const totalAmount = methodData.reduce((sum, item) => sum + item.amount, 0);

        return methodData.map(item => ({
            ...item,
            percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
        }));
    }

    // Get daily collection for chart
    static async getDailyCollectionForChart(filters = {}) {
        const {
            session = this.getCurrentSession(),
            startDate = new Date(new Date().setDate(new Date().getDate() - 30)),
            endDate = new Date()
        } = filters;

        const query = {
            session,
            status: 'completed',
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        };

        const dailyData = await Payment.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    amount: { $sum: '$amount' },
                    transactions: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: {
                        $dateFromParts: {
                            year: '$_id.year',
                            month: '$_id.month',
                            day: '$_id.day'
                        }
                    },
                    amount: 1,
                    transactions: 1
                }
            },
            { $sort: { date: 1 } }
        ]);

        return dailyData;
    }

    // Get top students formatted
    static async getTopStudentsFormatted(filters = {}) {
        const {
            session = this.getCurrentSession(),
            startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)),
            endDate = new Date(),
            limit = 5
        } = filters;

        const query = {
            session,
            status: 'completed'
        };

        if (startDate) query.createdAt = { $gte: startDate };
        if (endDate) query.createdAt = { ...query.createdAt, $lte: endDate };

        const topStudents = await Payment.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$student',
                    amount: { $sum: '$amount' },
                    payments: { $sum: 1 }
                }
            },
            { $sort: { amount: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'students',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            { $unwind: '$studentInfo' },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'studentInfo.class',
                    foreignField: '_id',
                    as: 'classInfo'
                }
            },
            { $unwind: { path: '$classInfo', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    name: '$studentInfo.name',
                    class: '$classInfo.name',
                    amount: 1,
                    payments: 1
                }
            }
        ]);

        return topStudents;
    }

    // Get fee collection report
    static async getFeeCollectionReport(filters = {}) {
        const {
            session = this.getCurrentSession(),
            startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)),
            endDate = new Date(),
            classId = null
        } = filters;

        const query = {
            session,
            isActive: true
        };

        if (startDate) query.issueDate = { $gte: startDate };
        if (endDate) query.issueDate = { ...query.issueDate, $lte: endDate };

        if (classId) {
            const students = await Student.find({ class: classId }).select('_id');
            const studentIds = students.map(s => s._id);
            query.student = { $in: studentIds };
        }

        const feeStats = await FeeInstance.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalGenerated: { $sum: '$totalAmount' },
                    totalPaid: { $sum: '$paidAmount' },
                    totalDue: { $sum: '$dueAmount' },
                    totalWaived: { $sum: '$waivedAmount' },
                    totalAdvanceUsed: { $sum: '$advanceUsed' },
                    count: { $sum: 1 },
                    paidCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
                    }
                }
            }
        ]);

        const statusDistribution = await FeeInstance.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        const classWise = await FeeInstance.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'students',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            { $unwind: '$studentInfo' },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'studentInfo.class',
                    foreignField: '_id',
                    as: 'classInfo'
                }
            },
            { $unwind: { path: '$classInfo', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$classInfo._id',
                    className: { $first: '$classInfo.name' },
                    totalGenerated: { $sum: '$totalAmount' },
                    totalPaid: { $sum: '$paidAmount' },
                    totalDue: { $sum: '$dueAmount' },
                    studentCount: { $addToSet: '$student' }
                }
            },
            {
                $project: {
                    _id: 0,
                    classId: '$_id',
                    className: 1,
                    totalGenerated: 1,
                    totalPaid: 1,
                    totalDue: 1,
                    studentCount: { $size: '$studentCount' }
                }
            }
        ]);

        const summary = feeStats[0] || {
            totalGenerated: 0,
            totalPaid: 0,
            totalDue: 0,
            totalWaived: 0,
            totalAdvanceUsed: 0,
            count: 0,
            paidCount: 0
        };

        // Calculate collection rate
        const netAmount = summary.totalGenerated - summary.totalWaived;
        const collectedAmount = summary.totalPaid + summary.totalAdvanceUsed;
        summary.collectionRate = netAmount > 0 ? (collectedAmount / netAmount) * 100 : 0;

        return {
            summary,
            statusDistribution,
            classWise
        };
    }

    //🎢🎨🕶️ dashboard methods can be added here as needed
    static async getDashboardData(session = null) {
        const currentSession = session || this.getCurrentSession();

        // Run all queries in parallel for better performance
        const [
            studentStats,
            paymentStats,
            outstandingStats,
            recentPayments,
            pendingActions
        ] = await Promise.all([
            this.getStudentStatistics(currentSession),
            this.getPaymentStatistics(currentSession),
            this.getOutstandingStatistics(currentSession),
            this.getRecentPayments(currentSession),
            this.getPendingActions()
        ]);

        return {
            totalStudents: studentStats.total,
            activeStudents: studentStats.active,
            totalCollection: paymentStats.totalAmount,
            outstandingAmount: outstandingStats.total,
            collectionRate: paymentStats.totalAmount > 0
                ? Math.round((paymentStats.totalAmount / (paymentStats.totalAmount + outstandingStats.total)) * 100)
                : 0,
            pendingActions: pendingActions.total,
            recentPayments,
            quickActions: [
                { label: 'Receive Payment', description: 'Record new payment', path: '/finance/payments/receive' },
                { label: 'Apply Fees', description: 'Apply fee template to students', path: '/finance/fees/apply' },
                { label: 'Process Refund', description: 'Handle refund request', path: '/finance/refunds' },
                { label: 'Generate Report', description: 'Collection/Outstanding report', path: '/finance/reports/collection' },
            ],
            alerts: await this.getSystemAlerts()
        };
    }

    static getCurrentSession() {
        const currentYear = new Date().getFullYear();
        return `${currentYear}-${currentYear + 1}`;
    }

    static async getStudentStatistics(session) {
        const [total, active] = await Promise.all([
            Student.countDocuments({ session, isActive: true }),
            Student.countDocuments({
                session,
                isActive: true,
                // You might have a different criteria for "active" students
                // For example, students with at least one fee instance this session
            })
        ]);

        return { total, active };
    }

    static async getPaymentStatistics(session) {
        const currentYear = new Date().getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

        const stats = await Payment.aggregate([
            {
                $match: {
                    session,
                    status: 'completed',
                    createdAt: { $gte: yearStart, $lte: yearEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalTransactions: { $sum: 1 },
                    monthTotal: {
                        $sum: {
                            $cond: [
                                { $eq: [{ $month: '$createdAt' }, new Date().getMonth() + 1] },
                                '$amount',
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        return stats[0] || { totalAmount: 0, totalTransactions: 0, monthTotal: 0 };
    }

    static async getOutstandingStatistics(session) {
        const stats = await FeeInstance.aggregate([
            {
                $match: {
                    session,
                    status: { $in: ['unpaid', 'partial', 'overdue'] },
                    isActive: true,
                    dueAmount: { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$dueAmount' },
                    count: { $sum: 1 },
                    overdueCount: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'overdue'] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        return stats[0] || { total: 0, count: 0, overdueCount: 0 };
    }

    static async getRecentPayments(session, limit = 5) {
        const payments = await Payment.find({
            session,
            status: 'completed'
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('student', 'name class')
            .lean();

        return payments.map(payment => ({
            id: payment._id,
            student: payment.student?.name || 'N/A',
            class: payment.student?.class || 'N/A',
            amount: payment.amount,
            method: payment.method,
            time: payment.createdAt
        }));
    }

    static async getPendingActions() {
        const [pendingWaivers, pendingRefunds] = await Promise.all([
            FeeWaiver.countDocuments({ status: 'pending' }),
            Refund.countDocuments({
                // If you have a status field for refunds
                // status: 'pending'
            })
        ]);

        return {
            total: pendingWaivers + pendingRefunds,
            waivers: pendingWaivers,
            refunds: pendingRefunds
        };
    }

    static async getSystemAlerts() {
        const alerts = [];

        // Check for overdue fees
        const overdueCount = await FeeInstance.countDocuments({
            status: 'overdue',
            isActive: true
        });

        if (overdueCount > 0) {
            alerts.push({
                type: 'warning',
                title: `${overdueCount} Overdue Fee Instances`,
                message: 'Requires immediate attention'
            });
        }

        // Check pending waivers
        const pendingWaivers = await FeeWaiver.countDocuments({ status: 'pending' });
        if (pendingWaivers > 0) {
            alerts.push({
                type: 'info',
                title: `${pendingWaivers} Pending Waiver Requests`,
                message: 'Awaiting approval'
            });
        }

        // Add system maintenance alerts
        const today = new Date();
        const backupDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        if (today.getDay() === 0) { // Sunday
            alerts.push({
                type: 'error',
                title: 'Weekly Backup Due',
                message: 'Schedule backup for today'
            });
        }

        return alerts;
    }
    // End of dashboard methods
}

module.exports = ReportService;

// // services/ReportService.js
// const mongoose = require('mongoose');
// const Payment = require('../financeSystem/models/Payment');
// const FeeInstance = require('../financeSystem/models/FeeInstance');
// const Student = require('../models/Student');
// const Class = require('../models/Class');

// class ReportService {
//     static getCurrentSession() {
//         const currentYear = new Date().getFullYear();
//         return `${currentYear}-${currentYear + 1}`;
//     }

//     // 1. Payment Collection Report
//     static async getPaymentCollectionReport(filters = {}) {
//         const {
//             session = this.getCurrentSession(),
//             startDate = null,
//             endDate = null,
//             method = null,
//             classId = null,
//             limit = 50,
//             page = 1
//         } = filters;

//         const query = {
//             session,
//             status: 'completed'
//         };

//         // Date filter
//         if (startDate || endDate) {
//             query.createdAt = {};
//             if (startDate) {
//                 startDate.setHours(0, 0, 0, 0);
//                 query.createdAt.$gte = startDate;
//             }
//             if (endDate) {
//                 endDate.setHours(23, 59, 59, 999);
//                 query.createdAt.$lte = endDate;
//             }
//         }

//         // Method filter
//         if (method) {
//             query.method = method;
//         }

//         // Class filter - get students in the class
//         if (classId) {
//             const students = await Student.find({ class: classId }).select('_id');
//             const studentIds = students.map(s => s._id);
//             query.student = { $in: studentIds };
//         }

//         const skip = (page - 1) * limit;

//         // Get total count
//         const total = await Payment.countDocuments(query);

//         // Get payments with student details
//         const payments = await Payment.find(query)
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(limit)
//             .populate('student', 'name rollNumber class')
//             .populate('receivedBy', 'name email')
//             .lean();

//         // Get aggregation for summary
//         const summary = await Payment.aggregate([
//             { $match: query },
//             {
//                 $group: {
//                     _id: null,
//                     totalAmount: { $sum: '$amount' },
//                     totalTransactions: { $sum: 1 },
//                     averageAmount: { $avg: '$amount' }
//                 }
//             },
//             {
//                 $project: {
//                     totalAmount: 1,
//                     totalTransactions: 1,
//                     averageAmount: { $round: ['$averageAmount', 2] }
//                 }
//             }
//         ]);

//         return {
//             payments,
//             summary: summary[0] || {
//                 totalAmount: 0,
//                 totalTransactions: 0,
//                 averageAmount: 0
//             },
//             pagination: {
//                 page,
//                 limit,
//                 total,
//                 pages: Math.ceil(total / limit)
//             }
//         };
//     }

//     // 2. Fee Collection Report
//     static async getFeeCollectionReport(filters = {}) {
//         const {
//             session = this.getCurrentSession(),
//             startDate = null,
//             endDate = null,
//             classId = null
//         } = filters;

//         const query = {
//             session,
//             isActive: true
//         };

//         // Date filter for fee instances (based on issue date)
//         if (startDate || endDate) {
//             query.issueDate = {};
//             if (startDate) {
//                 startDate.setHours(0, 0, 0, 0);
//                 query.issueDate.$gte = startDate;
//             }
//             if (endDate) {
//                 endDate.setHours(23, 59, 59, 999);
//                 query.issueDate.$lte = endDate;
//             }
//         }

//         // Class filter
//         if (classId) {
//             const students = await Student.find({ class: classId }).select('_id');
//             const studentIds = students.map(s => s._id);
//             query.student = { $in: studentIds };
//         }

//         // Aggregate fee data
//         const feeData = await FeeInstance.aggregate([
//             { $match: query },
//             {
//                 $group: {
//                     _id: null,
//                     totalGenerated: { $sum: '$totalAmount' },
//                     totalPaid: { $sum: '$paidAmount' },
//                     totalDue: { $sum: '$dueAmount' },
//                     totalWaived: { $sum: '$waivedAmount' },
//                     totalAdvanceUsed: { $sum: '$advanceUsed' },
//                     count: { $sum: 1 },
//                     paidCount: {
//                         $sum: {
//                             $cond: [{ $eq: ['$status', 'paid'] }, 1, 0]
//                         }
//                     },
//                     unpaidCount: {
//                         $sum: {
//                             $cond: [
//                                 { $in: ['$status', ['unpaid', 'partial', 'overdue']] },
//                                 1,
//                                 0
//                             ]
//                         }
//                     }
//                 }
//             },
//             {
//                 $project: {
//                     totalGenerated: 1,
//                     totalPaid: 1,
//                     totalDue: 1,
//                     totalWaived: 1,
//                     totalAdvanceUsed: 1,
//                     count: 1,
//                     paidCount: 1,
//                     unpaidCount: 1,
//                     collectionRate: {
//                         $multiply: [
//                             {
//                                 $divide: [
//                                     { $sum: ['$totalPaid', '$totalAdvanceUsed'] },
//                                     { $subtract: ['$totalGenerated', '$totalWaived'] }
//                                 ]
//                             },
//                             100
//                         ]
//                     }
//                 }
//             }
//         ]);

//         // Get fee distribution by status
//         const statusDistribution = await FeeInstance.aggregate([
//             { $match: query },
//             {
//                 $group: {
//                     _id: '$status',
//                     count: { $sum: 1 },
//                     totalAmount: { $sum: '$totalAmount' },
//                     paidAmount: { $sum: '$paidAmount' },
//                     dueAmount: { $sum: '$dueAmount' }
//                 }
//             },
//             { $sort: { count: -1 } }
//         ]);

//         return {
//             summary: feeData[0] || {
//                 totalGenerated: 0,
//                 totalPaid: 0,
//                 totalDue: 0,
//                 totalWaived: 0,
//                 totalAdvanceUsed: 0,
//                 count: 0,
//                 paidCount: 0,
//                 unpaidCount: 0,
//                 collectionRate: 0
//             },
//             statusDistribution,
//             filters: {
//                 session,
//                 startDate,
//                 endDate,
//                 classId
//             }
//         };
//     }

//     // 3. Daily Collection Summary
//     static async getDailyCollectionSummary(filters = {}) {
//         const {
//             session = this.getCurrentSession(),
//             startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)), // Last 30 days
//             endDate = new Date()
//         } = filters;

//         const query = {
//             session,
//             status: 'completed',
//             createdAt: {
//                 $gte: startDate,
//                 $lte: endDate
//             }
//         };

//         // Group by day
//         const dailySummary = await Payment.aggregate([
//             { $match: query },
//             {
//                 $group: {
//                     _id: {
//                         year: { $year: '$createdAt' },
//                         month: { $month: '$createdAt' },
//                         day: { $dayOfMonth: '$createdAt' }
//                     },
//                     date: { $first: '$createdAt' },
//                     totalAmount: { $sum: '$amount' },
//                     transactionCount: { $sum: 1 },
//                     averageAmount: { $avg: '$amount' }
//                 }
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     date: {
//                         $dateFromParts: {
//                             year: '$_id.year',
//                             month: '$_id.month',
//                             day: '$_id.day'
//                         }
//                     },
//                     totalAmount: 1,
//                     transactionCount: 1,
//                     averageAmount: { $round: ['$averageAmount', 2] }
//                 }
//             },
//             { $sort: { date: 1 } }
//         ]);

//         // Calculate overall statistics
//         const overall = await Payment.aggregate([
//             { $match: query },
//             {
//                 $group: {
//                     _id: null,
//                     totalAmount: { $sum: '$amount' },
//                     totalTransactions: { $sum: 1 },
//                     averageDaily: {
//                         $avg: {
//                             $let: {
//                                 vars: {
//                                     daysDiff: {
//                                         $divide: [
//                                             { $subtract: [endDate, startDate] },
//                                             1000 * 60 * 60 * 24
//                                         ]
//                                     }
//                                 },
//                                 in: { $divide: ['$amount', '$$daysDiff'] }
//                             }
//                         }
//                     }
//                 }
//             }
//         ]);

//         return {
//             dailySummary,
//             overall: overall[0] || {
//                 totalAmount: 0,
//                 totalTransactions: 0,
//                 averageDaily: 0
//             },
//             period: {
//                 startDate,
//                 endDate,
//                 days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
//             }
//         };
//     }

//     // 4. Monthly Collection Summary
//     static async getMonthlyCollectionSummary(filters = {}) {
//         const {
//             session = this.getCurrentSession(),
//             year = new Date().getFullYear()
//         } = filters;

//         const startOfYear = new Date(year, 0, 1);
//         const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

//         const query = {
//             session,
//             status: 'completed',
//             createdAt: {
//                 $gte: startOfYear,
//                 $lte: endOfYear
//             }
//         };

//         const monthlySummary = await Payment.aggregate([
//             { $match: query },
//             {
//                 $group: {
//                     _id: { month: { $month: '$createdAt' } },
//                     month: { $first: { $month: '$createdAt' } },
//                     totalAmount: { $sum: '$amount' },
//                     transactionCount: { $sum: 1 },
//                     averageAmount: { $avg: '$amount' }
//                 }
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     month: 1,
//                     monthName: {
//                         $let: {
//                             vars: {
//                                 months: [
//                                     'January', 'February', 'March', 'April', 'May', 'June',
//                                     'July', 'August', 'September', 'October', 'November', 'December'
//                                 ]
//                             },
//                             in: {
//                                 $arrayElemAt: ['$$months', { $subtract: ['$month', 1] }]
//                             }
//                         }
//                     },
//                     totalAmount: 1,
//                     transactionCount: 1,
//                     averageAmount: { $round: ['$averageAmount', 2] }
//                 }
//             },
//             { $sort: { month: 1 } }
//         ]);

//         // Fill in missing months with zero values
//         const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
//         const monthsMap = monthlySummary.reduce((map, item) => {
//             map[item.month] = item;
//             return map;
//         }, {});

//         const completeMonthlySummary = allMonths.map(month => {
//             if (monthsMap[month]) {
//                 return monthsMap[month];
//             }
//             return {
//                 month,
//                 monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
//                 totalAmount: 0,
//                 transactionCount: 0,
//                 averageAmount: 0
//             };
//         });

//         const yearlyTotal = await Payment.aggregate([
//             { $match: query },
//             {
//                 $group: {
//                     _id: null,
//                     totalAmount: { $sum: '$amount' },
//                     totalTransactions: { $sum: 1 }
//                 }
//             }
//         ]);

//         return {
//             monthlySummary: completeMonthlySummary,
//             yearlyTotal: yearlyTotal[0] || {
//                 totalAmount: 0,
//                 totalTransactions: 0
//             },
//             year
//         };
//     }

//     // 5. Collection by Method
//     static async getCollectionByMethod(filters = {}) {
//         const {
//             session = this.getCurrentSession(),
//             startDate = null,
//             endDate = null
//         } = filters;

//         const query = {
//             session,
//             status: 'completed'
//         };

//         if (startDate || endDate) {
//             query.createdAt = {};
//             if (startDate) query.createdAt.$gte = new Date(startDate);
//             if (endDate) query.createdAt.$lte = new Date(endDate);
//         }

//         const methodSummary = await Payment.aggregate([
//             { $match: query },
//             {
//                 $group: {
//                     _id: '$method',
//                     method: { $first: '$method' },
//                     totalAmount: { $sum: '$amount' },
//                     transactionCount: { $sum: 1 },
//                     averageAmount: { $avg: '$amount' }
//                 }
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     method: 1,
//                     totalAmount: 1,
//                     transactionCount: 1,
//                     averageAmount: { $round: ['$averageAmount', 2] }
//                 }
//             },
//             { $sort: { totalAmount: -1 } }
//         ]);

//         // Calculate percentages
//         const totalAmount = methodSummary.reduce((sum, item) => sum + item.totalAmount, 0);

//         const methodSummaryWithPercentage = methodSummary.map(item => ({
//             ...item,
//             percentage: totalAmount > 0 ? (item.totalAmount / totalAmount) * 100 : 0
//         }));

//         return {
//             byMethod: methodSummaryWithPercentage,
//             totalAmount,
//             totalTransactions: methodSummary.reduce((sum, item) => sum + item.transactionCount, 0),
//             period: {
//                 startDate,
//                 endDate
//             }
//         };
//     }

//     // 6. Top Contributing Students
//     static async getTopContributingStudents(filters = {}) {
//         const {
//             session = this.getCurrentSession(),
//             startDate = null,
//             endDate = null,
//             limit = 10
//         } = filters;

//         const query = {
//             session,
//             status: 'completed'
//         };

//         if (startDate || endDate) {
//             query.createdAt = {};
//             if (startDate) query.createdAt.$gte = new Date(startDate);
//             if (endDate) query.createdAt.$lte = new Date(endDate);
//         }

//         const topStudents = await Payment.aggregate([
//             { $match: query },
//             {
//                 $group: {
//                     _id: '$student',
//                     totalAmount: { $sum: '$amount' },
//                     paymentCount: { $sum: 1 },
//                     averagePayment: { $avg: '$amount' },
//                     lastPayment: { $max: '$createdAt' }
//                 }
//             },
//             { $sort: { totalAmount: -1 } },
//             { $limit: limit },
//             {
//                 $lookup: {
//                     from: 'students',
//                     localField: '_id',
//                     foreignField: '_id',
//                     as: 'studentInfo'
//                 }
//             },
//             { $unwind: '$studentInfo' },
//             {
//                 $lookup: {
//                     from: 'classes',
//                     localField: 'studentInfo.class',
//                     foreignField: '_id',
//                     as: 'classInfo'
//                 }
//             },
//             { $unwind: { path: '$classInfo', preserveNullAndEmptyArrays: true } },
//             {
//                 $project: {
//                     _id: 0,
//                     studentId: '$_id',
//                     studentName: '$studentInfo.name',
//                     rollNumber: '$studentInfo.rollNumber',
//                     className: '$classInfo.name',
//                     totalAmount: 1,
//                     paymentCount: 1,
//                     averagePayment: { $round: ['$averagePayment', 2] },
//                     lastPayment: 1
//                 }
//             }
//         ]);

//         return {
//             topStudents,
//             limit,
//             period: {
//                 startDate,
//                 endDate
//             }
//         };
//     }

//     // 7. Export to CSV/Excel (Helper method)
//     static async exportCollectionReport(filters = {}, format = 'csv') {
//         const report = await this.getPaymentCollectionReport(filters);

//         // Convert to CSV format
//         if (format === 'csv') {
//             const headers = ['Date', 'Receipt No', 'Student', 'Class', 'Amount', 'Method', 'Received By'];
//             const rows = report.payments.map(payment => [
//                 new Date(payment.createdAt).toISOString().split('T')[0],
//                 payment.receiptNumber || payment._id,
//                 payment.student?.name || 'N/A',
//                 payment.student?.class || 'N/A',
//                 payment.amount,
//                 payment.method,
//                 payment.receivedBy?.name || 'N/A'
//             ]);

//             return { headers, rows };
//         }

//         // For other formats, you can add more converters
//         return report;
//     };

//     // ... [Keep all existing methods from previous code]

//     // NEW METHOD: Get class-wise collection for frontend
//     static async getClassWiseCollection(filters = {}) {
//         const {
//             session = this.getCurrentSession(),
//             startDate = null,
//             endDate = null
//         } = filters;

//         const query = {
//             session,
//             status: 'completed'
//         };

//         if (startDate || endDate) {
//             query.createdAt = {};
//             if (startDate) {
//                 query.createdAt.$gte = new Date(startDate);
//             }
//             if (endDate) {
//                 query.createdAt.$lte = new Date(endDate);
//             }
//         }

//         const classWiseData = await Payment.aggregate([
//             { $match: query },
//             {
//                 $lookup: {
//                     from: 'students',
//                     localField: 'student',
//                     foreignField: '_id',
//                     as: 'studentInfo'
//                 }
//             },
//             { $unwind: '$studentInfo' },
//             {
//                 $lookup: {
//                     from: 'classes',
//                     localField: 'studentInfo.class',
//                     foreignField: '_id',
//                     as: 'classInfo'
//                 }
//             },
//             { $unwind: { path: '$classInfo', preserveNullAndEmptyArrays: true } },
//             {
//                 $group: {
//                     _id: '$classInfo._id',
//                     className: { $first: '$classInfo.name' },
//                     totalAmount: { $sum: '$amount' },
//                     studentCount: { $addToSet: '$student' },
//                     paymentCount: { $sum: 1 }
//                 }
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     classId: '$_id',
//                     className: 1,
//                     totalAmount: 1,
//                     studentCount: { $size: '$studentCount' },
//                     paymentCount: 1,
//                     averagePerStudent: {
//                         $cond: [
//                             { $gt: [{ $size: '$studentCount' }, 0] },
//                             { $divide: ['$totalAmount', { $size: '$studentCount' }] },
//                             0
//                         ]
//                     }
//                 }
//             },
//             { $sort: { totalAmount: -1 } }
//         ]);

//         return classWiseData;
//     }

//     // NEW METHOD: Get daily collection data formatted for frontend chart
//     static async getDailyCollectionForChart(filters = {}) {
//         const dailySummary = await this.getDailyCollectionSummary(filters);

//         return dailySummary.dailySummary.map(day => ({
//             date: day.date,
//             amount: day.totalAmount,
//             transactions: day.transactionCount,
//             average: day.averageAmount
//         }));
//     }

//     // NEW METHOD: Get payment method data formatted for frontend
//     static async getPaymentMethodData(filters = {}) {
//         const methodData = await this.getCollectionByMethod(filters);

//         return methodData.byMethod.map(method => ({
//             method: method.method,
//             amount: method.totalAmount,
//             count: method.transactionCount,
//             percentage: method.percentage
//         }));
//     }

//     // NEW METHOD: Get top students formatted for frontend
//     static async getTopStudentsFormatted(filters = {}) {
//         const topStudents = await this.getTopContributingStudents(filters);

//         return topStudents.topStudents.map((student, index) => ({
//             name: student.studentName,
//             class: student.className || 'N/A',
//             amount: student.totalAmount,
//             payments: student.paymentCount,
//             averagePayment: student.averagePayment
//         }));
//     }

//     // NEW METHOD: Get collection statistics for summary cards
//     static async getCollectionStatistics(filters = {}) {
//         const {
//             session = this.getCurrentSession(),
//             startDate = null,
//             endDate = null
//         } = filters;

//         const query = {
//             session,
//             status: 'completed'
//         };

//         if (startDate || endDate) {
//             query.createdAt = {};
//             if (startDate) query.createdAt.$gte = new Date(startDate);
//             if (endDate) query.createdAt.$lte = new Date(endDate);
//         }

//         // Get today's date for comparison
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const yesterday = new Date(today);
//         yesterday.setDate(yesterday.getDate() - 1);

//         const todayQuery = { ...query, createdAt: { $gte: today } };
//         const yesterdayQuery = {
//             ...query,
//             createdAt: {
//                 $gte: yesterday,
//                 $lt: today
//             }
//         };

//         const [todayStats, yesterdayStats, overallStats] = await Promise.all([
//             Payment.aggregate([
//                 { $match: todayQuery },
//                 {
//                     $group: {
//                         _id: null,
//                         totalAmount: { $sum: '$amount' },
//                         count: { $sum: 1 }
//                     }
//                 }
//             ]),
//             Payment.aggregate([
//                 { $match: yesterdayQuery },
//                 {
//                     $group: {
//                         _id: null,
//                         totalAmount: { $sum: '$amount' },
//                         count: { $sum: 1 }
//                     }
//                 }
//             ]),
//             Payment.aggregate([
//                 { $match: query },
//                 {
//                     $group: {
//                         _id: null,
//                         totalAmount: { $sum: '$amount' },
//                         count: { $sum: 1 },
//                         average: { $avg: '$amount' }
//                     }
//                 }
//             ])
//         ]);

//         const todayData = todayStats[0] || { totalAmount: 0, count: 0 };
//         const yesterdayData = yesterdayStats[0] || { totalAmount: 0, count: 0 };
//         const overallData = overallStats[0] || { totalAmount: 0, count: 0, average: 0 };

//         // Calculate percentage change
//         const amountChange = yesterdayData.totalAmount > 0
//             ? ((todayData.totalAmount - yesterdayData.totalAmount) / yesterdayData.totalAmount) * 100
//             : 0;

//         return {
//             todayCollection: todayData.totalAmount,
//             todayTransactions: todayData.count,
//             totalCollection: overallData.totalAmount,
//             totalTransactions: overallData.count,
//             averageTransaction: overallData.average || 0,
//             amountChange: parseFloat(amountChange.toFixed(2))
//         };
//     }

// }

// module.exports = ReportService;