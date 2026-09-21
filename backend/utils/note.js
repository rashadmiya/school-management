// routes/adjustmentRoutes.js (new file)
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
===================================================================================================
// routes/auditRoutes.js (new file)
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
=====================================================================================================
// routes/billRoutes.js (new file)
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
==================================================================================================

const express = require('express');
const router = express.Router();
const FeeController = require('../FeeController');
const { body, param } = require('express-validator');
const { isAuthenticated, authorizeRoles, isStudentAuthenticated } = require('../../middleware/auth');
const { isAnyAuthenticated } = require('../../middleware/anyAuth');

// Fee Templates
router.post('/templates',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    [
        body('title').notEmpty().trim(),
        body('amount').isFloat({ min: 0 }),
        body('appliesTo.scope').isIn(['all', 'class', 'section', 'individual']),
        body('session').optional().isString()
    ],
    FeeController.createTemplate
);

router.get('/templates',
    isAuthenticated,
    FeeController.getFeeTemplates
);

router.post('/templates/:id/apply',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    param('id').isMongoId(),
    FeeController.applyFee
);

// Student Fees
router.get('/student/:studentId',
    isAnyAuthenticated,
    param('studentId').isMongoId(),
    FeeController.getStudentFees
);

router.get('/student/:studentId/summary',
    isAnyAuthenticated,
    param('studentId').isMongoId(),
    FeeController.getFeeSummary
);

// Fee Instances
router.put('/instances/:id',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    param('id').isMongoId(),
    FeeController.updateFeeInstance
);

// Add to routes:
// Add these routes before module.exports
router.get('/templates/:id/eligible-students',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    param('id').isMongoId(),
    FeeController.getEligibleStudents
);

router.get('/current-session',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    FeeController.getCurrentSession
);

router.post('/set-session',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    [
        body('session').matches(/^\d{4}-\d{4}$/).withMessage('Invalid session format')
    ],
    FeeController.setCurrentSession
);

module.exports = router;
=====================================================================================================
// routes/ledgerRoutes.js
const express = require('express');
const router = express.Router();
const LedgerController = require('../LedgerController');
const { param } = require('express-validator');
const { isAnyAuthenticated } = require('../../middleware/anyAuth');

// Student Ledger
router.get('/:studentId',
    isAnyAuthenticated,
    param('studentId').isMongoId(),
    LedgerController.getStudentLedger
);

router.get('/:studentId/validate',
    isAnyAuthenticated,
    param('studentId').isMongoId(),
    LedgerController.validateLedger
);

router.get('/:studentId/balance',
    isAnyAuthenticated,
    param('studentId').isMongoId(),
    LedgerController.getCurrentBalance
);

module.exports = router;
=================================================================================================
// routes/notificationRoutes.js (new file)
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const { isAuthenticated } = require('../../middleware/auth');
const catchAsyncErrors = require('../../middleware/catchAsyncErrors');

// Get my preferences
router.get('/preferences', isAuthenticated, catchAsyncErrors(async (req, res) => {
    const pref = await NotificationPreference.findOneAndUpdate(
        { user: req.user._id },
        { $setOnInsert: { user: req.user._id } },
        { upsert: true, new: true }
    );
    res.json({ success: true, data: pref });
}));

// Update my preferences
router.put('/preferences', isAuthenticated, catchAsyncErrors(async (req, res) => {
    const pref = await NotificationPreference.findOneAndUpdate(
        { user: req.user._id },
        { $set: req.body },
        { upsert: true, new: true }
    );
    res.json({ success: true, data: pref });
}));

// In-app notifications
router.get('/', isAuthenticated, catchAsyncErrors(async (req, res) => {
    const { unreadOnly = false, limit = 30 } = req.query;
    const query = { user: req.user._id, channel: 'in_app' };
    if (unreadOnly === 'true') query.readAt = null;
    const list = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .lean();
    res.json({ success: true, data: list });
}));

router.post('/:id/read', isAuthenticated, catchAsyncErrors(async (req, res) => {
    await Notification.updateOne(
        { _id: req.params.id, user: req.user._id },
        { $set: { readAt: new Date() } }
    );
    res.json({ success: true });
}));

module.exports = router;
=================================================================================================
// routes/paymentIntentRoutes.js (new file)
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
// routes/paymentIntentRoutes.js — add
router.post('/webhook/:gateway',
    express.raw({ type: '*/*' }),
    catchAsyncErrors(PaymentIntentController.webhook)
);

router.get('/:id/return', catchAsyncErrors(PaymentIntentController.returnPage));
module.exports = router;
=================================================================================================
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

router.post('/payments',
    isAuthenticated,
    authorizeFinance(['admin', 'accountant', 'cashier']),
    catchAsyncErrors(PaymentController.receivePayment)
);

router.post('/payments/:id/void',
    isAuthenticated,
    authorizeFinance(['admin', 'accountant']),
    catchAsyncErrors(PaymentController.voidPayment)
);
module.exports = router;
=================================================================================================
// routes/pdfRoutes.js (new file)
const express = require('express');
const router = express.Router();
const ReceiptPdfService = require('../../services/pdf/ReceiptPdfService');
const StatementPdfService = require('../../services/pdf/StatementPdfService');
const { isAuthenticated } = require('../../middleware/auth');
const catchAsyncErrors = require('../../middleware/catchAsyncErrors');
const { getCurrentSession } = require('../../utils/academicSession');
const Payment = require('../../models/Payment');

router.get('/receipt/:paymentId', isAuthenticated, catchAsyncErrors(async (req, res) => {
    const { format = 'pdf' } = req.query;

    if (format === 'json') {
        const payment = await Payment.findById(req.params.paymentId).lean();
        return res.json({ success: true, data: payment });
    }

    const buf = await ReceiptPdfService.generate(req.params.paymentId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receipt.pdf"`);
    res.send(buf);
}));

router.get('/statement/:studentId', isAuthenticated, catchAsyncErrors(async (req, res) => {
    const session = req.query.session || getCurrentSession();
    const buf = await StatementPdfService.generate(req.params.studentId, session);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="statement-${req.params.studentId}.pdf"`);
    res.send(buf);
}));

module.exports = router;
==================================================================================================
// routes/reconciliationRoutes.js (new file)
const express = require('express');
const router = express.Router();
const ReconciliationService = require('../services/ReconciliationService');
const { isAuthenticated, authorizeRoles } = require('../..middleware/auth');
const catchAsyncErrors = require('../..middleware/catchAsyncErrors');
const { getCurrentSession } = require('../..utils/academicSession');

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

router.get('/aging', isAuthenticated, authorizeRoles('admin', 'accountant', 'auditor'), catchAsyncErrors(async (req, res) => {
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
==================================================================================================
// routes/refundRoutes.js (old but mostly modified)
const express = require('express');
const router = express.Router();
const RefundController = require('../RefundController');
const { isAuthenticated, authorizeRoles } = require('../../middleware/auth');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');

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
==================================================================================================
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
==================================================================================================
// routes/waiverRoutes.js
const express = require('express');
const router = express.Router();
const WaiverController = require('../WaiverController');
const { body, param, query } = require('express-validator');
const { isAuthenticated, authorizeRoles, isStudentAuthenticated } = require('../../middleware/auth');

// Waiver Requests
router.post('/request',
    isAuthenticated,
    [
        body('feeInstanceId').isMongoId(),
        body('type').isIn(['full', 'partial', 'scholarship', 'staff_discount', 'sibling_discount']),
        body('reason').notEmpty().trim(),
        body('amount').optional().isFloat({ min: 0 }),
        body('percentage').optional().isFloat({ min: 0, max: 100 })
    ],
    WaiverController.requestWaiver
);

router.get('/',
    isAuthenticated,
    WaiverController.getWaiverRequests
);

router.get('/eligible/:feeInstanceId',
    isAuthenticated,
    param('feeInstanceId').isMongoId(),
    WaiverController.getEligibleWaiver
);

// Waiver Approval/Rejection (Admin only)
router.post('/:id/approve',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    param('id').isMongoId(),
    WaiverController.approveWaiver
);

router.post('/:id/reject',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    param('id').isMongoId(),
    [
        body('reason').notEmpty().trim()
    ],
    WaiverController.rejectWaiver
);

router.post('/:id/revoke',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    param('id').isMongoId(),
    [
        body('reason').notEmpty().trim()
    ],
    WaiverController.revokeWaiver
);

module.exports = router;
================================================================================================

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");
const ErrorHandler = require("./utils/error")
const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

app.use(require('./middleware/requestContext'));

// Serve static uploads folder
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

// Serve static files (e.g., fonts)
app.use(express.static('public'));

// Test route
app.use("/test", (req, res) => {
  res.send("Hello from school420!");
});

// Import routes
const user = require("./controllers/user");
const assignmentRoutes = require("./controllers/assignmentRoutes");
const attendance = require("./controllers/attendance");
const classRoutes = require("./controllers/classRoutes");
const examRoutes = require("./controllers/examRoutes");
const gradeRoutes = require("./controllers/gradeRoutes");
const parentRoutes = require("./controllers/parentRoutes");
const resultRoutes = require("./controllers/resultRoutes");
const resultSheetRoutes = require("./controllers/resultSheetRoutes");
const routineRoutes = require("./controllers/routineRoutes");
const studentRoutes = require("./controllers/studentRoutes");
const subjectRoutes = require("./controllers/subjectRoutes");
const teacherRoutes = require("./controllers/teacherRoutes");
const roleRoutes = require("./controllers/roleRoutes");
const financeRoutes = require("./controllers/financeRoutes");
const adminRoutes = require("./controllers/adminRoutes");
const publicRoutes = require("./controllers/publicRoutes");
const announcementRoutes = require("./controllers/announcementRoutes");
const sectionRoutes = require("./controllers/sectionRoutes");
const examRoutineRoutes = require("./controllers/examRoutineRoutes");
// NEW: Directory routes
const stuffRoutes = require('./controllers/stuffRoutes');
const committeeRoutes = require('./controllers/committeeRoutes');
const cabinetRoutes = require('./controllers/cabinetRoutes');
const clubRoutes = require('./controllers/clubRoutes');
//finance routes
const feesRoutes = require('./financeSystem/routes/feeRoutes');
const ledgerRoutes = require('./financeSystem/routes/ledgerRoutes');
const paymentRoutes = require('./financeSystem/routes/paymentRoutes');
const refundRoutes = require('./financeSystem/routes/refundRoutes');
const waiverRoutes = require('./financeSystem/routes/waiverRoutes');
const reportRoutes = require('./financeSystem/routes/reportRoutes');
const galleryRoutes = require('./controllers/galleryRoutes');
const heroSlider = require('./controllers/heroSliderRoutes');
//finance routes
//finance new routes
const paymentIntentRoutes = require('./financeSystem/routes/paymentIntentRoutes');
const auditRoutes = require('./financeSystem/routes/auditRoutes');
const adjustmentRoutes = require('./financeSystem/routes/adjustmentRoutes');
const reconciliationRoutes = require('./financeSystem/routes/reconciliationRoutes');
const notificationRoutes = require('./financeSystem/routes/notificationRoutes');
const pdfRoutes = require('./financeSystem/routes/pdfRoutes');
const billRoutes = require('./financeSystem/routes/billRoutes');


app.use("/api/s2/user", user);
app.use("/api/s2/assignments", assignmentRoutes);
app.use("/api/s2/attendance", attendance);
app.use("/api/s2/classes", classRoutes);
app.use("/api/s2/exams", examRoutes);
app.use("/api/s2/grade", gradeRoutes);
app.use("/api/s2/parents", parentRoutes);
app.use("/api/s2/results", resultRoutes);
app.use("/api/result-sheets", resultSheetRoutes);
app.use("/api/s2/routines", routineRoutes);
app.use("/api/s2/students", studentRoutes);
app.use("/api/s2/subjects", subjectRoutes);
app.use("/api/s2/teachers", teacherRoutes);
app.use("/api/s2/roles", roleRoutes);
// app.use("/api/s2/finance", financeRoutes);
app.use("/api/s2/admin", adminRoutes);
app.use("/api/s2/public", publicRoutes);
app.use("/api/s2/announcements", announcementRoutes);
app.use("/api/s2/sections", sectionRoutes);
app.use("/api/s2/exam-routines", examRoutineRoutes);
// NEW: Mount directory routes
app.use('/api/s2/stuff', stuffRoutes);
app.use('/api/s2/committee', committeeRoutes);
app.use('/api/s2/cabinet', cabinetRoutes);
app.use('/api/s2/clubs', clubRoutes);
app.use('/api/s2/gallery', galleryRoutes);
app.use('/api/s2/hero-slider', heroSlider);
// app.use("/api/s2/finance/reports", reportRoutes);
// NEW: Mount finance routes
app.use("/api/s2/fees", feesRoutes);
app.use("/api/s2/ledger", ledgerRoutes);
app.use("/api/s2/payments", paymentRoutes);
app.use("/api/s2/refunds", refundRoutes);
app.use("/api/s2/waivers", waiverRoutes);
app.use('/api/s2/reports', reportRoutes);
// NEW: Mount finance-specific routes
app.use('/api/s2/payment-intents', paymentIntentRoutes);
app.use('/api/s2/audit', auditRoutes);
app.use('/api/s2/adjustments', adjustmentRoutes);
app.use('/api/s2/reconciliation', reconciliationRoutes);
app.use('/api/s2/notifications', notificationRoutes);
app.use('/api/s2/pdf', pdfRoutes);
app.use('/api/s2/bills', billRoutes);

// Global error handler
app.use(ErrorHandler);

module.exports = app;
==================================================================================================
// src/api/feeApi.js

import { api } from "../api"

export const feeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Fee Templates
    getFeeTemplate: builder.query({
      query: (id) => `/fees/templates/${id}`,
      providesTags: (result, error, id) => [{ type: 'FeeTemplate', id }],
    }),

    updateFeeTemplate: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/fees/templates/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'FeeTemplate', id }],
    }),

    deleteFeeTemplate: builder.mutation({
      query: (id) => ({
        url: `/fees/templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FeeTemplate'],
    }),

    // Student Fees
    getStudentFees: builder.query({
      query: ({ studentId, session, status }) => ({
        url: `/fees/student/${studentId}`,
        params: { session, status },
      }),
      providesTags: ['FeeInstance'],
    }),

    getFeeSummary: builder.query({
      query: ({ studentId, session }) => ({
        url: `/fees/student/${studentId}/summary`,
        params: { session },
      }),
      providesTags: ['FeeInstance'],
    }),

    getStudentFeeDetails: builder.query({
      query: (studentId) => `/fees/student/${studentId}/details`,
      providesTags: ['FeeInstance'],
    }),

    // Fee Instances
    updateFeeInstance: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/fees/instances/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['FeeInstance'],
    }),

    deleteFeeInstance: builder.mutation({
      query: (id) => ({
        url: `/fees/instances/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FeeInstance', 'Ledger'],
    }),

    // Bulk Operations
    generateFeeInstances: builder.mutation({
      query: (data) => ({
        url: '/fees/generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['FeeInstance', 'Ledger'],
    }),

    // Reports
    getFeeCollectionReport: builder.query({
      query: ({ startDate, endDate, classId, session }) => ({
        url: '/reports/collection/fees',
        params: { startDate, endDate, classId, session },
      }),
      providesTags: ['Report'],
    }),

    getOutstandingFeesReport: builder.query({
      query: ({ session, classId, overdueOnly }) => ({
        url: '/fees/reports/outstanding',
        params: { session, classId, overdueOnly },
      }),
      providesTags: ['Report'],
    }),

    // new api endpoints can be added here
    // Fee Templates
    getFeeTemplates: builder.query({
      query: ({ isActive, session } = {}) => ({
        url: '/fees/templates',
        params: { isActive, session },
      }),
      providesTags: ['FeeTemplate'],
    }),

    // Add this new endpoint to get students by template scope
    getStudentsByTemplateScope: builder.query({
      query: ({ templateId, session }) => ({
        url: `/fees/templates/${templateId}/eligible-students`,
        params: { session },
      }),
      providesTags: ['Student'],
    }),

    createFeeTemplate: builder.mutation({
      query: (data) => ({
        url: '/fees/templates',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['FeeTemplate'],
    }),

    applyFeeTemplate: builder.mutation({
      query: ({ id, force = false }) => ({
        url: `/fees/templates/${id}/apply`,
        method: 'POST',
        body: { force }, // Backend expects options object with force property
      }),
      invalidatesTags: ['FeeInstance', 'Ledger', 'Student'],
    }),

    // Add this utility endpoint for session
    getCurrentSession: builder.query({
      query: () => '/fees/current-session',
      providesTags: ['Session'],
    }),

    // Session Management
    setSession: builder.mutation({
      query: (session) => ({
        url: '/fees/set-session',
        method: 'POST',
        body: { session },
      }),
      invalidatesTags: ['Session'],
    }),


  }),
})

export const {
  useGetFeeTemplatesQuery,
  useGetFeeTemplateQuery,
  useCreateFeeTemplateMutation,
  useUpdateFeeTemplateMutation,
  useDeleteFeeTemplateMutation,
  useApplyFeeTemplateMutation,
  useGetStudentFeesQuery,
  useGetFeeSummaryQuery,
  useGetStudentFeeDetailsQuery,
  useUpdateFeeInstanceMutation,
  useDeleteFeeInstanceMutation,
  useGenerateFeeInstancesMutation,
  useGetFeeCollectionReportQuery,
  useGetOutstandingFeesReportQuery,
  // new hooks can be exported here
  useGetStudentsByTemplateScopeQuery,
  useGetCurrentSessionQuery,
  useSetSessionMutation,
} = feeApi

==================================================================================================
// src/api/ledgerApi.js

import { api } from "../api"

export const ledgerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Student Ledger
    getStudentLedger: builder.query({
      query: ({ studentId, startDate, endDate, limit = 100, page = 1 }) => ({
        url: `/ledger/${studentId}`,
        params: { startDate, endDate, limit, page },
      }),
      providesTags: ['Ledger'],
    }),

    validateLedger: builder.query({
      query: (studentId) => ({
        url: `/ledger/${studentId}/validate`,
      }),
    }),

    getCurrentBalance: builder.query({
      query: (studentId) => ({
        url: `/ledger/${studentId}/balance`,
      }),
      providesTags: ['Ledger'],
    }),

    // Ledger Entries
    getLedgerEntries: builder.query({
      query: ({ startDate, endDate, type, studentId, page = 1, limit = 50 }) => ({
        url: '/ledger/entries',
        params: { startDate, endDate, type, studentId, page, limit },
      }),
      providesTags: ['Ledger'],
    }),

    // Ledger Reports
    getLedgerReport: builder.query({
      query: ({ startDate, endDate, studentId, classId }) => ({
        url: '/ledger/reports',
        params: { startDate, endDate, studentId, classId },
      }),
      providesTags: ['Report'],
    }),

    getLedgerSummary: builder.query({
      query: ({ date, session }) => ({
        url: '/ledger/summary',
        params: { date, session },
      }),
      providesTags: ['Report'],
    }),

    // Ledger Reports
    getDashboardData: builder.query({
      query: ({ session }) => ({
        url: '/reports/dashboard/finance',
        params: { session },
      }),
      providesTags: ['Report'],
    }),

  }),
})

export const {
  useGetStudentLedgerQuery,
  useValidateLedgerQuery,
  useGetCurrentBalanceQuery,
  useGetLedgerEntriesQuery,
  useGetLedgerReportQuery,
  useGetLedgerSummaryQuery,
  useGetDashboardDataQuery,
} = ledgerApi
==================================================================================================
// src/api/paymentApi.js

import { api } from "../api"

export const paymentApi = api.injectEndpoints({
  endpoints: (builder) => ({

    // Receive Payment - CORRECT
    receivePayment: builder.mutation({
      query: (paymentData) => ({
        url: '/payments',
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: ['Payment', 'FeeInstance', 'Ledger', 'AdvanceBalance', 'Student'],
    }),

    // Get Payments
    getPayments: builder.query({
      query: ({ page = 1, limit = 20, startDate, endDate, method, studentId } = {}) => ({
        url: '/payments',
        params: { page, limit, startDate, endDate, method, studentId },
      }),
      providesTags: ['Payment'],
    }),

    getPayment: builder.query({
      query: (id) => `/payments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Payment', id }],
    }),

    // Payment Allocations
    getPaymentAllocations: builder.query({
      query: (paymentId) => ({
        url: `/payments/${paymentId}/allocations`,
      }),
      providesTags: ['Payment'],
    }),

    // Advance Balance
    getAdvanceBalance: builder.query({
      query: (studentId) => ({
        url: `/payments/student/${studentId}/advance`,
      }),
      providesTags: ['AdvanceBalance'],
    }),

    useAdvanceBalance: builder.mutation({
      query: (data) => ({
        url: '/payments/use-advance',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['FeeInstance', 'AdvanceBalance', 'Ledger'],
    }),

    autoApplyAdvance: builder.mutation({
      query: (data) => ({
        url: '/payments/auto-apply-advance',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['FeeInstance', 'AdvanceBalance', 'Ledger'],
    }),

    // Bulk Payments
    processBulkPayments: builder.mutation({
      query: (data) => ({
        url: '/payments/bulk',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payment', 'FeeInstance', 'Ledger', 'AdvanceBalance'],
    }),

    // Verify Payment
    verifyPayment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/payments/${id}/verify`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payment'],
    }),

    // Reports
    getPaymentCollectionReport: builder.query({
      query: ({ startDate, endDate, method, classId, session }) => ({
        url: '/reports/collection/payments',
        params: { startDate, endDate, method, classId, session },
      }),
      providesTags: ['Report'],
    }),

    getDailyCollectionReport: builder.query({
      query: ({ date }) => ({
        url: '/payments/reports/daily',
        params: { date },
      }),
      providesTags: ['Report'],
    }),

    // Get Payment History for Student - UPDATE THIS
    getPaymentHistory: builder.query({
      query: ({ studentId, session, limit = 50 }) => ({
        url: `/payments/student/${studentId}`,
        params: { session, limit },
      }),
      providesTags: (result, error, { studentId }) => [
        { type: 'Payment', id: studentId }
      ],
    }),

    // Get All Payments (for admin view) - ADD THIS IF NEEDED
    getAllPayments: builder.query({
      query: ({ page = 1, limit = 20, startDate, endDate, method } = {}) => ({
        url: '/payments/all', // You need to create this backend endpoint
        params: { page, limit, startDate, endDate, method },
      }),
      providesTags: ['Payment'],
    }),

     // NEW: Search payments with filters
    searchPayments: builder.query({
      query: ({ 
        search = '', 
        session, 
        method, 
        status = 'completed', 
        startDate, 
        endDate, 
        page = 1, 
        limit = 20 
      } = {}) => ({
        url: '/payments/search',
        params: { 
          search, 
          session, 
          method, 
          status, 
          startDate, 
          endDate, 
          page, 
          limit 
        },
      }),
      providesTags: ['Payment'],
    }),

    // Use lazy query for manual triggering
    searchPaymentsLazy: builder.query({
      query: (params) => ({
        url: '/payments/search',
        params,
      }),
    }),

    // Lazy query for student payment history
    getPaymentHistoryLazy: builder.query({
      query: ({ studentId, session, limit = 50 }) => ({
        url: `/payments/student/${studentId}`,
        params: { session, limit },
      }),
    }),

  }),
})

export const {
  useReceivePaymentMutation,
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useGetPaymentHistoryQuery,
  useGetPaymentAllocationsQuery,
  useGetAdvanceBalanceQuery,
  useUseAdvanceBalanceMutation,
  useAutoApplyAdvanceMutation,
  useProcessBulkPaymentsMutation,
  useVerifyPaymentMutation,
  useGetPaymentCollectionReportQuery,
  useGetDailyCollectionReportQuery,
  useGetAllPaymentsQuery,
  useSearchPaymentsQuery,
  useLazySearchPaymentsLazyQuery,
  useLazyGetPaymentHistoryLazyQuery,

  
} = paymentApi
===============================================================================================
// src/api/refundApi.js

import { api } from "../api"

export const refundApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Process Refund
    processRefund: builder.mutation({
      query: (refundData) => ({
        url: '/refunds',
        method: 'POST',
        body: refundData,
      }),
      invalidatesTags: ['Refund', 'Payment', 'FeeInstance', 'Ledger', 'AdvanceBalance'],
    }),

    // Get Refunds
    getRefunds: builder.query({
      query: ({ page = 1, limit = 20, startDate, endDate, studentId } = {}) => ({
        url: '/refunds',
        params: { page, limit, startDate, endDate, studentId },
      }),
      providesTags: ['Refund'],
    }),

    getRefund: builder.query({
      query: (id) => `/refunds/${id}`,
      providesTags: (result, error, id) => [{ type: 'Refund', id }],
    }),

    // Refund History
    getRefundHistory: builder.query({
      query: ({ studentId, session, limit = 20 }) => ({
        url: `/refunds/student/${studentId}`,
        params: { session, limit },
      }),
      providesTags: ['Refund'],
    }),

    // Validate Refund
    validateRefund: builder.query({
      query: ({ paymentId, amount }) => ({
        url: `/refunds/validate/${paymentId}`,
        params: { amount },
      }),
    }),

    // Update Refund Status
    updateRefundStatus: builder.mutation({
      query: ({ id, status, reason }) => ({
        url: `/refunds/${id}/status`,
        method: 'PUT',
        body: { status, reason },
      }),
      invalidatesTags: ['Refund'],
    }),

    // Reports
    getRefundReport: builder.query({
      query: ({ startDate, endDate, reason }) => ({
        url: '/refunds/reports',
        params: { startDate, endDate, reason },
      }),
      providesTags: ['Report'],
    }),
  }),
})

export const {
  useProcessRefundMutation,
  useGetRefundsQuery,
  useGetRefundQuery,
  useGetRefundHistoryQuery,
  useValidateRefundQuery,
  useUpdateRefundStatusMutation,
  useGetRefundReportQuery,
} = refundApi
===============================================================================================
// src/api/waiverApi.js

import { api } from "../api"

export const waiverApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Waiver Requests
    requestWaiver: builder.mutation({
      query: (waiverData) => ({
        url: '/waivers/request',
        method: 'POST',
        body: waiverData,
      }),
      invalidatesTags: ['Waiver'],
    }),

    getWaiverRequests: builder.query({
      query: ({ studentId, status, limit = 50, page = 1 }) => ({
        url: '/waivers',
        params: { studentId, status, limit, page },
      }),
      providesTags: ['Waiver'],
    }),

    getWaiverRequest: builder.query({
      query: (id) => `/waivers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Waiver', id }],
    }),

    getEligibleWaiver: builder.query({
      query: (feeInstanceId) => ({
        url: `/waivers/eligible/${feeInstanceId}`,
      }),
      providesTags: ['Waiver'],
    }),

    // Waiver Approval
    approveWaiver: builder.mutation({
      query: ({ id, remarks }) => ({
        url: `/waivers/${id}/approve`,
        method: 'POST',
        body: { remarks },
      }),
      invalidatesTags: ['Waiver', 'FeeInstance', 'Ledger'],
    }),

    rejectWaiver: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/waivers/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Waiver'],
    }),

    revokeWaiver: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/waivers/${id}/revoke`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Waiver', 'FeeInstance', 'Ledger'],
    }),

    updateWaiver: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/waivers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Waiver'],
    }),

    // Reports
    getWaiverReport: builder.query({
      query: ({ startDate, endDate, type, status }) => ({
        url: '/waivers/reports',
        params: { startDate, endDate, type, status },
      }),
      providesTags: ['Report'],
    }),
  }),
})

export const {
  useRequestWaiverMutation,
  useGetWaiverRequestsQuery,
  useGetWaiverRequestQuery,
  useGetEligibleWaiverQuery,
  useApproveWaiverMutation,
  useRejectWaiverMutation,
  useRevokeWaiverMutation,
  useUpdateWaiverMutation,
  useGetWaiverReportQuery,
} = waiverApi

src/
├── api/
│   └── finance/
│       ├── feeApi.js               ← existing (keep, patch)
│       ├── paymentApi.js           ← existing (patch)
│       ├── paymentIntentApi.js     ← NEW
│       ├── refundApi.js            ← rewrite (workflow)
│       ├── waiverApi.js            ← patch
│       ├── adjustmentApi.js        ← NEW
│       ├── ledgerApi.js            ← patch
│       ├── billApi.js              ← NEW
│       ├── auditApi.js             ← NEW
│       ├── reconciliationApi.js    ← NEW
│       ├── notificationApi.js      ← NEW
│       ├── reportApi.js            ← NEW (contains dashboard)
│       └── pdfApi.js               ← NEW (thin, binary downloads)
│
├── lib/
│   ├── formaters.js                ← patch (Decimal128 handling)
│   └── financeUtils.js             ← NEW (shared helpers)
│
├── components/
│   └── finance/
│       ├── layout/
│       │   ├── FinancePageHeader.jsx        ← shared header
│       │   ├── FinanceStatCard.jsx          ← KPI card
│       │   ├── FinanceEmptyState.jsx        ← empty state
│       │   ├── FinanceLoading.jsx           ← loading
│       │   └── MoneyDisplay.jsx             ← handles Decimal128
│       │
│       ├── templates/
│       │   ├── FeeTemplateForm.jsx          ← refactor (already exists)
│       │   ├── FeeTemplateTable.jsx         ← NEW
│       │   ├── FeeTemplateCard.jsx          ← NEW (alternative view)
│       │   └── EligibleStudentsTable.jsx    ← NEW
│       │
│       ├── payments/
│       │   ├── ReceivePaymentForm.jsx       ← NEW (cash desk)
│       │   ├── StudentPicker.jsx            ← NEW (autocomplete)
│       │   ├── PaymentMethodPicker.jsx      ← NEW
│       │   ├── PaymentHistoryTable.jsx      ← NEW
│       │   ├── PaymentDetailDrawer.jsx      ← NEW (allocations)
│       │   ├── VoidPaymentDialog.jsx        ← NEW
│       │   └── ReceiptPreview.jsx           ← NEW
│       │
│       ├── fees/
│       │   ├── ApplyFeeWizard.jsx           ← NEW (multi-step)
│       │   ├── StudentFeeTable.jsx          ← NEW
│       │   └── FeeInstanceDetailCard.jsx    ← NEW
│       │
│       ├── waivers/
│       │   ├── WaiverRequestForm.jsx        ← NEW
│       │   ├── WaiverApprovalTable.jsx      ← NEW
│       │   └── WaiverDetailDialog.jsx       ← NEW
│       │
│       ├── refunds/
│       │   ├── RefundRequestForm.jsx        ← NEW
│       │   ├── RefundApprovalTable.jsx      ← NEW
│       │   └── RefundProcessDialog.jsx      ← NEW
│       │
│       ├── adjustments/
│       │   ├── AdjustmentRequestForm.jsx    ← NEW
│       │   └── AdjustmentWorkflowTable.jsx  ← NEW
│       │
│       ├── ledger/
│       │   ├── StudentLedgerTable.jsx       ← NEW
│       │   └── LedgerEntryRow.jsx           ← NEW
│       │
│       ├── bills/
│       │   ├── MonthlyBillCard.jsx          ← NEW
│       │   ├── StatementView.jsx            ← NEW
│       │   └── BillDetailDialog.jsx         ← NEW
│       │
│       ├── intent/
│       │   ├── CreateIntentForm.jsx         ← NEW
│       │   └── IntentStatusBadge.jsx        ← NEW
│       │
│       ├── dashboard/
│       │   ├── KpiStrip.jsx                 ← NEW
│       │   ├── AgingBuckets.jsx             ← NEW
│       │   ├── RecentPaymentsList.jsx       ← NEW
│       │   ├── TopDebtorsList.jsx           ← NEW
│       │   └── ClassWiseCollection.jsx      ← NEW
│       │
│       ├── reports/
│       │   ├── CollectionReportView.jsx     ← NEW
│       │   ├── AgingReportView.jsx          ← NEW
│       │   └── ReconciliationView.jsx       ← NEW
│       │
│       └── shared/
│           ├── StudentSearchInput.jsx       ← NEW (async search)
│           ├── SessionSelector.jsx          ← NEW
│           ├── StatusBadge.jsx              ← NEW (fee/payment/refund)
│           ├── AmountCell.jsx               ← NEW (money cell)
│           └── ConfirmDialog.jsx            ← NEW
│
├── pages/
│   └── finance/
│       ├── FinanceDashboard.jsx             ← replace existing
│       ├── fees/
│       │   ├── FeeTemplates.jsx             ← replace
│       │   ├── ApplyFees.jsx                ← NEW
│       │   ├── EligibleStudents.jsx         ← NEW
│       │   └── StudentFees.jsx              ← NEW
│       ├── payments/
│       │   ├── ReceivePayment.jsx           ← replace
│       │   ├── PaymentHistory.jsx           ← replace
│       │   └── PaymentDetail.jsx            ← NEW
│       ├── waivers/
│       │   ├── RequestWaiver.jsx            ← replace
│       │   └── ApproveWaivers.jsx           ← replace
│       ├── refunds/
│       │   ├── RequestRefund.jsx            ← replace
│       │   └── RefundWorkflow.jsx           ← NEW
│       ├── adjustments/
│       │   └── Adjustments.jsx              ← NEW
│       ├── ledger/
│       │   └── StudentLedger.jsx            ← replace
│       ├── students/
│       │   ├── StudentStatement.jsx         ← NEW
│       │   └── StudentDirectory.jsx         ← NEW (search all)
│       ├── reports/
│       │   ├── CollectionReport.jsx         ← replace
│       │   ├── AgingReport.jsx              ← NEW
│       │   └── Reconciliation.jsx           ← NEW
│       └── settings/
│           └── SessionSettings.jsx          ← replace
│
└── hooks/
    └── finance/
        ├── useCurrentSession.js             ← existing (keep)
        ├── useFinancePermissions.js         ← NEW
        └── useDebouncedValue.js             ← NEW




1. Parent logs in → sees their children list
2. Picks a child → sees the child's statement (bills + dues)
3. Clicks "Pay Now"
   ↓
4. Chooses payment method:
   - Cash at office (creates intent, waits for accountant confirm)
   - Bank transfer (uploads slip — accountant confirms)
   - Mobile banking (bKash/Nagad — redirect to gateway)
   - Card / Online (SSLCommerz — redirect to gateway)
   ↓
5. For gateway methods:
   - Redirect to gateway
   - Gateway processes
   - Returns to /payment-intents/:id/return
   - Webhook confirms intent → creates Payment
   ↓
6. Parent sees "Payment confirmed" + receipt
7. Parent can download PDF receipt or view public receipt link from email/SMS

New components
ChildrenOverview.jsx — parent's home showing each child's balance

ChildStatement.jsx — the parent-facing statement (uses getStudentStatement)

PayNowDialog.jsx — choose amount + gateway, create intent

GatewaySelector.jsx — Cash / Bank / bKash / SSLCommerz with icons

IntentStatusTracker.jsx — polls intent status until confirmed/failed

ReturnPage.jsx — handles /parent/payment-intents/:id/return

PublicReceiptPage.jsx — public /receipts/:token route (no login)

NotificationInbox.jsx — bell icon + notification list for parents

<Route path="children" element={<ChildrenOverview />} />
<Route path="children/:childId/statement" element={<ChildStatement />} />
<Route path="children/:childId/statement/pay" element={<PayNowDialog />} />
<Route path="payment-intents/:id/return" element={<ReturnPage />} />
<Route path="notifications" element={<NotificationInbox />} />

Plus a public route outside the parent layout:

<Route path="/receipts/:token" element={<PublicReceiptPage />} />
