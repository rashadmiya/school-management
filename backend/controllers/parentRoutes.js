const express = require("express");
const Parent = require("../models/Parent");
const Student = require("../models/Student");
const Payment = require("../financeSystem/models/Payment")
const Attendance = require("../models/Attendance");
const Result = require("../models/Result");
const Role = require("../models/Role");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/User");

const router = express.Router();

// ✅ Create Parent (Admin or Teacher) - Keep as requested
router.post("/create", isAuthenticated, authorizeRoles("admin", "teacher"), async (req, res, next) => {
  let user; // Declare for cleanup scope

  try {
    const { name, email, password = "123456", phone, children = [] } = req.body;

    // Validation
    if (!name || !email) {
      return next(new ErrorHandler("Name and email are required", 400));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorHandler("User with this email already exists", 400));
    }

    const parentRole = await Role.findOne({ name: "parent" });
    if (!parentRole) {
      return next(new ErrorHandler("Parent role not found. Please seed roles first.", 500));
    }

    // Validate children if provided
    if (children.length > 0) {
      const validChildren = await Student.countDocuments({ _id: { $in: children } });
      if (validChildren !== children.length) {
        return next(new ErrorHandler("One or more student IDs are invalid", 400));
      }
    }

    // const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with parent role
    user = await User.create({
      name,
      email,
      password,
      role: parentRole._id,
      phoneNumber: phone,
      isVerified: true, // ✅ No email activation needed
    });

    // Create parent profile
    const parent = await Parent.create({
      user: user._id,
      name,
      phone,
      email,
      children,
    });

    // Populate data for response
    const populatedUser = await User.findById(user._id)
      .populate('role', 'name')
      .select('-password');

    const populatedParent = await Parent.findById(parent._id)
      .populate('children', 'name rollNumber class');

    res.status(201).json({
      success: true,
      message: "Parent created successfully",
      user: populatedUser, // ✅ Consistent with login structure
      profile: populatedParent, // ✅ Consistent with login structure
      data: {
        user: populatedUser,
        parent: populatedParent
      },
    });

  } catch (error) {
    console.error("Parent creation error:", error);

    // Cleanup if creation fails
    if (user) {
      await User.findByIdAndDelete(user._id);
      await Parent.findOneAndDelete({ user: user._id });
    }

    if (error.code === 11000) {
      return next(new ErrorHandler("User with this email already exists", 400));
    }

    next(new ErrorHandler("Failed to create parent: " + error.message, 500));
  }
});


// 🎯 PARENT PORTAL ENDPOINTS

// ✅ Get parent's children (for parent portal)
router.get("/my/children", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    // Find parent by user ID
    const parent = await Parent.findOne({ user: req.user._id })
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


// ✅ Get child's results
router.get("/my/children/results", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { term, year, childId } = req.query;

    const parent = await Parent.findOne({ user: req.user._id });
    if (!parent) {
      return next(new ErrorHandler("Parent profile not found", 404));
    }

    // Verify the child belongs to this parent
    if (childId && !parent.children.includes(childId)) {
      return next(new ErrorHandler("Access denied to this child's data", 403));
    }

    const childrenIds = childId ? [childId] : parent.children;

    let filter = { student: { $in: childrenIds } };
    if (term) filter.term = term;
    if (year) filter.year = parseInt(year);

    const results = await Result.find(filter)
      .populate('student', 'name rollNumber class')
      .populate('exam', 'title totalMarks date')
      .populate('subject', 'name code')
      .sort({ 'exam.date': -1 });

    // Calculate performance per child
    const childPerformance = {};
    childrenIds.forEach(childId => {
      const childResults = results.filter(r => r.student._id.toString() === childId.toString());
      const totalExams = childResults.length;
      const totalMarks = childResults.reduce((sum, result) => sum + result.marksObtained, 0);
      const averageMarks = totalExams > 0 ? totalMarks / totalExams : 0;

      childPerformance[childId] = {
        totalExams,
        totalMarks,
        averageMarks: Math.round(averageMarks * 100) / 100
      };
    });

    res.status(200).json({
      success: true,
      results,
      performance: childPerformance
    });

  } catch (error) {
    next(error);
  }
}));

// ✅ Get parent dashboard data
// Update the parent dashboard route
// router.get("/my/dashboard", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const parent = await Parent.findOne({ user: req.user._id })
//       .populate("children", "name rollNumber class");

//     if (!parent) {
//       return next(new ErrorHandler("Parent profile not found", 404));
//     }

//     // Get recent attendance for all children (SUBJECT-BASED)
//     const recentAttendance = await Attendance.find({
//       student: { $in: parent.children },
//       date: { 
//         $gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
//       }
//     })
//       .populate('student', 'name')
//       .populate('subject', 'name') // Add subject population
//       .populate('class', 'name')
//       .sort({ date: -1, period: 1 })
//       .limit(10);

//     // Get recent results for all children
//     const recentResults = await Result.find({
//       student: { $in: parent.children }
//     })
//       .populate('student', 'name')
//       .populate('exam', 'title')
//       .populate('subject', 'name')
//       .sort({ createdAt: -1 })
//       .limit(5);

//     // Calculate attendance statistics per child
//     const childAttendanceStats = {};
//     for (const child of parent.children) {
//       const childAttendance = await Attendance.find({
//         student: child._id,
//         date: { 
//           $gte: new Date(new Date().setDate(new Date().getDate() - 30))
//         }
//       });

//       const totalRecords = childAttendance.length;
//       const presentRecords = childAttendance.filter(a => a.status === 'present').length;
//       const lateRecords = childAttendance.filter(a => a.status === 'late').length;
//       const halfDayRecords = childAttendance.filter(a => a.status === 'half_day').length;

//       const weightedScore = presentRecords + (lateRecords * 0.5) + (halfDayRecords * 0.5);
//       const attendancePercentage = totalRecords > 0 ? Math.round((weightedScore / totalRecords) * 100) : 0;

//       childAttendanceStats[child._id] = {
//         totalRecords,
//         presentRecords,
//         lateRecords,
//         halfDayRecords,
//         attendancePercentage
//       };
//     }

//     // Calculate overall statistics
//     const totalChildren = parent.children.length;
//     const childrenWithClasses = parent.children.filter(child => child.class).length;

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
//           childAttendanceStats // Add attendance statistics
//         },
//         recentAttendance,
//         recentResults
//       }
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// ✅ Update parent profile
router.put("/my/profile", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { phone, address } = req.body;

    const parent = await Parent.findOne({ user: req.user._id });
    if (!parent) {
      return next(new ErrorHandler("Parent profile not found", 404));
    }

    const updateData = {};
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const updatedParent = await Parent.findByIdAndUpdate(
      parent._id,
      updateData,
      { new: true, runValidators: true }
    ).populate("children", "name rollNumber class");

    // Also update user phone if provided
    if (phone) {
      await User.findByIdAndUpdate(req.user._id, {
        phoneNumber: phone
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      parent: updatedParent
    });

  } catch (error) {
    next(error);
  }
}));


// ✅ Get parent's children payment information
router.get("/my/children/payments", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { academicYear = new Date().getFullYear().toString() } = req.query;

    // Find parent by user ID
    const parent = await Parent.findOne({ user: req.user._id })
      .populate({
        path: "children",
        select: "name rollNumber class email outstandingBalance",
        populate: { path: "class", select: "name section" }
      });

    if (!parent) {
      return next(new ErrorHandler("Parent profile not found", 404));
    }

    const childrenIds = parent.children.map(child => child._id);

    // Get payments for all children
    const payments = await Payment.find({
      student: { $in: childrenIds },
      academicYear
    })
      .populate('student', 'name rollNumber')
      .populate('class', 'name')
      .sort({ dueDate: -1, createdAt: -1 });

    // Calculate payment summary for each child
    const childrenWithPayments = parent.children.map(child => {
      const childPayments = payments.filter(p => p.student._id.toString() === child._id.toString());

      const totalDue = childPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalPaid = childPayments.reduce((sum, payment) => sum + payment.paidAmount, 0);
      const outstanding = totalDue - totalPaid;

      // Determine payment status
      let paymentStatus = 'paid';
      if (outstanding > 0) {
        const hasOverdue = childPayments.some(p =>
          p.status === 'overdue' ||
          (p.dueDate && new Date(p.dueDate) < new Date() && p.status !== 'paid')
        );
        paymentStatus = hasOverdue ? 'overdue' : 'pending';
      }

      const hasPartial = childPayments.some(p => p.status === 'partial');
      if (hasPartial && outstanding > 0) {
        paymentStatus = 'partial';
      }

      // Get recent payments (last 3)
      const recentPayments = childPayments
        .filter(p => p.paidDate)
        .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
        .slice(0, 3)
        .map(p => ({
          feeType: p.feeType,
          amount: p.paidAmount,
          date: p.paidDate,
          status: p.status,
          receiptNumber: p.receiptNumber
        }));

      return {
        _id: child._id,
        name: child.name,
        rollNumber: child.rollNumber,
        class: child.class,
        totalDue,
        totalPaid,
        outstanding,
        paymentStatus,
        recentPayments
      };
    });

    // Calculate overall summary
    const overallSummary = {
      totalChildren: childrenWithPayments.length,
      totalDue: childrenWithPayments.reduce((sum, child) => sum + child.totalDue, 0),
      totalPaid: childrenWithPayments.reduce((sum, child) => sum + child.totalPaid, 0),
      totalOutstanding: childrenWithPayments.reduce((sum, child) => sum + child.outstanding, 0),
      childrenWithPendingPayments: childrenWithPayments.filter(child => child.outstanding > 0).length
    };

    overallSummary.collectionRate = overallSummary.totalDue > 0 ?
      Math.round((overallSummary.totalPaid / overallSummary.totalDue) * 100) : 100;

    res.status(200).json({
      success: true,
      academicYear,
      children: childrenWithPayments,
      summary: overallSummary
    });

  } catch (error) {
    console.error('Error in parent payments:', error);
    next(error);
  }
}));

// ✅ Get detailed payment history for a specific child
router.get("/my/children/:childId/payments", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { academicYear = new Date().getFullYear().toString(), page = 1, limit = 10 } = req.query;

    // Find parent and verify child belongs to parent
    const parent = await Parent.findOne({ user: req.user._id });
    if (!parent) {
      return next(new ErrorHandler("Parent profile not found", 404));
    }

    if (!parent.children.includes(childId)) {
      return next(new ErrorHandler("Access denied to this child's data", 403));
    }

    const skip = (page - 1) * limit;

    // Get payment details for the specific child
    const [payments, total] = await Promise.all([
      Payment.find({
        student: childId,
        academicYear
      })
        .populate('class', 'name')
        .populate('recordedBy', 'name')
        .sort({ dueDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),

      Payment.countDocuments({
        student: childId,
        academicYear
      })
    ]);

    // Calculate summary for this child
    const totalDue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const outstanding = totalDue - totalPaid;

    // Get child info
    const child = await Student.findById(childId)
      .populate('class', 'name section')
      .select('name rollNumber class');

    res.status(200).json({
      success: true,
      child,
      payments,
      summary: {
        totalDue,
        totalPaid,
        outstanding,
        collectionRate: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 100
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPayments: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error in child payment details:', error);
    next(error);
  }
}));

// ✅ Download payment receipt
router.get("/my/payments/:paymentId/receipt", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    // Find payment
    const payment = await Payment.findById(paymentId)
      .populate('student', 'name rollNumber class')
      .populate('class', 'name')
      .populate('recordedBy', 'name');

    if (!payment) {
      return next(new ErrorHandler("Payment not found", 404));
    }

    // Verify the payment belongs to one of parent's children
    const parent = await Parent.findOne({ user: req.user._id });
    if (!parent) {
      return next(new ErrorHandler("Parent profile not found", 404));
    }

    if (!parent.children.includes(payment.student._id)) {
      return next(new ErrorHandler("Access denied to this payment", 403));
    }

    // For now, return payment data - you can integrate with PDF generation later
    res.status(200).json({
      success: true,
      receipt: {
        receiptNumber: payment.receiptNumber,
        student: payment.student,
        class: payment.class,
        feeType: payment.feeType,
        amount: payment.amount,
        paidAmount: payment.paidAmount,
        paidDate: payment.paidDate,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        recordedBy: payment.recordedBy,
        transactionId: payment.transactionId
      }
    });

  } catch (error) {
    console.error('Error generating receipt:', error);
    next(error);
  }
}));

// Update the parent dashboard to include payment information
router.get("/my/dashboard", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    // Parent Info
    const parent = await Parent.findOne({ user: req.user._id })
      .populate("children", "name rollNumber class");

    if (!parent) {
      return next(new ErrorHandler("Parent profile not found", 404));
    }

    const childrenIds = parent.children.map(c => c._id);
    const currentYear = new Date().getFullYear().toString();

    /* -----------------------------------------------------
     * 1. RECENT PAYMENTS (paid + partial only)
     * ----------------------------------------------------- */
    const recentPayments = await Payment.find({
      student: { $in: childrenIds },
      academicYear: currentYear,
      status: { $in: ["paid", "partial"] },
      isActive: true
    })
      .populate("student", "name rollNumber")
      .populate("class", "name")
      .sort({ paidDate: -1 })
      .limit(5);

    /* -----------------------------------------------------
     * 2. PAYMENT SUMMARY (due + partial + paid)
     * ----------------------------------------------------- */
    const allPayments = await Payment.find({
      student: { $in: childrenIds },
      academicYear: currentYear,
      status: { $in: ["paid", "partial", "due"] },
      isActive: true
    });

    const totalDue = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = allPayments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalOutstanding = totalDue - totalPaid;

    const paymentSummary = {
      totalDue,
      totalPaid,
      totalOutstanding,
      collectionRate: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 100
    };

    /* -----------------------------------------------------
     * 3. RECENT ATTENDANCE (last 30 days)
     * ----------------------------------------------------- */
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);

    const recentAttendance = await Attendance.find({
      student: { $in: childrenIds },
      date: { $gte: last30 }
    })
      .populate("student", "name")
      .populate("subject", "name")
      .populate("class", "name");

    /* -----------------------------------------------------
     * 4. ATTENDANCE SUMMARY (optimized)
     * ----------------------------------------------------- */
    // const childAttendanceStats = {};

    // for (const a of recentAttendance) {
    //   const id = a.student._id.toString(); // FIXED HERE

    //   if (!childAttendanceStats[id]) {
    //     childAttendanceStats[id] = { total: 0, present: 0, late: 0, half: 0 };
    //   }

    //   childAttendanceStats[id].total++;

    //   if (a.status === "present") childAttendanceStats[id].present++;
    //   if (a.status === "late") childAttendanceStats[id].late++;
    //   if (a.status === "half_day") childAttendanceStats[id].half++;
    // }


    const childAttendanceStats = {};

    for (const a of recentAttendance) {
      const id = a.student._id.toString();

      if (!childAttendanceStats[id]) {
        childAttendanceStats[id] = {
          totalRecords: 0,
          presentRecords: 0,
          lateRecords: 0,
          halfDayRecords: 0
        };
      }

      const stats = childAttendanceStats[id];

      stats.totalRecords++;

      if (a.status === "present") stats.presentRecords++;
      if (a.status === "late") stats.lateRecords++;
      if (a.status === "half_day") stats.halfDayRecords++;
    }

    // NOW compute weighted percentage
    for (const id of Object.keys(childAttendanceStats)) {
      const s = childAttendanceStats[id];

      const weightedScore =
        s.presentRecords +
        s.lateRecords * 0.5 +
        s.halfDayRecords * 0.5;

      s.attendancePercentage =
        s.totalRecords > 0
          ? Math.round((weightedScore / s.totalRecords) * 100)
          : 0;
    }

    /* -----------------------------------------------------
     * 5. RECENT RESULTS (existing)
     * ----------------------------------------------------- */
    const recentResults = await Result.find({
      student: { $in: childrenIds }
    })
      .populate("student", "name")
      .populate("exam", "title")
      .populate("subject", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    /* -----------------------------------------------------
     * 6. Additional Stats
     * ----------------------------------------------------- */
    const totalChildren = parent.children.length;
    const childrenWithClasses = parent.children.filter(c => c.class).length;

    /* -----------------------------------------------------
     * SEND RESPONSE
     * ----------------------------------------------------- */
    res.status(200).json({
      success: true,
      dashboard: {
        parent: {
          name: parent.name,
          email: parent.email,
          phone: parent.phone
        },
        children: parent.children,
        statistics: {
          totalChildren,
          childrenWithClasses,
          childAttendanceStats
        },
        payments: {
          summary: paymentSummary,
          recent: recentPayments
        },
        recentAttendance,
        recentResults
      }
    });

  } catch (error) {
    next(error);
  }
}));

// supports ?search=&page=&limit=
// routes/parents.js - SIMPLER VERSION
router.get('/', isAuthenticated, authorizeRoles('admin', 'teacher'), async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const q = {};

    if (search && search.trim()) {
      const s = search.trim();
      // Search only by parent fields (simpler approach)
      q.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { address: { $regex: s, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [total, parents] = await Promise.all([
      Parent.countDocuments(q),
      Parent.find(q)
        .populate({
          path: 'children',
          select: 'name rollNumber class dateOfBirth gender contact email',
          populate: {
            path: 'class',
            select: 'name'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
    ]);

    res.status(200).json({
      success: true,
      docs: parents,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
});
// router.get('/', isAuthenticated, authorizeRoles('admin', 'teacher'), async (req, res, next) => {
//   try {
//     const { search = '', page = 1, limit = 10 } = req.query;
//     const q = {};

//     if (search && search.trim()) {
//       const s = search.trim();
//       // search by name, email, phone, or child name/roll
//       q.$or = [
//         { name: { $regex: s, $options: 'i' } },
//         { email: { $regex: s, $options: 'i' } },
//         { phone: { $regex: s, $options: 'i' } },
//       ];
//     }

//     const skip = (Number(page) - 1) * Number(limit);

//     const [total, parents] = await Promise.all([
//       Parent.countDocuments(q),
//       Parent.find(q)
//         .populate({ path: 'children', select: 'name rollNumber class' })
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

// GET /api/parents/:id
router.get('/:id', isAuthenticated, authorizeRoles('admin', 'teacher'), async (req, res, next) => {
  try {
    const parent = await Parent.findById(req.params.id).populate('children', 'name rollNumber class');
    if (!parent) return next(new ErrorHandler('Parent not found', 404));
    res.json({ success: true, parent });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/parents/:id
router.delete('/:id', isAuthenticated, authorizeRoles('admin', 'teacher'), async (req, res, next) => {
  try {
    const parent = await Parent.findById(req.params.id);
    if (!parent) return next(new ErrorHandler('Parent not found', 404));

    // remove user too (optional)
    await User.findByIdAndDelete(parent.user).catch(() => { });
    await Parent.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Parent deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;