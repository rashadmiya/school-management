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
    // financeSystem/services/ReportService.js — add this method

    static async getDashboardData(session) {
        const Payment = require('../financeSystem/models/Payment');
        const Refund = require('../financeSystem/models/Refund');
        const FeeWaiver = require('../financeSystem/models/FeeWaiver');
        const FeeInstance = require('../financeSystem/models/FeeInstance');
        const StudentFinanceSummary = require('../financeSystem/models/StudentFinanceSummary');
        const Student = require('../models/Student');
        const { getCurrentSession } = require('../utils/accademicSession');
        const { toDecimal, toString, sum, sub } = require('../utils/decimal');

        const sess = session || getCurrentSession();

        const now = new Date();
        const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        // KPIs — parallel queries
        const [
            totalStudents,
            activeStudents,
            paymentAgg,
            todayPayments,
            monthPayments,
            yearPayments,
            refundAgg,
            waiverAgg,
            advanceAgg,
            classWise,
            recentPayments,
            recentRefunds,
            recentWaivers,
            overdueCount,
            agingAgg,
            topDebtors,
        ] = await Promise.all([
            Student.countDocuments({ session: sess }),
            Student.countDocuments({ session: sess /* + isActive if applicable */ }),
            Payment.aggregate([
                { $match: { session: sess, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
            ]),
            Payment.aggregate([
                { $match: { session: sess, status: 'completed', createdAt: { $gte: startOfToday } } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Payment.aggregate([
                { $match: { session: sess, status: 'completed', createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Payment.aggregate([
                { $match: { session: sess, status: 'completed', createdAt: { $gte: startOfYear } } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Refund.aggregate([
                { $match: { session: sess, status: 'processed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            FeeWaiver.aggregate([
                { $match: { status: 'approved' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            StudentFinanceSummary.aggregate([
                { $match: { session: sess } },
                { $group: { _id: null, total: { $sum: '$advanceBalance' } } },
            ]),
            FeeInstance.aggregate([
                { $match: { session: sess, isActive: true } },
                {
                    $lookup: {
                        from: 'classes',
                        localField: 'class',
                        foreignField: '_id',
                        as: 'classInfo',
                    },
                },
                { $unwind: { path: '$classInfo', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: '$classInfo._id',
                        className: { $first: '$classInfo.name' },
                        totalFee: { $sum: '$totalAmount' },
                        totalPaid: { $sum: '$paidAmount' },
                        totalDue: { $sum: '$dueAmount' },
                    },
                },
                { $sort: { totalDue: -1 } },
                { $limit: 10 },
            ]),
            Payment.find({ session: sess, status: 'completed' })
                .sort({ createdAt: -1 })
                .limit(8)
                .populate({ path: 'student', select: 'name rollNumber class', populate: { path: 'class', select: 'name section' } })
                .populate('receivedBy', 'name')
                .lean(),
            Refund.find({ session: sess, status: 'processed' })
                .sort({ processedAt: -1 })
                .limit(5)
                .populate('student', 'name rollNumber')
                .lean(),
            FeeWaiver.find({ status: 'approved' })
                .sort({ approvedDate: -1 })
                .limit(5)
                .populate('student', 'name rollNumber')
                .lean(),
            FeeInstance.countDocuments({
                session: sess,
                isActive: true,
                status: { $in: ['unpaid', 'partial', 'overdue'] },
                dueDate: { $lt: now },
            }),
            // Aging buckets via aggregation
            FeeInstance.aggregate([
                {
                    $match: {
                        session: sess,
                        isActive: true,
                        status: { $in: ['unpaid', 'partial', 'overdue'] },
                        dueAmount: { $gt: 0 },
                    },
                },
                {
                    $bucket: {
                        groupBy: {
                            $divide: [{ $subtract: [now, '$dueDate'] }, 1000 * 60 * 60 * 24],
                        },
                        boundaries: [-10000, 0, 31, 61, 91, 10000],
                        default: '90+',
                        output: { total: { $sum: '$dueAmount' } },
                    },
                },
            ]),
            FeeInstance.aggregate([
                {
                    $match: {
                        session: sess,
                        isActive: true,
                        status: { $in: ['unpaid', 'partial', 'overdue'] },
                        dueAmount: { $gt: 0 },
                    },
                },
                {
                    $group: {
                        _id: '$student',
                        total: { $sum: '$dueAmount' },
                    },
                },
                { $sort: { total: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'students',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'student',
                    },
                },
                { $unwind: '$student' },
            ]),
        ]);

        const totalCollection = toDecimal(paymentAgg[0]?.total || 0);
        // const totalFeesGenerated = toDecimal(
        //     (await FeeInstance.aggregate([
        //         { $match: { session: sess, isActive: true } },
        //         { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        //     ]))[0]?.total || 0
        // );
        const totalFeesGeneratedStr = toString(
            (await FeeInstance.aggregate([
                { $match: { session: sess, isActive: true } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]))[0]?.total || 0
        );
        const totalFeesGenerated = toDecimal(totalFeesGeneratedStr);

        const collectionRate = totalFeesGenerated.gt(0)
            ? totalCollection.dividedBy(totalFeesGenerated).times(100).toNumber()
            : 0;

        // const outstanding = toDecimal(
        //     (await FeeInstance.aggregate([
        //         { $match: { session: sess, isActive: true } },
        //         { $group: { _id: null, total: { $sum: '$dueAmount' } } },
        //     ]))[0]?.total || 0
        // );

        const outstandingStr = toString(
            (await FeeInstance.aggregate([
                { $match: { session: sess, isActive: true } },
                { $group: { _id: null, total: { $sum: '$dueAmount' } } },
            ]))[0]?.total || 0
        );
        const outstanding = toDecimal(outstandingStr);


        // Build aging buckets
        const aging = { '0-30': '0.00', '31-60': '0.00', '61-90': '0.00', '90+': '0.00' };
        for (const bucket of agingAgg) {
            if (bucket._id === -10000 || bucket._id === 0) aging['0-30'] = toString(bucket.total);
            else if (bucket._id === 31) aging['31-60'] = toString(bucket.total);
            else if (bucket._id === 61) aging['61-90'] = toString(bucket.total);
            else if (bucket._id === 91 || bucket._id === '90+') aging['90+'] = toString(bucket.total);
        }

        return {
            session: sess,
            generatedAt: now.toISOString(),
            kpis: {
                totalStudents,
                activeStudents,
                totalCollection: toString(totalCollection),
                outstandingAmount: toString(outstanding),
                collectionRate: Math.round(collectionRate * 10) / 10,
                todayCollection: toString(todayPayments[0]?.total || 0),
                monthCollection: toString(monthPayments[0]?.total || 0),
                yearCollection: toString(yearPayments[0]?.total || 0),
                advanceBalanceTotal: toString(advanceAgg[0]?.total || 0),
                refundedTotal: toString(refundAgg[0]?.total || 0),
                waivedTotal: toString(waiverAgg[0]?.total || 0),
                overdueCount,
                totalTransactions: paymentAgg[0]?.count || 0,
            },
            alerts: await this._buildAlerts(sess, overdueCount),
            recentPayments: recentPayments.map(p => ({
                _id: p._id,
                receiptNumber: p.receiptNumber,
                student: {
                    _id: p.student?._id,
                    name: p.student?.name,
                    rollNumber: p.student?.rollNumber,
                    class: p.student?.class?.name,
                    section: p.student?.class?.section,
                },
                amount: toString(p.amount),
                method: p.method,
                receivedBy: p.receivedBy?.name,
                createdAt: p.createdAt,
            })),
            recentRefunds: recentRefunds.map(r => ({
                _id: r._id, refundNumber: r.refundNumber, student: r.student?.name,
                amount: toString(r.amount), processedAt: r.processedAt,
            })),
            recentWaivers: recentWaivers.map(w => ({
                _id: w._id, student: w.student?.name,
                amount: toString(w.amount), approvedDate: w.approvedDate,
            })),
            aging,
            topDebtors: topDebtors.map(d => ({
                studentId: d._id,
                name: d.student?.name,
                rollNumber: d.student?.rollNumber,
                total: toString(d.total),
            })),
            // classWise: classWise.map(c => ({
            //     classId: c._id,
            //     className: c.className || 'Unassigned',
            //     totalFee: toString(c.totalFee),
            //     totalPaid: toString(c.totalPaid),
            //     totalDue: toString(c.totalDue),
            //     collectionRate: c.totalFee > 0
            //         ? Math.round((toDecimal(c.totalPaid).dividedBy(c.totalFee).times(100)).toNumber() * 10) / 10
            //         : 0,
            // })),
            classWise: classWise.map(c => {
                // Mongo's $sum over Decimal128 returns Decimal128 objects.
                // Coerce to string BEFORE handing to toDecimal or Number.
                const feeStr = toString(c.totalFee);
                const paidStr = toString(c.totalPaid);
                const dueStr = toString(c.totalDue);

                const feeNum = Number(feeStr);
                const paidNum = Number(paidStr);

                const rate =
                    feeNum > 0
                        ? Math.round((paidNum / feeNum) * 1000) / 10
                        : 0;

                return {
                    classId: c._id,
                    className: c.className || 'Unassigned',
                    totalFee: feeStr,
                    totalPaid: paidStr,
                    totalDue: dueStr,
                    collectionRate: rate,
                };
            }),
        };
    }

    static async _buildAlerts(session, overdueCount) {
        const alerts = [];
        if (overdueCount > 0) {
            alerts.push({
                type: 'error',
                title: `${overdueCount} overdue fees`,
                message: `${overdueCount} fee instances are past their due date and unpaid.`,
            });
        }
        // Add more if needed:
        // - low collection class
        // - high advance balance
        // - pending waivers
        return alerts;
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