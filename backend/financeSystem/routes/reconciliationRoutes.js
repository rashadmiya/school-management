// routes/reconciliationRoutes.js
const express = require('express');
const router = express.Router();
const ReconciliationService = require('../services/ReconciliationService');
const { isAuthenticated, authorizeRoles } = require('../../middleware/auth');
const catchAsyncErrors = require('../../middleware/catchAsyncErrors');
const { getCurrentSession } = require('../../utils/accademicSession');

router.get('/daily', isAuthenticated, authorizeRoles('admin', 'accountant', 'auditor'), catchAsyncErrors(async (req, res) => {
    const session = req.query.session || getCurrentSession();
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const result = await ReconciliationService.getDailyReconciliation({ date, session });
    res.json({ success: true, data: result });
}));

router.get('/range', isAuthenticated, authorizeRoles('admin', 'accountant', 'auditor'), catchAsyncErrors(async (req, res) => {
    const session = req.query.session || getCurrentSession();
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'startDate and endDate required' });
    }
    const result = await ReconciliationService.getRangeReconciliation({ startDate, endDate, session });
    res.json({ success: true, data: result });
}));

router.get('/aging', isAuthenticated,
    authorizeRoles('admin', 'accountant', 'auditor'),
    catchAsyncErrors(async (req, res) => {
        const session = req.query.session || getCurrentSession();
        const { classId, asOfDate } = req.query;

        const result = await ReconciliationService.getAgingReport({
            session,
            classId,
            asOfDate: asOfDate ? new Date(asOfDate) : new Date(),
        });
        res.json({ success: true, data: result });
    }));

module.exports = router;