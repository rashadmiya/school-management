// routes/billRoutes.js
const express = require('express');
const router = express.Router();
const BillController = require('../BillController');
const { isAuthenticated } = require('../../middleware/auth');
const catchAsyncErrors = require('../../middleware/catchAsyncErrors');

router.get('/student/:studentId/monthly', isAuthenticated,
    catchAsyncErrors(BillController.getMonthlyBills));

router.get('/student/:studentId/current', isAuthenticated,
    catchAsyncErrors(BillController.getCurrentBill));

router.get('/student/:studentId/statement', isAuthenticated,
    catchAsyncErrors(BillController.getStudentStatement));

module.exports = router;