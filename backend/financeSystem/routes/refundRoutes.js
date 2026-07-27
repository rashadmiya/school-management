// routes/refundRoutes.js
const express = require('express');
const router = express.Router();
const RefundController = require('../RefundController');
const { body, param, query } = require('express-validator');
const { isAuthenticated, authorizeRoles, isStudentAuthenticated } = require('../../middleware/auth');


// Process Refund
router.post('/',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    [
        body('paymentId').isMongoId(),
        body('amount').isFloat({ min: 1 }),
        body('reason').notEmpty().trim()
    ],
    RefundController.processRefund
);

// Refund History
router.get('/student/:studentId',
    isStudentAuthenticated,
    param('studentId').isMongoId(),
    RefundController.getRefundHistory
);

// Validate Refund
router.get('/validate/:paymentId',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    param('paymentId').isMongoId(),
    query('amount').isFloat({ min: 1 }),
    RefundController.validateRefund
);

module.exports = router;