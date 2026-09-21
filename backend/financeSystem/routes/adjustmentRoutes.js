// routes/adjustmentRoutes.js
const express = require('express');
const router = express.Router();
const AdjustmentController = require('../AdjustmentController');
const { isAuthenticated, authorizeRoles } = require('../../middleware/auth');
const catchAsyncErrors = require('../../middleware/catchAsyncErrors');

router.post('/', isAuthenticated, authorizeRoles('admin', 'accountant'),
    catchAsyncErrors(AdjustmentController.request));

router.post('/:id/approve', isAuthenticated, authorizeRoles('admin'),
    catchAsyncErrors(AdjustmentController.approve));

router.post('/:id/reject', isAuthenticated, authorizeRoles('admin'),
    catchAsyncErrors(AdjustmentController.reject));

router.post('/:id/apply', isAuthenticated, authorizeRoles('admin', 'accountant'),
    catchAsyncErrors(AdjustmentController.apply));

router.get('/', isAuthenticated, authorizeRoles('admin', 'accountant', 'auditor'),
    catchAsyncErrors(AdjustmentController.list));

module.exports = router;