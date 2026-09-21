// routes/paymentIntentRoutes.js
const express = require('express');
const router = express.Router();
const PaymentIntentController = require('../PaymentIntentController');
const { isAuthenticated, authorizeRoles } = require('../../middleware/auth');
const catchAsyncErrors = require('../../middleware/catchAsyncErrors');

router.post('/', isAuthenticated, authorizeRoles('admin', 'accountant', 'cashier'),
    catchAsyncErrors(PaymentIntentController.create));

router.get('/', isAuthenticated, authorizeRoles('admin', 'accountant', 'auditor'),
    catchAsyncErrors(PaymentIntentController.list));

router.get('/:id', isAuthenticated, catchAsyncErrors(PaymentIntentController.get));

router.post('/:id/confirm', isAuthenticated, authorizeRoles('admin', 'accountant', 'cashier'),
    catchAsyncErrors(PaymentIntentController.confirm));

router.post('/:id/cancel', isAuthenticated, authorizeRoles('admin', 'accountant', 'cashier'),
    catchAsyncErrors(PaymentIntentController.cancel));

router.post('/webhook/:gateway',
    express.raw({ type: '*/*' }),
    catchAsyncErrors(PaymentIntentController.webhook)
);

router.get('/:id/return', catchAsyncErrors(PaymentIntentController.returnPage));

module.exports = router;