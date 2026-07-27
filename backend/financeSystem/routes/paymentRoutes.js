// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const PaymentController = require('../PaymentController');
const { body, param, query } = require('express-validator');

const { isAuthenticated, authorizeRoles, isStudentAuthenticated } = require('../../middleware/auth');

// Receive Payment
router.post('/',
    isAuthenticated,
    [
        body('studentId').isMongoId(),
        body('amount').isFloat({ min: 1 }),
        body('method').isIn(['cash', 'bank_transfer', 'check', 'mobile_banking', 'card', 'online']),
        body('session').optional().isString()
    ],
    PaymentController.receivePayment
);

// Payment History
router.get('/student/:studentId',
    // isStudentAuthenticated,
    isAuthenticated,
    param('studentId').isMongoId(),
    PaymentController.getPaymentHistory
);

// ADD THIS NEW ROUTE
router.get('/search',
    isAuthenticated,
    PaymentController.searchPayments
);

// Payment Allocations
router.get('/:id/allocations',
    isAuthenticated,
    param('id').isMongoId(),
    PaymentController.getPaymentAllocations
);

// Advance Balance
router.get('/student/:studentId/advance',
    // isStudentAuthenticated,
    param('studentId').isMongoId(),
    PaymentController.getAdvanceBalance
);

router.post('/use-advance',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    [
        body('studentId').isMongoId(),
        body('feeInstanceId').isMongoId(),
        body('amount').isFloat({ min: 1 })
    ],
    PaymentController.useAdvanceBalance
);

router.post('/auto-apply-advance',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    [
        body('studentId').isMongoId()
    ],
    PaymentController.autoApplyAdvance
);

module.exports = router;