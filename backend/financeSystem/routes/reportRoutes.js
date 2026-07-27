// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const ReportController = require('../ReportController');
const { query } = require('express-validator');
const { isAuthenticated, authorizeRoles } = require('../../middleware/auth');


router.get('/collection/payments',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    [
        query('session').optional().isString(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('method').optional().isIn(['cash', 'bank_transfer', 'check', 'mobile_banking', 'card', 'online']),
        query('classId').optional().isMongoId(),
        query('limit').optional().isInt({ min: 1, max: 1000 }),
        query('page').optional().isInt({ min: 1 })
    ],
    ReportController.getPaymentCollectionReport
);

router.get('/collection/fees',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    [
        query('session').optional().isString(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('classId').optional().isMongoId()
    ],
    ReportController.getFeeCollectionReport
);

router.get('/dashboard/finance',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    [
        query('session').optional().isString(),
    ],
    ReportController.getFinanceDashboard
);

// // Additional endpoints that might be needed
// router.get('/collection/daily',
//     isAuthenticated,
//     authorizeRoles('admin', 'accountant'),
//     ReportController.getDailyCollectionData
// );

// router.get('/collection/monthly',
//     isAuthenticated,
//     authorizeRoles('admin', 'accountant'),
//     ReportController.getMonthlyCollectionData
// );

// Payment Collection Report
// router.get('/collection/payments',
//     isAuthenticated,
//     authorizeRoles('admin', 'accountant'),
//     [
//         query('session').optional().isString(),
//         query('startDate').optional().isISO8601(),
//         query('endDate').optional().isISO8601(),
//         query('method').optional().isIn(['cash', 'bank_transfer', 'check', 'mobile_banking', 'card', 'online']),
//         query('classId').optional().isMongoId(),
//         query('limit').optional().isInt({ min: 1, max: 1000 }),
//         query('page').optional().isInt({ min: 1 })
//     ],
//     ReportController.getPaymentCollectionReport
// );

// // Fee Collection Report
// router.get('/collection/fees',
//     isAuthenticated,
//     authorizeRoles('admin', 'accountant'),
//     [
//         query('session').optional().isString(),
//         query('startDate').optional().isISO8601(),
//         query('endDate').optional().isISO8601(),
//         query('classId').optional().isMongoId()
//     ],
//     ReportController.getFeeCollectionReport
// );

// // Daily Collection Summary
// router.get('/collection/daily-summary',
//     isAuthenticated,
//     authorizeRoles('admin', 'accountant'),
//     [
//         query('startDate').optional().isISO8601(),
//         query('endDate').optional().isISO8601(),
//         query('session').optional().isString()
//     ],
//     ReportController.getDailyCollectionSummary
// );

// // Monthly Collection Summary
// router.get('/collection/monthly-summary',
//     isAuthenticated,
//     authorizeRoles('admin', 'accountant'),
//     [
//         query('year').optional().isInt({ min: 2000, max: 2100 }),
//         query('session').optional().isString()
//     ],
//     ReportController.getMonthlyCollectionSummary
// );

// // Collection by Method
// router.get('/collection/by-method',
//     isAuthenticated,
//     authorizeRoles('admin', 'accountant'),
//     [
//         query('startDate').optional().isISO8601(),
//         query('endDate').optional().isISO8601(),
//         query('session').optional().isString()
//     ],
//     ReportController.getCollectionByMethod
// );

// // Top Contributing Students
// router.get('/collection/top-students',
//     isAuthenticated,
//     authorizeRoles('admin', 'accountant'),
//     [
//         query('startDate').optional().isISO8601(),
//         query('endDate').optional().isISO8601(),
//         query('session').optional().isString(),
//         query('limit').optional().isInt({ min: 1, max: 50 })
//     ],
//     ReportController.getTopContributingStudents
// );

module.exports = router;