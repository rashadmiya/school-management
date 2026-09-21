// routes/refundRoutes.js
const express = require('express');
const router = express.Router();
const RefundController = require('../RefundController');
const { isAuthenticated, authorizeRoles } = require('../../middleware/auth');
const catchAsyncErrors = require('../../middleware/catchAsyncErrors');

// 1. Request
router.post('/', isAuthenticated, authorizeRoles('admin', 'accountant'),
    catchAsyncErrors(RefundController.request));

// 2. Approve
router.post('/:id/approve', isAuthenticated, authorizeRoles('admin'),
    catchAsyncErrors(RefundController.approve));

// 3. Reject
router.post('/:id/reject', isAuthenticated, authorizeRoles('admin'),
    catchAsyncErrors(RefundController.reject));

// 4. Process (money out)
router.post('/:id/process', isAuthenticated, authorizeRoles('admin', 'accountant'),
    catchAsyncErrors(RefundController.process));

// List / history
router.get('/', isAuthenticated, authorizeRoles('admin', 'accountant', 'auditor'),
    catchAsyncErrors(RefundController.list));

router.get('/student/:studentId', isAuthenticated,
    catchAsyncErrors(RefundController.history));

module.exports = router;

// // routes/refundRoutes.js
// const express = require('express');
// const router = express.Router();
// const RefundController = require('../RefundController');
// const { body, param, query } = require('express-validator');
// const { isAuthenticated, authorizeRoles, isStudentAuthenticated } = require('../../middleware/auth');


// // Process Refund
// router.post('/',
//     isAuthenticated,
//     authorizeRoles('admin', 'accountant'),
//     [
//         body('paymentId').isMongoId(),
//         body('amount').isFloat({ min: 1 }),
//         body('reason').notEmpty().trim()
//     ],
//     RefundController.processRefund
// );

// // Refund History
// router.get('/student/:studentId',
//     isStudentAuthenticated,
//     param('studentId').isMongoId(),
//     RefundController.getRefundHistory
// );

// // Validate Refund
// router.get('/validate/:paymentId',
//     isAuthenticated,
//     authorizeRoles('admin', 'accountant'),
//     param('paymentId').isMongoId(),
//     query('amount').isFloat({ min: 1 }),
//     RefundController.validateRefund
// );

// router.post('/refunds',
//     isAuthenticated,
//     authorizeFinance(['admin', 'accountant']),
//     catchAsyncErrors(RefundController.processRefund)
// );

// module.exports = router;