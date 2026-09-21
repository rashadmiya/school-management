// routes/auditRoutes.js
const express = require('express');
const router = express.Router();
const AuditService = require('../services/AuditService');
const { isAuthenticated, authorizeRoles } = require('../../middleware/auth');
const catchAsyncErrors = require('../../middleware/catchAsyncErrors');

router.get('/', isAuthenticated, authorizeRoles('admin', 'auditor'), catchAsyncErrors(async (req, res) => {
    const { studentId, actor, action, refId, refModel, startDate, endDate, limit = 100 } = req.query;
    const logs = await AuditService.list({
        studentId, actor, action, refId, refModel, startDate, endDate,
        limit: parseInt(limit, 10),
    });
    res.json({ success: true, data: logs });
}));

router.get('/ref/:refModel/:refId', isAuthenticated, authorizeRoles('admin', 'auditor'), catchAsyncErrors(async (req, res) => {
    const logs = await AuditService.getForRef(req.params.refModel, req.params.refId);
    res.json({ success: true, data: logs });
}));

module.exports = router;