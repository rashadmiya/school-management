// routes/parentRoutes.js
const express = require('express');
const router = express.Router();

const Student = require('../models/Student');
const Parent = require('../models/Parent')
const { isParentAuthenticated } = require('../middleware/parentAuth');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/ErrorHandler');

const StudentFinanceSummaryService = require('../services/StudentFinanceSummaryService');
const BillService = require('../financeSystem/services/BillService');
const PaymentService = require('../services/PaymentService');
const FeeService = require('../services/FeeService');
const { getCurrentSession } = require('../utils/accademicSession');
const PaymentIntentService = require('../services/PaymentIntentService');
const { toDecimal } = require('../utils/decimal');

/* ---------- helpers ---------- */
function sessionFrom(req) {
    return req.query.session || getCurrentSession();
}

function assertChild(req, childId) {
    const owns = req.parent.children.some(c => String(c._id) === String(childId));
    if (!owns) throw new ErrorHandler('Access denied to this child', 403);
}

/* ---------- profile ---------- */
router.get('/my/profile', isParentAuthenticated, catchAsyncErrors(async (req, res) => {
    res.json({
        success: true,
        parent: {
            _id: req.parent._id,
            name: req.parent.name,
            phone: req.parent.phone,
            email: req.parent.email,
            altPhone: req.parent.altPhone,
            address: req.parent.address,
        },
    });
}));

router.put('/my/profile', isParentAuthenticated, catchAsyncErrors(async (req, res) => {
    const { email, altPhone, address } = req.body;
    const Parent = require('../models/Parent');
    const updated = await Parent.findByIdAndUpdate(
        req.parent._id,
        { $set: { ...(email && { email }), ...(altPhone && { altPhone }), ...(address && { address }) } },
        { new: true, runValidators: true }
    ).select('-pin -otpHash');
    res.json({ success: true, parent: updated });
}));

/* ---------- children ---------- */
router.get("/my/children", isParentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    // Find parent by user ID
    console.log("parent id:", req.parent._id)
    const parent = await Parent.findOne({ _id: req.parent._id })
      .populate("children", "name rollNumber class gender dateOfBirth")
      .populate({
        path: "children",
        populate: { path: "class", select: "name section" }
      });

    if (!parent) {
      return next(new ErrorHandler("Parent profile not found", 404));
    }

    res.status(200).json({
      success: true,
      children: parent.children || []
    });

  } catch (error) {
    next(error);
  }
}));

/* ---------- finance per child ---------- */
router.get('/my/children/:childId/finance', isParentAuthenticated, catchAsyncErrors(async (req, res) => {
    const { childId } = req.params;
    assertChild(req, childId);

    const session = sessionFrom(req);

    const [summary, bills, payments, advance, fees] = await Promise.all([
        StudentFinanceSummaryService.getSummary(childId, session),
        BillService.getMonthlyBills(childId, session),
        PaymentService.getPaymentHistory(childId, session, 20),
        PaymentService.getStudentAdvanceBalance(childId, session),
        FeeService.getStudentFees(childId, session),
    ]);

    res.json({
        success: true,
        session,
        summary: summary ? {
            totalFee: summary.totalFee?.toString() || '0',
            totalPaid: summary.totalPaid?.toString() || '0',
            totalWaived: summary.totalWaived?.toString() || '0',
            totalAdvanceUsed: summary.totalAdvanceUsed?.toString() || '0',
            totalRefunded: summary.totalRefunded?.toString() || '0',
            advanceBalance: summary.advanceBalance?.toString() || '0',
            dueBalance: summary.dueBalance?.toString() || '0',
            status: summary.status || 'clear',
        } : null,
        bills,
        payments: payments.map(p => ({
            _id: p._id,
            receiptNumber: p.receiptNumber,
            amount: p.amount.toString(),
            method: p.method,
            status: p.status,
            createdAt: p.createdAt,
        })),
        fees: fees.map(f => ({
            _id: f._id,
            title: f.title,
            totalAmount: f.totalAmount.toString(),
            paidAmount: f.paidAmount.toString(),
            waivedAmount: f.waivedAmount.toString(),
            advanceUsed: f.advanceUsed.toString(),
            dueAmount: f.dueAmount.toString(),
            dueDate: f.dueDate,
            status: f.status,
        })),
        advance: {
            amount: advance.amount.toString(),
            currency: advance.currency || 'BDT',
        },
    });
}));

/* ---------- attendance across children ---------- */
router.get('/my/children/attendance', isParentAuthenticated, catchAsyncErrors(async (req, res) => {
    const Attendance = require('../models/Attendance');
    const {
        childId, subjectId,
        startDate, endDate,
        limit = 500,
    } = req.query;

    const childIds = req.parent.children.map(c => c._id);
    if (childIds.length === 0) {
        return res.json({ success: true, children: [], records: [], stats: {} });
    }

    const filter = {};

    // Scope filter — parent may only see their own children
    if (childId && childId !== 'all') {
        if (!childIds.some(id => String(id) === String(childId))) {
            throw new ErrorHandler('Access denied to this child', 403);
        }
        filter.student = childId;
    } else {
        filter.student = { $in: childIds };
    }

    // Subject filter
    if (subjectId) filter.subject = subjectId;

    // Date range (default last 30 days)
    if (!startDate && !endDate) {
        filter.date = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    } else {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) {
            const e = new Date(endDate);
            e.setHours(23, 59, 59, 999);
            filter.date.$lte = e;
        }
    }

    const records = await Attendance.find(filter)
        .populate('student', 'name rollNumber class')
        .populate('subject', 'name code')
        .populate('class', 'name section')
        .populate('recordedBy', 'name')   // ← new
        .sort({ date: -1, period: 1 })
        .limit(Number(limit))
        .lean();

    // Per-child stats — unchanged
    const stats = {};
    for (const c of req.parent.children) {
        stats[String(c._id)] = {
            totalRecords: 0,
            presentRecords: 0,
            absentRecords: 0,
            lateRecords: 0,
            halfDayRecords: 0,
            attendancePercentage: 0,
        };
    }
    for (const r of records) {
        const id = String(r.student?._id);
        if (!stats[id]) continue;
        const s = stats[id];
        s.totalRecords++;
        if (r.status === 'present') s.presentRecords++;
        else if (r.status === 'absent') s.absentRecords++;
        else if (r.status === 'late') s.lateRecords++;
        else if (r.status === 'half_day') s.halfDayRecords++;
    }
    for (const id of Object.keys(stats)) {
        const s = stats[id];
        const weighted = s.presentRecords + s.lateRecords * 0.5 + s.halfDayRecords * 0.5;
        s.attendancePercentage = s.totalRecords > 0
            ? Math.round((weighted / s.totalRecords) * 100)
            : 0;
    }

    res.json({
        success: true,
        children: req.parent.children.map(c => ({
            _id: c._id,
            name: c.name,
            rollNumber: c.rollNumber,
            class: c.class,
        })),
        records,
        stats,
    });
}));

/* ---------- results across children ---------- */
router.get('/my/children/results', isParentAuthenticated, catchAsyncErrors(async (req, res) => {
    const Result = require('../models/Result');
    const { childId, term, year, limit = 50 } = req.query;

    const childIds = req.parent.children.map(c => c._id);
    if (childIds.length === 0) {
        return res.json({ success: true, children: [], results: [], stats: {} });
    }

    const filter = {};
    if (childId) {
        if (!childIds.some(id => String(id) === String(childId))) {
            throw new ErrorHandler('Access denied to this child', 403);
        }
        filter.student = childId;
    } else {
        filter.student = { $in: childIds };
    }
    if (term) filter.term = term;
    if (year) filter.year = parseInt(year, 10);

    const results = await Result.find(filter)
        .populate('student', 'name rollNumber class')
        .populate('exam', 'title totalMarks date')
        .populate('subject', 'name code')
        .sort({ 'exam.date': -1, createdAt: -1 })
        .limit(Number(limit))
        .lean();

    // Per-child stats
    const stats = {};
    for (const c of req.parent.children) {
        stats[String(c._id)] = {
            totalExams: 0,
            totalMarks: 0,
            totalPossible: 0,
            averageMarks: 0,
            percentage: 0,
        };
    }
    for (const r of results) {
        const id = String(r.student?._id);
        if (!stats[id]) continue;
        const s = stats[id];
        s.totalExams += 1;
        s.totalMarks += Number(r.marksObtained || 0);
        s.totalPossible += Number(r.exam?.totalMarks || 0);
    }
    for (const id of Object.keys(stats)) {
        const s = stats[id];
        s.averageMarks = s.totalExams > 0
            ? Math.round((s.totalMarks / s.totalExams) * 100) / 100
            : 0;
        s.percentage = s.totalPossible > 0
            ? Math.round((s.totalMarks / s.totalPossible) * 1000) / 10
            : 0;
    }

    res.json({
        success: true,
        children: req.parent.children.map(c => ({
            _id: c._id,
            name: c.name,
            rollNumber: c.rollNumber,
            class: c.class,
        })),
        results,
        stats,
    });
}));


/* ---------- dashboard (aggregate across children) ---------- */
router.get('/my/dashboard', isParentAuthenticated, catchAsyncErrors(async (req, res) => {
    const session = sessionFrom(req);
    const childIds = req.parent.children.map(c => c._id);

    if (childIds.length === 0) {
        return res.json({
            success: true,
            session,
            parent: { name: req.parent.name, phone: req.parent.phone },
            children: [],
            summary: { totalDue: '0', totalPaid: '0', totalOutstanding: '0', collectionRate: 0 },
            recentPayments: [],
        });
    }

    const summaries = await Promise.all(
        childIds.map(id => StudentFinanceSummaryService.getSummary(id, session))
    );

    let totalFee = 0, totalPaid = 0, totalDue = 0;
    for (const s of summaries) {
        if (!s) continue;
        totalFee += Number(s.totalFee?.toString() || 0);
        totalPaid += Number(s.totalPaid?.toString() || 0);
        totalDue += Number(s.dueBalance?.toString() || 0);
    }
    const collectionRate = totalFee > 0 ? Math.round((totalPaid / totalFee) * 1000) / 10 : 0;

    // Recent payments across all children — one query
    const Payment = require('../financeSystem/models/Payment');
    const recentPayments = await Payment.find({
        student: { $in: childIds },
        session,
        status: 'completed',
    })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('student', 'name rollNumber')
        .lean();

    res.json({
        success: true,
        session,
        parent: { name: req.parent.name, phone: req.parent.phone },
        children: req.parent.children.map((c, i) => ({
            _id: c._id,
            name: c.name,
            rollNumber: c.rollNumber,
            class: c.class,
            summary: summaries[i] ? {
                totalFee: summaries[i].totalFee?.toString() || '0',
                totalPaid: summaries[i].totalPaid?.toString() || '0',
                advanceBalance: summaries[i].advanceBalance?.toString() || '0',
                dueBalance: summaries[i].dueBalance?.toString() || '0',
                status: summaries[i].status || 'clear',
            } : null,
        })),
        summary: {
            totalFee: totalFee.toFixed(2),
            totalPaid: totalPaid.toFixed(2),
            totalOutstanding: totalDue.toFixed(2),
            collectionRate,
        },
        recentPayments: recentPayments.map(p => ({
            _id: p._id,
            receiptNumber: p.receiptNumber,
            student: p.student?.name,
            amount: p.amount.toString(),
            method: p.method,
            createdAt: p.createdAt,
        })),
    });
}));

/* ============================================================
 *  Parent online payments (per-child)
 * ============================================================ */

const MAX_ADVANCE_TOPUP = toDecimal(50000);

/** Ownership helper — is `childId` one of this parent's children? */
function parentOwnsChild(req, childId) {
    return (req.parent.children || []).some(
        (c) => String(c._id || c) === String(childId)
    );
}

/**
 * POST /parent/my/children/:childId/payment-intents
 * Body: { amount, gateway, method, session, notes, feeInstances[] }
 */
router.post(
    '/my/children/:childId/payment-intents',
    isParentAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const { childId } = req.params;

        if (!parentOwnsChild(req, childId)) {
            return next(new ErrorHandler('Access denied to this child', 403));
        }

        const {
            amount,
            gateway = 'sslcommerz',
            method = 'online',
            session: sessionYear,
            notes,
            feeInstances = [],
        } = req.body;

        const payAmount = toDecimal(amount);
        if (payAmount.lte(0)) {
            return next(new ErrorHandler('Amount must be positive', 400));
        }

        const session = sessionYear || getCurrentSession();
        const summary = await StudentFinanceSummaryService.getSummary(childId, session);
        const dueBalance = toDecimal(summary?.dueBalance || 0);

        const maxAllowed = dueBalance.gt(0)
            ? dueBalance.plus(MAX_ADVANCE_TOPUP)
            : MAX_ADVANCE_TOPUP;

        if (payAmount.gt(maxAllowed)) {
            return next(new ErrorHandler(
                `Amount exceeds maximum allowed for this student (${maxAllowed.toFixed(2)})`,
                400
            ));
        }

        // Fee ownership: every targeted fee must belong to this child
        const FeeInstance = require('../financeSystem/models/FeeInstance');
        const feeIds = Array.isArray(feeInstances) ? feeInstances : [];
        if (feeIds.length > 0) {
            const owned = await FeeInstance.countDocuments({
                _id: { $in: feeIds },
                student: childId,
            });
            if (owned !== feeIds.length) {
                return next(new ErrorHandler(
                    'One or more fee instances do not belong to this child',
                    403
                ));
            }
        }

        const intent = await PaymentIntentService.createIntent(
            {
                studentId: childId,
                amount: payAmount.toFixed(2),
                purpose: 'fee_payment',
                method,
                gateway,
                feeInstances: feeIds,
                session,
                notes,
                resultPath: '/parent/payments/result',   // ← directs back to parent UI
            },
            req.parent._id   // initiatedBy — see note below
        );

        res.status(201).json({
            success: true,
            data: {
                _id: intent._id,
                status: intent.status,
                amount: intent.amount?.toString?.() ?? String(intent.amount),
                gateway: intent.gateway,
                redirectUrl: intent.redirectUrl || null,
                expiresAt: intent.expiresAt,
                childId,
            },
        });
    })
);

/**
 * GET /parent/my/payment-intents/:id
 * Polled by the parent result page until terminal state.
 */
router.get(
    '/my/payment-intents/:id',
    isParentAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const PaymentIntent = require('../financeSystem/models/PaymentIntent');
        const intent = await PaymentIntent.findById(req.params.id).lean();

        if (!intent) return next(new ErrorHandler('Intent not found', 404));

        // Ownership — the intent's student must be one of this parent's children
        if (!parentOwnsChild(req, intent.student)) {
            return next(new ErrorHandler('Access denied', 403));
        }

        res.json({
            success: true,
            data: {
                _id: intent._id,
                status: intent.status,
                amount: intent.amount?.toString?.() ?? String(intent.amount),
                gateway: intent.gateway,
                gatewayReference: intent.gatewayReference,
                failureReason: intent.failureReason,
                payment: intent.payment,
                createdAt: intent.createdAt,
                completedAt: intent.completedAt,
                expiresAt: intent.expiresAt,
                childId: intent.student,
            },
        });
    })
);

/**
 * POST /parent/my/payment-intents/:id/cancel
 */
router.post(
    '/my/payment-intents/:id/cancel',
    isParentAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const PaymentIntent = require('../financeSystem/models/PaymentIntent');
        const intent = await PaymentIntent.findById(req.params.id);

        if (!intent) return next(new ErrorHandler('Intent not found', 404));
        if (!parentOwnsChild(req, intent.student)) {
            return next(new ErrorHandler('Access denied', 403));
        }

        const cancelled = await PaymentIntentService.cancelIntent(
            intent._id,
            req.parent._id
        );

        res.json({
            success: true,
            data: { _id: cancelled._id, status: cancelled.status },
        });
    })
);

module.exports = router;

// const express = require("express");
// const Parent = require("../models/Parent");
// const Student = require("../models/Student");
// const Payment = require("../financeSystem/models/Payment")
// const Attendance = require("../models/Attendance");
// const Result = require("../models/Result");
// const Role = require("../models/Role");
// const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
// const ErrorHandler = require("../utils/ErrorHandler");
// const catchAsyncErrors = require("../middleware/catchAsyncErrors");
// const User = require("../models/User");

// const router = express.Router();

// // ✅ Create Parent (Admin or Teacher) - Keep as requested
// router.post("/create", isAuthenticated, authorizeRoles("admin", "teacher"), async (req, res, next) => {
//   let user; // Declare for cleanup scope

//   try {
//     const { name, email, password = "123456", phone, children = [] } = req.body;

//     // Validation
//     if (!name || !email) {
//       return next(new ErrorHandler("Name and email are required", 400));
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return next(new ErrorHandler("User with this email already exists", 400));
//     }

//     const parentRole = await Role.findOne({ name: "parent" });
//     if (!parentRole) {
//       return next(new ErrorHandler("Parent role not found. Please seed roles first.", 500));
//     }

//     // Validate children if provided
//     if (children.length > 0) {
//       const validChildren = await Student.countDocuments({ _id: { $in: children } });
//       if (validChildren !== children.length) {
//         return next(new ErrorHandler("One or more student IDs are invalid", 400));
//       }
//     }

//     // const hashedPassword = await bcrypt.hash(password, 10);

//     // Create user with parent role
//     user = await User.create({
//       name,
//       email,
//       password,
//       role: parentRole._id,
//       phoneNumber: phone,
//       isVerified: true, // ✅ No email activation needed
//     });

//     // Create parent profile
//     const parent = await Parent.create({
//       user: user._id,
//       name,
//       phone,
//       email,
//       children,
//     });

//     // Populate data for response
//     const populatedUser = await User.findById(user._id)
//       .populate('role', 'name')
//       .select('-password');

//     const populatedParent = await Parent.findById(parent._id)
//       .populate('children', 'name rollNumber class');

//     res.status(201).json({
//       success: true,
//       message: "Parent created successfully",
//       user: populatedUser, // ✅ Consistent with login structure
//       profile: populatedParent, // ✅ Consistent with login structure
//       data: {
//         user: populatedUser,
//         parent: populatedParent
//       },
//     });

//   } catch (error) {
//     console.error("Parent creation error:", error);

//     // Cleanup if creation fails
//     if (user) {
//       await User.findByIdAndDelete(user._id);
//       await Parent.findOneAndDelete({ user: user._id });
//     }

//     if (error.code === 11000) {
//       return next(new ErrorHandler("User with this email already exists", 400));
//     }

//     next(new ErrorHandler("Failed to create parent: " + error.message, 500));
//   }
// });


// // 🎯 PARENT PORTAL ENDPOINTS

// // ✅ Get parent's children (for parent portal)
// router.get("/my/children", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     // Find parent by user ID
//     const parent = await Parent.findOne({ user: req.user._id })
//       .populate("children", "name rollNumber class gender dateOfBirth")
//       .populate({
//         path: "children",
//         populate: { path: "class", select: "name section" }
//       });

//     if (!parent) {
//       return next(new ErrorHandler("Parent profile not found", 404));
//     }

//     res.status(200).json({
//       success: true,
//       children: parent.children || []
//     });

//   } catch (error) {
//     next(error);
//   }
// }));


// // ✅ Get child's results
// router.get("/my/children/results", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { term, year, childId } = req.query;

//     const parent = await Parent.findOne({ user: req.user._id });
//     if (!parent) {
//       return next(new ErrorHandler("Parent profile not found", 404));
//     }

//     // Verify the child belongs to this parent
//     if (childId && !parent.children.includes(childId)) {
//       return next(new ErrorHandler("Access denied to this child's data", 403));
//     }

//     const childrenIds = childId ? [childId] : parent.children;

//     let filter = { student: { $in: childrenIds } };
//     if (term) filter.term = term;
//     if (year) filter.year = parseInt(year);

//     const results = await Result.find(filter)
//       .populate('student', 'name rollNumber class')
//       .populate('exam', 'title totalMarks date')
//       .populate('subject', 'name code')
//       .sort({ 'exam.date': -1 });

//     // Calculate performance per child
//     const childPerformance = {};
//     childrenIds.forEach(childId => {
//       const childResults = results.filter(r => r.student._id.toString() === childId.toString());
//       const totalExams = childResults.length;
//       const totalMarks = childResults.reduce((sum, result) => sum + result.marksObtained, 0);
//       const averageMarks = totalExams > 0 ? totalMarks / totalExams : 0;

//       childPerformance[childId] = {
//         totalExams,
//         totalMarks,
//         averageMarks: Math.round(averageMarks * 100) / 100
//       };
//     });

//     res.status(200).json({
//       success: true,
//       results,
//       performance: childPerformance
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// // ✅ Update parent profile
// router.put("/my/profile", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { phone, address } = req.body;

//     const parent = await Parent.findOne({ user: req.user._id });
//     if (!parent) {
//       return next(new ErrorHandler("Parent profile not found", 404));
//     }

//     const updateData = {};
//     if (phone) updateData.phone = phone;
//     if (address) updateData.address = address;

//     const updatedParent = await Parent.findByIdAndUpdate(
//       parent._id,
//       updateData,
//       { new: true, runValidators: true }
//     ).populate("children", "name rollNumber class");

//     // Also update user phone if provided
//     if (phone) {
//       await User.findByIdAndUpdate(req.user._id, {
//         phoneNumber: phone
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Profile updated successfully",
//       parent: updatedParent
//     });

//   } catch (error) {
//     next(error);
//   }
// }));


// // ✅ Get parent's children payment information
// router.get("/my/children/payments", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { academicYear = new Date().getFullYear().toString() } = req.query;

//     // Find parent by user ID
//     const parent = await Parent.findOne({ user: req.user._id })
//       .populate({
//         path: "children",
//         select: "name rollNumber class email outstandingBalance",
//         populate: { path: "class", select: "name section" }
//       });

//     if (!parent) {
//       return next(new ErrorHandler("Parent profile not found", 404));
//     }

//     const childrenIds = parent.children.map(child => child._id);

//     // Get payments for all children
//     const payments = await Payment.find({
//       student: { $in: childrenIds },
//       academicYear
//     })
//       .populate('student', 'name rollNumber')
//       .populate('class', 'name')
//       .sort({ dueDate: -1, createdAt: -1 });

//     // Calculate payment summary for each child
//     const childrenWithPayments = parent.children.map(child => {
//       const childPayments = payments.filter(p => p.student._id.toString() === child._id.toString());

//       const totalDue = childPayments.reduce((sum, payment) => sum + payment.amount, 0);
//       const totalPaid = childPayments.reduce((sum, payment) => sum + payment.paidAmount, 0);
//       const outstanding = totalDue - totalPaid;

//       // Determine payment status
//       let paymentStatus = 'paid';
//       if (outstanding > 0) {
//         const hasOverdue = childPayments.some(p =>
//           p.status === 'overdue' ||
//           (p.dueDate && new Date(p.dueDate) < new Date() && p.status !== 'paid')
//         );
//         paymentStatus = hasOverdue ? 'overdue' : 'pending';
//       }

//       const hasPartial = childPayments.some(p => p.status === 'partial');
//       if (hasPartial && outstanding > 0) {
//         paymentStatus = 'partial';
//       }

//       // Get recent payments (last 3)
//       const recentPayments = childPayments
//         .filter(p => p.paidDate)
//         .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
//         .slice(0, 3)
//         .map(p => ({
//           feeType: p.feeType,
//           amount: p.paidAmount,
//           date: p.paidDate,
//           status: p.status,
//           receiptNumber: p.receiptNumber
//         }));

//       return {
//         _id: child._id,
//         name: child.name,
//         rollNumber: child.rollNumber,
//         class: child.class,
//         totalDue,
//         totalPaid,
//         outstanding,
//         paymentStatus,
//         recentPayments
//       };
//     });

//     // Calculate overall summary
//     const overallSummary = {
//       totalChildren: childrenWithPayments.length,
//       totalDue: childrenWithPayments.reduce((sum, child) => sum + child.totalDue, 0),
//       totalPaid: childrenWithPayments.reduce((sum, child) => sum + child.totalPaid, 0),
//       totalOutstanding: childrenWithPayments.reduce((sum, child) => sum + child.outstanding, 0),
//       childrenWithPendingPayments: childrenWithPayments.filter(child => child.outstanding > 0).length
//     };

//     overallSummary.collectionRate = overallSummary.totalDue > 0 ?
//       Math.round((overallSummary.totalPaid / overallSummary.totalDue) * 100) : 100;

//     res.status(200).json({
//       success: true,
//       academicYear,
//       children: childrenWithPayments,
//       summary: overallSummary
//     });

//   } catch (error) {
//     console.error('Error in parent payments:', error);
//     next(error);
//   }
// }));

// // ✅ Get detailed payment history for a specific child
// router.get("/my/children/:childId/payments", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { childId } = req.params;
//     const { academicYear = new Date().getFullYear().toString(), page = 1, limit = 10 } = req.query;

//     // Find parent and verify child belongs to parent
//     const parent = await Parent.findOne({ user: req.user._id });
//     if (!parent) {
//       return next(new ErrorHandler("Parent profile not found", 404));
//     }

//     if (!parent.children.includes(childId)) {
//       return next(new ErrorHandler("Access denied to this child's data", 403));
//     }

//     const skip = (page - 1) * limit;

//     // Get payment details for the specific child
//     const [payments, total] = await Promise.all([
//       Payment.find({
//         student: childId,
//         academicYear
//       })
//         .populate('class', 'name')
//         .populate('recordedBy', 'name')
//         .sort({ dueDate: -1, createdAt: -1 })
//         .skip(skip)
//         .limit(parseInt(limit)),

//       Payment.countDocuments({
//         student: childId,
//         academicYear
//       })
//     ]);

//     // Calculate summary for this child
//     const totalDue = payments.reduce((sum, payment) => sum + payment.amount, 0);
//     const totalPaid = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
//     const outstanding = totalDue - totalPaid;

//     // Get child info
//     const child = await Student.findById(childId)
//       .populate('class', 'name section')
//       .select('name rollNumber class');

//     res.status(200).json({
//       success: true,
//       child,
//       payments,
//       summary: {
//         totalDue,
//         totalPaid,
//         outstanding,
//         collectionRate: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 100
//       },
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(total / limit),
//         totalPayments: total,
//         hasNext: page * limit < total,
//         hasPrev: page > 1
//       }
//     });

//   } catch (error) {
//     console.error('Error in child payment details:', error);
//     next(error);
//   }
// }));

// // ✅ Download payment receipt
// router.get("/my/payments/:paymentId/receipt", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { paymentId } = req.params;

//     // Find payment
//     const payment = await Payment.findById(paymentId)
//       .populate('student', 'name rollNumber class')
//       .populate('class', 'name')
//       .populate('recordedBy', 'name');

//     if (!payment) {
//       return next(new ErrorHandler("Payment not found", 404));
//     }

//     // Verify the payment belongs to one of parent's children
//     const parent = await Parent.findOne({ user: req.user._id });
//     if (!parent) {
//       return next(new ErrorHandler("Parent profile not found", 404));
//     }

//     if (!parent.children.includes(payment.student._id)) {
//       return next(new ErrorHandler("Access denied to this payment", 403));
//     }

//     // For now, return payment data - you can integrate with PDF generation later
//     res.status(200).json({
//       success: true,
//       receipt: {
//         receiptNumber: payment.receiptNumber,
//         student: payment.student,
//         class: payment.class,
//         feeType: payment.feeType,
//         amount: payment.amount,
//         paidAmount: payment.paidAmount,
//         paidDate: payment.paidDate,
//         paymentMethod: payment.paymentMethod,
//         status: payment.status,
//         recordedBy: payment.recordedBy,
//         transactionId: payment.transactionId
//       }
//     });

//   } catch (error) {
//     console.error('Error generating receipt:', error);
//     next(error);
//   }
// }));

// // Update the parent dashboard to include payment information
// router.get("/my/dashboard", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     // Parent Info
//     const parent = await Parent.findOne({ user: req.user._id })
//       .populate("children", "name rollNumber class");

//     if (!parent) {
//       return next(new ErrorHandler("Parent profile not found", 404));
//     }

//     const childrenIds = parent.children.map(c => c._id);
//     const currentYear = new Date().getFullYear().toString();

//     /* -----------------------------------------------------
//      * 1. RECENT PAYMENTS (paid + partial only)
//      * ----------------------------------------------------- */
//     const recentPayments = await Payment.find({
//       student: { $in: childrenIds },
//       academicYear: currentYear,
//       status: { $in: ["paid", "partial"] },
//       isActive: true
//     })
//       .populate("student", "name rollNumber")
//       .populate("class", "name")
//       .sort({ paidDate: -1 })
//       .limit(5);

//     /* -----------------------------------------------------
//      * 2. PAYMENT SUMMARY (due + partial + paid)
//      * ----------------------------------------------------- */
//     const allPayments = await Payment.find({
//       student: { $in: childrenIds },
//       academicYear: currentYear,
//       status: { $in: ["paid", "partial", "due"] },
//       isActive: true
//     });

//     const totalDue = allPayments.reduce((sum, p) => sum + p.amount, 0);
//     const totalPaid = allPayments.reduce((sum, p) => sum + p.paidAmount, 0);
//     const totalOutstanding = totalDue - totalPaid;

//     const paymentSummary = {
//       totalDue,
//       totalPaid,
//       totalOutstanding,
//       collectionRate: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 100
//     };

//     /* -----------------------------------------------------
//      * 3. RECENT ATTENDANCE (last 30 days)
//      * ----------------------------------------------------- */
//     const last30 = new Date();
//     last30.setDate(last30.getDate() - 30);

//     const recentAttendance = await Attendance.find({
//       student: { $in: childrenIds },
//       date: { $gte: last30 }
//     })
//       .populate("student", "name")
//       .populate("subject", "name")
//       .populate("class", "name");


//     const childAttendanceStats = {};

//     for (const a of recentAttendance) {
//       const id = a.student._id.toString();

//       if (!childAttendanceStats[id]) {
//         childAttendanceStats[id] = {
//           totalRecords: 0,
//           presentRecords: 0,
//           lateRecords: 0,
//           halfDayRecords: 0
//         };
//       }

//       const stats = childAttendanceStats[id];

//       stats.totalRecords++;

//       if (a.status === "present") stats.presentRecords++;
//       if (a.status === "late") stats.lateRecords++;
//       if (a.status === "half_day") stats.halfDayRecords++;
//     }

//     // NOW compute weighted percentage
//     for (const id of Object.keys(childAttendanceStats)) {
//       const s = childAttendanceStats[id];

//       const weightedScore =
//         s.presentRecords +
//         s.lateRecords * 0.5 +
//         s.halfDayRecords * 0.5;

//       s.attendancePercentage =
//         s.totalRecords > 0
//           ? Math.round((weightedScore / s.totalRecords) * 100)
//           : 0;
//     }

//     /* -----------------------------------------------------
//      * 5. RECENT RESULTS (existing)
//      * ----------------------------------------------------- */
//     const recentResults = await Result.find({
//       student: { $in: childrenIds }
//     })
//       .populate("student", "name")
//       .populate("exam", "title")
//       .populate("subject", "name")
//       .sort({ createdAt: -1 })
//       .limit(5);

//     /* -----------------------------------------------------
//      * 6. Additional Stats
//      * ----------------------------------------------------- */
//     const totalChildren = parent.children.length;
//     const childrenWithClasses = parent.children.filter(c => c.class).length;

//     /* -----------------------------------------------------
//      * SEND RESPONSE
//      * ----------------------------------------------------- */
//     res.status(200).json({
//       success: true,
//       dashboard: {
//         parent: {
//           name: parent.name,
//           email: parent.email,
//           phone: parent.phone
//         },
//         children: parent.children,
//         statistics: {
//           totalChildren,
//           childrenWithClasses,
//           childAttendanceStats
//         },
//         payments: {
//           summary: paymentSummary,
//           recent: recentPayments
//         },
//         recentAttendance,
//         recentResults
//       }
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// // supports ?search=&page=&limit=
// // routes/parents.js - SIMPLER VERSION
// router.get('/', isAuthenticated, authorizeRoles('admin', 'teacher'), async (req, res, next) => {
//   try {
//     const { search = '', page = 1, limit = 10 } = req.query;
//     const q = {};

//     if (search && search.trim()) {
//       const s = search.trim();
//       // Search only by parent fields (simpler approach)
//       q.$or = [
//         { name: { $regex: s, $options: 'i' } },
//         { email: { $regex: s, $options: 'i' } },
//         { phone: { $regex: s, $options: 'i' } },
//         { address: { $regex: s, $options: 'i' } }
//       ];
//     }

//     const skip = (Number(page) - 1) * Number(limit);

//     const [total, parents] = await Promise.all([
//       Parent.countDocuments(q),
//       Parent.find(q)
//         .populate({
//           path: 'children',
//           select: 'name rollNumber class dateOfBirth gender contact email',
//           populate: {
//             path: 'class',
//             select: 'name'
//           }
//         })
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(Number(limit)),
//     ]);

//     res.status(200).json({
//       success: true,
//       docs: parents,
//       total,
//       page: Number(page),
//       pages: Math.ceil(total / Number(limit)),
//     });
//   } catch (err) {
//     next(err);
//   }
// });

// // GET /api/parents/:id
// router.get('/:id', isAuthenticated, authorizeRoles('admin', 'teacher'), async (req, res, next) => {
//   try {
//     const parent = await Parent.findById(req.params.id).populate('children', 'name rollNumber class');
//     if (!parent) return next(new ErrorHandler('Parent not found', 404));
//     res.json({ success: true, parent });
//   } catch (err) {
//     next(err);
//   }
// });

// // DELETE /api/parents/:id
// router.delete('/:id', isAuthenticated, authorizeRoles('admin', 'teacher'), async (req, res, next) => {
//   try {
//     const parent = await Parent.findById(req.params.id);
//     if (!parent) return next(new ErrorHandler('Parent not found', 404));

//     // remove user too (optional)
//     await User.findByIdAndDelete(parent.user).catch(() => { });
//     await Parent.findByIdAndDelete(req.params.id);

//     res.json({ success: true, message: 'Parent deleted' });
//   } catch (err) {
//     next(err);
//   }
// });

// module.exports = router;