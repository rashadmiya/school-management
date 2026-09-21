const express = require('express');
const router = express.Router();
const ReceiptPdfService = require('../../services/pdf/ReceiptPdfService');
const StatementPdfService = require('../../services/pdf/StatementPdfService');
const { isAnyAuthenticated } = require('../../middleware/anyAuth');
const catchAsyncErrors = require('../../middleware/catchAsyncErrors');
const { getCurrentSession } = require('../../utils/accademicSession');
const Payment = require('../models/Payment');
const Student = require('../../models/Student');

/* ---------- helpers ---------- */

/**
 * Return true if the authenticated actor may see data for `studentId`.
 * - staff   → always
 * - student → only their own
 * - parent  → only their children
 */
function canAccessStudent(req, studentId) {
    const auth = req.auth;
    if (!auth) return false;
    if (auth.type === 'user') return true;
    if (auth.type === 'student') {
        return String(auth.student._id) === String(studentId);
    }
    if (auth.type === 'parent') {
        return (auth.parent.children || []).some(
            (c) => String(c._id || c) === String(studentId)
        );
    }
    return false;
}

/* ---------- receipt ---------- */

router.get('/receipt/:paymentId',
    isAnyAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const { format = 'pdf' } = req.query;

        // Load payment to check ownership
        const payment = await Payment.findById(req.params.paymentId)
            .select('student receiptNumber status')
            .lean();

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Ownership check
        if (!canAccessStudent(req, payment.student)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // JSON debug path (kept from original)
        if (format === 'json') {
            const full = await Payment.findById(req.params.paymentId).lean();
            return res.json({ success: true, data: full });
        }

        const buf = await ReceiptPdfService.generate(req.params.paymentId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="receipt-${payment.receiptNumber || req.params.paymentId}.pdf"`);
        res.send(buf);
    })
);

/* ---------- statement ---------- */

router.get('/statement/:studentId',
    isAnyAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        // Ownership check first — a student must not pull another student's statement
        if (!canAccessStudent(req, req.params.studentId)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Confirm the student exists (avoids a 500 when ID is bogus)
        const exists = await Student.exists({ _id: req.params.studentId });
        if (!exists) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const session = req.query.session || getCurrentSession();
        const buf = await StatementPdfService.generate(req.params.studentId, session);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="statement-${req.params.studentId}.pdf"`);
        res.send(buf);
    })
);

module.exports = router;

// // routes/pdfRoutes.js
// const express = require('express');
// const router = express.Router();
// const ReceiptPdfService = require('../../services/pdf/ReceiptPdfService');
// const StatementPdfService = require('../../services/pdf/StatementPdfService');
// const { isAuthenticated } = require('../../middleware/auth');
// const catchAsyncErrors = require('../../middleware/catchAsyncErrors');
// const { getCurrentSession } = require('../../utils/accademicSession');
// const Payment = require('../models/Payment');

// // router.get('/receipt/:paymentId', isAuthenticated, catchAsyncErrors(async (req, res) => {
// //     const buf = await ReceiptPdfService.generate(req.params.paymentId);
// //     res.setHeader('Content-Type', 'application/pdf');
// //     res.setHeader('Content-Disposition', `inline; filename="receipt-${req.params.paymentId}.pdf"`);
// //     res.send(buf);
// // }));

// // router.get('/receipt/:paymentId',
// //     isAnyAuthenticated,
// //     catchAsyncErrors(async (req, res) => {
// //         // If parent auth, verify the payment belongs to one of their children
// //         if (req.auth?.type === 'parent') {
// //             const parent = await Parent.findById(req.auth.parent._id)
// //                 .populate('children', '_id').lean();
// //             const Payment = require('../financeSystem/models/Payment');
// //             const owns = await Payment.exists({
// //                 _id: req.params.paymentId,
// //                 student: { $in: parent.children.map(c => c._id) },
// //             });
// //             if (!owns) {
// //                 return res.status(403).json({ success: false, message: 'Access denied' });
// //             }
// //         }
// //         const buf = await ReceiptPdfService.generate(req.params.paymentId);
// //         res.setHeader('Content-Type', 'application/pdf');
// //         res.setHeader('Content-Disposition', `inline; filename="receipt.pdf"`);
// //         res.send(buf);
// //     })
// // );

// router.get('/receipt/:paymentId', isAuthenticated, catchAsyncErrors(async (req, res) => {
//     const { format = 'pdf' } = req.query;

//     if (format === 'json') {
//         const payment = await Payment.findById(req.params.paymentId).lean();
//         return res.json({ success: true, data: payment });
//     }

//     const buf = await ReceiptPdfService.generate(req.params.paymentId);
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `inline; filename="receipt.pdf"`);
//     res.send(buf);
// }));

// router.get('/statement/:studentId', isAuthenticated, catchAsyncErrors(async (req, res) => {
//     const session = req.query.session || getCurrentSession();
//     const buf = await StatementPdfService.generate(req.params.studentId, session);
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `inline; filename="statement-${req.params.studentId}.pdf"`);
//     res.send(buf);
// }));

// module.exports = router;