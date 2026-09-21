const express = require("express");
const ParentService = require('../services/ParentService');
const mongoose = require('mongoose');

const fs = require("fs")
const Student = require("../models/Student");
const Parent = require("../models/Parent");
const Assignment = require("../models/Assignment");
const Exam = require("../models/Exam");
const Attendance = require("../models/Attendance");
const Payment = require("../financeSystem/models/Payment")
const Result = require("../models/Result");
const Routine = require("../models/Routine");
const ErrorHandler = require("../utils/ErrorHandler");
const sendStudentToken = require("../utils/studentJwtToken");
const { isAuthenticated, authorizeRoles, isStudentAuthenticated } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const Class = require("../models/Class");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const { upload } = require("../multer");
const path = require("path");
const StudentFinanceSummaryService = require("../services/StudentFinanceSummaryService");
const BillService = require("../financeSystem/services/BillService");
const PaymentService = require("../services/PaymentService");
const FeeService = require("../services/FeeService");
const { getCurrentSession } = require("../utils/accademicSession");

const router = express.Router();


/* ============================================================
 *  STUDENT CREATION
 * ============================================================ */

// Helper — handles parent linking/creation for both create routes.
async function resolveParent({ parentId, guardianContact, fathersName, mothersName, email, altPhone, address }, studentId) {
  if (parentId) {
    const parent = await ParentService.linkExisting(parentId, studentId);
    return { parent, tempPin: null };
  }
  if (guardianContact) {
    return await ParentService.attachToStudent(
      {
        phone: guardianContact,
        name: fathersName || mothersName || 'Guardian',
        email,
        altPhone,
        address,
      },
      studentId
    );
  }
  return { parent: null, tempPin: null };
}


// ==================== STUDENT CREATION ENDPOINTS ====================

// ✅ OPTION 1: Create Student WITHOUT Photo
router.post(
  "/register",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  async (req, res, next) => {
    try {
      const {
        name, rollNumber, password = "123456", classId, parentId,
        gender, session, birthRegNo, fathersName, mothersName,
        guardianContact, religion,
        isPhysicallyDisabled = false, disabilityDescription,
        lastExamResult, dateOfBirth,
        feeCategory = 'regular', transportRoute,
        financialNotes,
      } = req.body;

      if (!session) return next(new ErrorHandler("Session is required", 400));

      const existing = await Student.findOne({ rollNumber });
      if (existing) return next(new ErrorHandler("Roll number already exists", 400));

      if (classId) {
        const classExists = await Class.findById(classId);
        if (!classExists) return next(new ErrorHandler("Class not found", 404));
      }

      let formattedLastExamResult = null;
      if (lastExamResult) {
        formattedLastExamResult = {
          examName: lastExamResult.examName || '',
          achievedMarks: lastExamResult.achievedMarks || '',
          totalMarks: lastExamResult.totalMarks || '',
        };
      }

      // Create student WITHOUT parent (ParentService will set it)
      const student = await Student.create({
        name, rollNumber, password,
        class: classId || null,
        parent: null,
        gender, session, birthRegNo, fathersName, mothersName,
        guardianContact, religion,
        isPhysicallyDisabled,
        disabilityDescription: isPhysicallyDisabled ? disabilityDescription : '',
        lastExamResult: formattedLastExamResult,
        dateOfBirth, feeCategory, transportRoute,
        financialNotes,
        isStudent: true,
      });

      if (classId) {
        await Class.findByIdAndUpdate(
          classId,
          { $addToSet: { students: student._id } },
          { new: true }
        );
      }

      // Resolve parent (link existing or auto-create)
      const { parent, tempPin } = await resolveParent(
        { parentId, guardianContact, fathersName, mothersName },
        student._id
      );

      const populated = await Student.findById(student._id)
        .populate('class', 'name section')
        .populate('parent', 'name phone email')
        .populate('grade', 'name level')
        .select('-password');

      const token = student.getJwtToken();

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        token,
        student: populated,
        studentId: student._id,
        hasParent: !!parent,
        parent: parent ? {
          _id: parent._id,
          name: parent.name,
          phone: parent.phone,
        } : null,
        // Plaintext temp PIN — show ONCE to admin, relay to parent
        tempPin,
      });
    } catch (error) {
      console.error("Student registration error:", error);
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(v => v.message);
        return next(new ErrorHandler(messages.join(', '), 400));
      }
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return next(new ErrorHandler(`${field} already exists`, 400));
      }
      next(error);
    }
  }
);

// ✅ OPTION 2: Create Student WITH Photo
router.post(
  "/register-with-photo",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  upload.single('photo'),
  async (req, res, next) => {
    try {
      const {
        name, rollNumber, password = "123456", classId, parentId,
        gender, session, birthRegNo, fathersName, mothersName,
        guardianContact, religion,
        isPhysicallyDisabled = "false", disabilityDescription,
        lastExamResult, dateOfBirth,
        feeCategory = 'regular', transportRoute,
        financialNotes,
      } = req.body;

      const cleanedParentId = parentId && parentId.trim() !== "" && parentId !== "undefined"
        ? parentId : null;

      const parsedIsPhysicallyDisabled = isPhysicallyDisabled === 'true';

      if (!session) {
        if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return next(new ErrorHandler("Session is required", 400));
      }

      let photoPath = null;
      if (req.file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          return next(new ErrorHandler("Please upload a valid image (JPEG, PNG, WebP)", 400));
        }
        if (req.file.size > 5 * 1024 * 1024) {
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          return next(new ErrorHandler("Image size should be less than 5MB", 400));
        }
        photoPath = `/uploads/avatars/students/${req.file.filename}`;
      }

      const existing = await Student.findOne({ rollNumber });
      if (existing) {
        if (photoPath && fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
        return next(new ErrorHandler("Roll number already exists", 400));
      }

      if (classId) {
        const classExists = await Class.findById(classId);
        if (!classExists) {
          if (photoPath && fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
          return next(new ErrorHandler("Class not found", 404));
        }
      }

      let formattedLastExamResult = null;
      if (lastExamResult) {
        try {
          const parsed = typeof lastExamResult === 'string'
            ? JSON.parse(lastExamResult) : lastExamResult;
          formattedLastExamResult = {
            examName: parsed.examName || '',
            achievedMarks: parsed.achievedMarks || '',
            totalMarks: parsed.totalMarks || '',
          };
        } catch { formattedLastExamResult = null; }
      }

      const studentData = {
        name, rollNumber, password,
        class: classId || null,
        parent: null,
        gender, session, birthRegNo, fathersName, mothersName,
        guardianContact, religion,
        isPhysicallyDisabled: parsedIsPhysicallyDisabled,
        disabilityDescription: parsedIsPhysicallyDisabled ? disabilityDescription : '',
        lastExamResult: formattedLastExamResult,
        photo: photoPath,
        dateOfBirth, feeCategory, transportRoute, financialNotes,
        isStudent: true,
      };
      Object.keys(studentData).forEach(k => {
        if (studentData[k] === null || studentData[k] === undefined) delete studentData[k];
      });

      const student = await Student.create(studentData);

      if (classId) {
        await Class.findByIdAndUpdate(
          classId,
          { $addToSet: { students: student._id } },
          { new: true }
        );
      }

      const { parent, tempPin } = await resolveParent(
        {
          parentId: cleanedParentId,
          guardianContact,
          fathersName,
          mothersName,
        },
        student._id
      );

      const populated = await Student.findById(student._id)
        .populate('class', 'name section')
        .populate('parent', 'name phone email')
        .populate('grade', 'name level')
        .select('-password');

      const token = student.getJwtToken();

      res.status(201).json({
        success: true,
        message: photoPath
          ? "Student created successfully with photo"
          : "Student created successfully without photo",
        token,
        student: populated,
        studentId: student._id,
        hasPhoto: !!photoPath,
        photoUrl: photoPath ? `/uploads/${path.basename(photoPath)}` : null,
        hasParent: !!parent,
        parent: parent ? {
          _id: parent._id,
          name: parent.name,
          phone: parent.phone,
        } : null,
        tempPin,
      });

    } catch (error) {
      console.error("Student registration with photo error:", error);
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(v => v.message);
        return next(new ErrorHandler(messages.join(', '), 400));
      }
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return next(new ErrorHandler(`${field} already exists`, 400));
      }
      if (error.name === 'CastError') {
        return next(new ErrorHandler(`Invalid ${error.path}: ${error.value}`, 400));
      }
      next(error);
    }
  }
);

// ✅ OPTION 3: Upload/Update Student Photo (Standalone)
router.post("/:id/photo",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  upload.single('photo'),
  catchAsyncErrors(async (req, res, next) => {
    try {
      if (!req.file) {
        return next(new ErrorHandler("Please upload a photo", 400));
      }

      // Validate file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return next(new ErrorHandler("Please upload a valid image (JPEG, PNG, WebP)", 400));
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        return next(new ErrorHandler("Image size should be less than 5MB", 400));
      }

      const studentId = req.params.id;
      // Check if student exists
      const student = await Student.findById(studentId);
      if (!student) {
        // Delete uploaded file if student not found
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return next(new ErrorHandler("Student not found", 404));
      }

      // Delete old photo if exists (optional cleanup)
      if (student.photo && fs.existsSync(student.photo)) {
        try {
          fs.unlinkSync(student.photo);
        } catch (unlinkError) {
          console.warn("Could not delete old photo:", unlinkError.message);
        }
      }

      // Update student photo
      // student.photo = req.file.path || req.file.filename;
      const relativePath = `/uploads/avatars/students/${req.file.filename}`;
      student.photo = relativePath;
      await student.save();

      res.status(200).json({
        success: true,
        message: "Student photo uploaded successfully",
        photo: student.photo,
        photoUrl: `/uploads/${path.basename(student.photo)}`,
        student: {
          _id: student._id,
          name: student.name,
          rollNumber: student.rollNumber
        }
      });

    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  })
);

// ✅ OPTION 4: Remove Student Photo
router.delete("/:id/photo",
  isAuthenticated, authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    const student = await Student.findById(req.params.id);
    if (!student) return next(new ErrorHandler("Student not found", 404));
    if (!student.photo) return next(new ErrorHandler("Student does not have a photo", 400));

    if (fs.existsSync(student.photo)) {
      try { fs.unlinkSync(student.photo); } catch (e) { console.warn(e.message); }
    }
    student.photo = null;
    await student.save();
    res.json({ success: true, message: "Student photo removed successfully" });
  })
);

// ✅ Update Student (without photo) - Updated
router.put("/update/:id",
  isAuthenticated, authorizeRoles("admin", "teacher"),
  async (req, res, next) => {
    try {
      const {
        name, rollNumber, password,
        guardianContact, gender, dateOfBirth,
        classId, gradeId, parentId, session,
        birthRegNo, fathersName, mothersName, religion,
        isPhysicallyDisabled, disabilityDescription, lastExamResult,
        feeCategory, transportRoute, financialNotes,
      } = req.body;

      const student = await Student.findById(req.params.id);
      if (!student) return next(new ErrorHandler("Student not found", 404));

      if (rollNumber && rollNumber !== student.rollNumber) {
        const existing = await Student.findOne({ rollNumber });
        if (existing) return next(new ErrorHandler("Roll number already exists", 400));
      }

      const oldParentId = student.parent ? String(student.parent) : null;
      const oldClassId = student.class ? String(student.class) : null;

      // --- scalar fields ---
      if (name) student.name = name;
      if (rollNumber) student.rollNumber = rollNumber;
      if (guardianContact) student.guardianContact = guardianContact;
      if (gender) student.gender = gender;
      if (dateOfBirth) student.dateOfBirth = dateOfBirth;
      if (classId) student.class = classId;
      if (gradeId) student.grade = gradeId;
      if (password) student.password = password;
      if (session) student.session = session;
      if (birthRegNo !== undefined) student.birthRegNo = birthRegNo;
      if (fathersName !== undefined) student.fathersName = fathersName;
      if (mothersName !== undefined) student.mothersName = mothersName;
      if (religion !== undefined) student.religion = religion;
      if (isPhysicallyDisabled !== undefined) {
        student.isPhysicallyDisabled = isPhysicallyDisabled;
        if (!isPhysicallyDisabled) student.disabilityDescription = '';
      }
      if (disabilityDescription !== undefined) {
        student.disabilityDescription = disabilityDescription;
      }
      if (lastExamResult) {
        student.lastExamResult = {
          examName: lastExamResult.examName || '',
          achievedMarks: lastExamResult.achievedMarks || '',
          totalMarks: lastExamResult.totalMarks || '',
        };
      }
      if (feeCategory) student.feeCategory = feeCategory;
      if (transportRoute !== undefined) student.transportRoute = transportRoute;
      if (financialNotes !== undefined) student.financialNotes = financialNotes;

      // --- parent change ---
      let tempPin = null;
      let linkedParent = null;

      if (parentId !== undefined) {
        const newParentId = parentId || null;

        if (newParentId !== oldParentId) {
          // Detach from old
          if (oldParentId) {
            await Parent.findByIdAndUpdate(oldParentId, { $pull: { children: student._id } });
          }

          if (newParentId) {
            linkedParent = await ParentService.linkExisting(newParentId, student._id);
          } else if (guardianContact || student.guardianContact) {
            // No explicit parent pick — attach by phone (may create new)
            const r = await ParentService.attachToStudent(
              {
                phone: guardianContact || student.guardianContact,
                name: fathersName || mothersName || 'Guardian',
              },
              student._id
            );
            linkedParent = r.parent;
            tempPin = r.tempPin;
          } else {
            student.parent = null;
          }
        }
      }

      // --- class change ---
      if (classId && classId !== oldClassId) {
        if (oldClassId) {
          await Class.findByIdAndUpdate(oldClassId, { $pull: { students: student._id } });
        }
        await Class.findByIdAndUpdate(classId, { $addToSet: { students: student._id } });
      }

      await student.save();

      const updated = await Student.findById(student._id)
        .populate('class', 'name section')
        .populate('parent', 'name phone email')
        .populate('grade', 'name level')
        .select('-password');

      res.json({
        success: true,
        message: "Student updated successfully",
        student: updated,
        tempPin, // non-null only when a new parent was auto-created
      });
    } catch (error) {
      console.error("Student update error:", error);
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(v => v.message);
        return next(new ErrorHandler(messages.join(', '), 400));
      }
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return next(new ErrorHandler(`${field} already exists`, 400));
      }
      next(error);
    }
  }
);

// ✅ Login student
router.post("/login", async (req, res, next) => {
  try {
    const { rollNumber, password } = req.body;
    if (!rollNumber || !password)
      return next(new ErrorHandler("Please provide roll number and password", 400));

    const student = await Student.findOne({ rollNumber }).select("+password");
    if (!student) return next(new ErrorHandler("Invalid credentials", 400));

    const isMatch = await student.comparePassword(password);
    if (!isMatch) return next(new ErrorHandler("Invalid credentials", 400));

    sendStudentToken(student, 200, res);
  } catch (error) {
    next(error);
  }
});

router.get("/me",
  isStudentAuthenticated,
  catchAsyncErrors(async (req, res) => {
    const session = getCurrentSession();

    const student = await Student.findById(req.user._id)
      .populate('class', 'name section academicYear supervisor')
      .populate('grade', 'name gradePoint')
      .populate('parent', 'name phone email')
      .select('-password');

    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const [summary, attendance] = await Promise.all([
      StudentFinanceSummaryService.getSummary(student._id, session),
      Attendance.find({ student: student._id })
        .sort({ date: -1 })
        .limit(5)
        .populate('subject', 'name')
        .lean(),
    ]);

    res.json({
      success: true,
      token: req.token,
      user: {
        ...student.toObject(),
        photoUrl: student.photo ? `/uploads/${path.basename(student.photo)}` : null,
        hasPhoto: !!student.photo,
        role: { name: "student" },
        isStudent: true,
      },
      dashboard: {
        financeSummary: summary ? {
          totalFee: summary.totalFee?.toString() || '0',
          totalPaid: summary.totalPaid?.toString() || '0',
          advanceBalance: summary.advanceBalance?.toString() || '0',
          dueBalance: summary.dueBalance?.toString() || '0',
          status: summary.status || 'clear',
        } : null,
        attendance,
      },
    });
  })
);


router.get("/refresh", async (req, res, next) => {
  try {
    const oldRefresh = req.cookies.student_refreshToken;
    if (!oldRefresh) return next(new ErrorHandler("Refresh token not found", 403));

    jwt.verify(oldRefresh, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return next(new ErrorHandler("Invalid refresh token", 403));

      const newAccess = jwt.sign({ id: decoded.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
      const newRefresh = jwt.sign({ id: decoded.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

      res.cookie("student_token", newAccess, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("student_refreshToken", newRefresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json({ success: true, message: "Student token refreshed" });
    });
  } catch (err) { next(err); }
});

router.post("/logout", (req, res) => {
  res
    .cookie("student_token", "", { expires: new Date(0), httpOnly: true })
    .cookie("student_refreshToken", "", { expires: new Date(0), httpOnly: true })
    .json({ success: true, message: "Student logged out" });
});

router.get("/my/assignments", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const student = await Student.findById(req.user._id).populate('class');
    if (!student?.class) return res.json({ success: true, assignments: [] });

    const assignments = await Assignment.aggregate([
      { $match: { class: student.class._id, dueDate: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $lookup: {
          from: "assignmentsubmissions",
          let: { assignmentId: "$_id" },
          pipeline: [{
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$assignment", "$$assignmentId"] },
                  { $eq: ["$student", student._id] },
                ],
              },
            },
          }],
          as: "submission",
        },
      },
      {
        $addFields: {
          submission: { $ifNull: ["$submission", []] },
          submitted: { $gt: [{ $size: { $ifNull: ["$submission", []] } }, 0] },
        },
      },
      {
        $project: {
          title: 1, description: 1, class: 1, subject: 1, dueDate: 1, createdAt: 1,
          submitted: 1,
          submission: { $arrayElemAt: ["$submission", 0] },
          status: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$submission", []] } }, 0] },
              "submitted",
              { $cond: [{ $lt: ["$dueDate", new Date()] }, "overdue", "pending"] },
            ],
          },
        },
      },
      { $sort: { dueDate: 1 } },
    ]);

    await Assignment.populate(assignments, [
      { path: 'class', select: 'name' },
      { path: 'subject', select: 'name code' },
      { path: 'createdBy', select: 'name' },
    ]);

    res.json({ success: true, assignments });
  } catch (error) { next(error); }
}));

router.get("/my/exams", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  const student = await Student.findById(req.user._id).populate('class');
  if (!student || !student.class) return res.json({ success: true, exams: [] });

  const exams = await Exam.find({ class: student.class._id })
    .populate('class', 'name section')
    .populate('subject', 'name code')
    .populate('createdBy', 'name')
    .sort({ date: 1, startTime: 1 });

  res.json({ success: true, exams });
}));

router.get("/my/results", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  const { term, year } = req.query;
  const filter = { student: req.user._id };
  if (term) filter.term = term;
  if (year) filter.year = parseInt(year);

  const results = await Result.find(filter)
    .populate('exam', 'title totalMarks date')
    .populate('subject', 'name code')
    .sort({ 'exam.date': -1 });

  const totalExams = results.length;
  const totalMarks = results.reduce((s, r) => s + r.marksObtained, 0);
  const averageMarks = totalExams > 0 ? totalMarks / totalExams : 0;

  const termResults = {};
  results.forEach(r => {
    const key = `${r.term}-${r.year}`;
    if (!termResults[key]) termResults[key] = [];
    termResults[key].push(r);
  });

  res.json({
    success: true,
    results,
    statistics: { totalExams, totalMarks, averageMarks: Math.round(averageMarks * 100) / 100 },
    termResults,
  });
}));

router.get("/my/routines", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  const student = await Student.findById(req.user._id).populate('class');
  if (!student || !student.class) return res.json({ success: true, routines: [] });

  const routines = await Routine.find({ class: student.class._id })
    .populate('class', 'name section')
    .populate('subject', 'name code')
    .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
    .sort({ day: 1, startTime: 1 });

  res.json({ success: true, routines });
}));

// 🎯 Get today's routines for student
router.get("/my/routines/today", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const student = await Student.findById(req.user._id).populate('class');

    if (!student || !student.class) {
      return res.status(200).json({
        success: true,
        routines: []
      });
    }

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];

    const routines = await Routine.find({
      class: student.class._id,
      day: today
    })
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      day: today,
      routines
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get student's class information
router.get("/my/class", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const student = await Student.findById(req.user._id)
      .populate('class', 'name section supervisor')
      .populate({
        path: 'class',
        populate: { path: 'supervisor', select: 'name email' }
      });

    if (!student || !student.class) {
      return next(new ErrorHandler("Student not assigned to any class", 404));
    }

    res.status(200).json({
      success: true,
      class: student.class
    });

  } catch (error) {
    next(error);
  }
}));

// ✅ Get student's payment information
router.get("/my/finance", isStudentAuthenticated, catchAsyncErrors(async (req, res) => {
  const session = req.query.session || getCurrentSession();
  const studentId = req.user._id;

  const [summary, bills, payments, advance, fees] = await Promise.all([
    StudentFinanceSummaryService.getSummary(studentId, session),
    BillService.getMonthlyBills(studentId, session),
    PaymentService.getPaymentHistory(studentId, session, 30),
    PaymentService.getStudentAdvanceBalance(studentId, session),
    FeeService.getStudentFees(studentId, session),
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

router.get("/my/dashboard", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  const studentId = req.user._id;
  const session = getCurrentSession();

  const student = await Student.findById(studentId)
    .populate('class', 'name section')
    .select('name rollNumber class email photo');

  if (!student) return next(new ErrorHandler("Student profile not found", 404));

  const [summary, bills, payments, recentAttendance, recentResults] = await Promise.all([
    StudentFinanceSummaryService.getSummary(studentId, session),
    BillService.getMonthlyBills(studentId, session),
    PaymentService.getPaymentHistory(studentId, session, 3),
    Attendance.find({
      student: studentId,
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })
      .populate('subject', 'name')
      .populate('class', 'name')
      .sort({ date: -1, period: 1 })
      .limit(10)
      .lean(),
    Result.find({ student: studentId })
      .populate('exam', 'title')
      .populate('subject', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const attendanceStats = {
    totalRecords: recentAttendance.length,
    presentRecords: recentAttendance.filter(a => a.status === 'present').length,
    lateRecords: recentAttendance.filter(a => a.status === 'late').length,
    halfDayRecords: recentAttendance.filter(a => a.status === 'half_day').length,
  };
  const weightedScore = attendanceStats.presentRecords
    + attendanceStats.lateRecords * 0.5
    + attendanceStats.halfDayRecords * 0.5;
  attendanceStats.attendancePercentage = attendanceStats.totalRecords > 0
    ? Math.round((weightedScore / attendanceStats.totalRecords) * 100) : 0;

  // Today's assignments
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const todayAssignments = await Assignment.find({
    class: student.class?._id,
    dueDate: { $gte: todayStart, $lt: todayEnd },
  })
    .populate('subject', 'name')
    .populate('class', 'name')
    .limit(5)
    .lean();

  res.json({
    success: true,
    dashboard: {
      student: {
        ...student.toObject(),
        photoUrl: student.photo ? `/uploads/${path.basename(student.photo)}` : null,
      },
      session,
      payments: {
        summary: summary ? {
          totalFee: summary.totalFee?.toString() || '0',
          totalPaid: summary.totalPaid?.toString() || '0',
          totalOutstanding: summary.dueBalance?.toString() || '0',
          advanceBalance: summary.advanceBalance?.toString() || '0',
          status: summary.status || 'clear',
        } : {
          totalFee: '0', totalPaid: '0', totalOutstanding: '0',
          advanceBalance: '0', status: 'clear',
        },
        recentBills: bills.slice(0, 3),
        recentPayments: payments.map(p => ({
          _id: p._id,
          receiptNumber: p.receiptNumber,
          amount: p.amount.toString(),
          method: p.method,
          status: p.status,
          createdAt: p.createdAt,
        })),
      },
      attendance: {
        stats: attendanceStats,
        recent: recentAttendance,
      },
      assignments: { today: todayAssignments },
      results: recentResults,
    },
  });
}));

//end student payments endpoints

// 🎯 Update student profile (for students themselves) - UPDATED
router.put("/profile/update",
  isStudentAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        name,
        guardianContact,
        dateOfBirth,
        gender,
        religion,
        disabilityDescription,
        address // New field
      } = req.body;

      const studentId = req.user._id;

      // 1️⃣ Get existing student data first
      const existingStudent = await Student.findById(studentId).select("class");

      if (!existingStudent) {
        return next(new ErrorHandler("Student not found", 404));
      }

      // Students can only update specific fields
      const updateData = {};
      if (name) updateData.name = name;
      if (guardianContact) updateData.guardianContact = guardianContact;
      if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
      if (gender) updateData.gender = gender;
      if (religion) updateData.religion = religion;
      if (address) updateData.address = address;

      // Only allow disability description update if student is marked as disabled
      if (disabilityDescription && existingStudent.isPhysicallyDisabled) {
        updateData.disabilityDescription = disabilityDescription;
      }

      // Note: Students cannot change class, session, parent info, exam results, or photo

      // 2️⃣ Update student profile
      const updatedStudent = await Student.findByIdAndUpdate(
        studentId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("class", "name section")
        .populate("grade", "name")
        .populate("parent", "name email")
        .select("-password");

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: updatedStudent,
      });
    } catch (error) {
      next(error);
    }
  })
);

// Submit assignment
router.post("/assignments/:id/submit",
  isStudentAuthenticated,
  upload.array('files', 5), // Handle file uploads
  catchAsyncErrors(async (req, res, next) => {
    const { content } = req.body;
    console.log("submit assignment called")

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return next(new ErrorHandler("Assignment not found", 404));
    }

    const submission = await AssignmentSubmission.create({
      assignment: req.params.id,
      student: req.user._id,
      content,
      grade: { maxScore: assignment.mark },
      files: req.files?.map(file => ({
        filename: file.originalname,
        url: file.path,
        size: file.size,
        mimetype: file.mimetype
      })),
      status: new Date() > assignment.dueDate ? "late" : "submitted"
    });

    res.status(201).json({ success: true, submission });
  })
);

// Get submission details
router.get("/assignments/:id/submission",
  isStudentAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const submission = await AssignmentSubmission.findOne({
      assignment: req.params.id,
      student: req.user._id
    }).populate('assignment');

    res.json({ success: true, submission });
  })
);

router.get("/by-class/:classId",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  async (req, res) => {
    try {
      const students = await Student.find({ class: req.params.classId })
        .populate('class', 'name')
        .populate('parent', 'name')
        .select("name rollNumber guardianContact photo")
        .sort({ rollNumber: 1 });

      // Add photo URL
      const enrichedStudents = students.map(student => ({
        ...student.toObject(),
        photoUrl: student.photo ? `/uploads/${path.basename(student.photo)}` : null,
        hasPhoto: !!student.photo
      }));

      res.json({
        success: true,
        students: enrichedStudents,
      });

    } catch (error) {
      console.log("Error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);
// ✅ Get all students with search and filters - UPDATED
router.get("/all",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    const {
      search = "",
      session,
      religion,
      classId,
      isPhysicallyDisabled,
      gender,
      hasPhoto, // New filter: students with/without photos
      page = 1,
      limit = 20
    } = req.query;

    // Build dynamic query
    const query = {};

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
        { fathersName: { $regex: search, $options: "i" } },
        { mothersName: { $regex: search, $options: "i" } },
        { guardianContact: { $regex: search, $options: "i" } }
      ];
    }

    // Filter by session
    if (session) {
      query.session = session;
    }

    // Filter by religion
    if (religion) {
      query.religion = { $regex: religion, $options: "i" };
    }

    // Filter by class
    if (classId) {
      query.class = classId;
    }

    // Filter by disability status
    if (isPhysicallyDisabled !== undefined) {
      query.isPhysicallyDisabled = isPhysicallyDisabled === 'true';
    }

    // Filter by gender
    if (gender) {
      query.gender = gender;
    }

    // Filter by photo status
    if (hasPhoto !== undefined) {
      if (hasPhoto === 'true') {
        query.photo = { $exists: true, $ne: null };
      } else if (hasPhoto === 'false') {
        query.$or = [
          { photo: { $exists: false } },
          { photo: null },
          { photo: '' }
        ];
      }
    }

    const total = await Student.countDocuments(query);

    const students = await Student.find(query)
      .populate("class", "name section")
      .populate("grade", "name")
      .populate("parent", "name email")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    // Add photo URL to each student
    const enrichedStudents = students.map(student => ({
      ...student.toObject(),
      photoUrl: student.photo ? `/uploads/${path.basename(student.photo)}` : null,
      hasPhoto: !!student.photo
    }));

    // Get statistics
    const withPhotoCount = await Student.countDocuments({ photo: { $exists: true, $ne: null } });
    const withoutPhotoCount = await Student.countDocuments({
      $or: [
        { photo: { $exists: false } },
        { photo: null },
        { photo: '' }
      ]
    });

    res.status(200).json({
      success: true,
      docs: enrichedStudents,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
      statistics: {
        totalStudents: total,
        withPhoto: withPhotoCount,
        withoutPhoto: withoutPhotoCount,
        photoCoverage: total > 0 ? Math.round((withPhotoCount / total) * 100) : 0
      }
    });
  })
);
router.delete("/delete/:id", isAuthenticated, authorizeRoles("admin", "teacher"), async (req, res, next) => {
  try {
    console.log("delete called")
    const studentId = req.params.id;

    const student = await Student.findById(studentId);
    if (!student) return next(new ErrorHandler("Student not found", 404));

    // Remove student from parent's children array
    await Parent.findByIdAndUpdate(
      student.parent,
      { $pull: { children: studentId } }
    );

    // Remove student from class
    if (student.class) {
      await Class.findByIdAndUpdate(
        student.class,
        { $pull: { students: studentId } }
      );
    }

    // Delete the student
    await Student.findByIdAndDelete(studentId);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully"
    });
  } catch (error) {
    next(error);
  }
});

// ✅ Get students by session - NEW ENDPOINT
router.get("/by-session/:session",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { session } = req.params;
      const { classId, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      // Build query
      const query = { session };
      if (classId) {
        query.class = classId;
      }

      const [students, total, classes] = await Promise.all([
        Student.find(query)
          .populate('class', 'name section')
          .populate('parent', 'name phone')
          .select('name rollNumber class guardianContact religion isPhysicallyDisabled')
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ rollNumber: 1 }),

        Student.countDocuments(query),

        Class.find({}).select('name section')
      ]);

      // Group students by class for easier viewing
      const studentsByClass = {};
      students.forEach(student => {
        if (student.class) {
          const classKey = student.class.name + ' ' + (student.class.section || '');
          if (!studentsByClass[classKey]) {
            studentsByClass[classKey] = [];
          }
          studentsByClass[classKey].push(student);
        }
      });

      res.status(200).json({
        success: true,
        session,
        students,
        studentsByClass,
        statistics: {
          totalStudents: total,
          totalClasses: Object.keys(studentsByClass).length,
          disabledStudents: students.filter(s => s.isPhysicallyDisabled).length
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalStudents: total
        },
        availableClasses: classes
      });

    } catch (error) {
      next(error);
    }
  })
);


// ✅ Search students by religion - NEW ENDPOINT
router.get("/search/religion",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { religion, session, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      if (!religion) {
        return next(new ErrorHandler("Please provide a religion to search", 400));
      }

      // Build query
      const query = {
        religion: { $regex: religion, $options: 'i' } // Case-insensitive search
      };

      if (session) {
        query.session = session;
      }

      const [students, total] = await Promise.all([
        Student.find(query)
          .populate('class', 'name section')
          .populate('parent', 'name phone')
          .select('name rollNumber class guardianContact religion session isPhysicallyDisabled')
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ rollNumber: 1 }),

        Student.countDocuments(query)
      ]);

      // Get unique religions for filtering
      const religions = await Student.distinct('religion');

      res.status(200).json({
        success: true,
        students,
        statistics: {
          total,
          byReligion: students.reduce((acc, student) => {
            acc[student.religion] = (acc[student.religion] || 0) + 1;
            return acc;
          }, {}),
          totalReligions: religions.filter(r => r).length
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalStudents: total
        },
        availableReligions: religions.filter(r => r).sort()
      });

    } catch (error) {
      next(error);
    }
  })
);

// ✅ Advanced search with multiple filters - NEW ENDPOINT
router.get("/search/advanced",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        search = "",
        session,
        religion,
        classId,
        isPhysicallyDisabled,
        gender,
        page = 1,
        limit = 20
      } = req.query;

      const skip = (page - 1) * limit;

      // Build query
      const query = {};

      // Text search across multiple fields
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { rollNumber: { $regex: search, $options: 'i' } },
          { fathersName: { $regex: search, $options: 'i' } },
          { mothersName: { $regex: search, $options: 'i' } },
          { guardianContact: { $regex: search, $options: 'i' } }
        ];
      }

      // Add filter conditions
      if (session) query.session = session;
      if (religion) query.religion = religion;
      if (classId) query.class = classId;
      if (gender) query.gender = gender;
      if (isPhysicallyDisabled !== undefined) {
        query.isPhysicallyDisabled = isPhysicallyDisabled === 'true';
      }

      const [students, total] = await Promise.all([
        Student.find(query)
          .populate('class', 'name section')
          .populate('parent', 'name phone')
          .populate('grade', 'name')
          .select('name rollNumber class session religion gender isPhysicallyDisabled guardianContact')
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ createdAt: -1 }),

        Student.countDocuments(query)
      ]);

      res.status(200).json({
        success: true,
        students,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        filters: {
          search,
          session,
          religion,
          classId,
          isPhysicallyDisabled,
          gender
        }
      });

    } catch (error) {
      next(error);
    }
  })
);

// ✅ Search students - NEW ENDPOINT
router.get(
  "/search",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      let { search = '', limit = 10, page = 1, fields = 'name,rollNumber', session } = req.query;

      limit = parseInt(limit);
      page = parseInt(page);
      const skip = (page - 1) * limit;

      // ✅ ONLY searchable string fields
      const ALLOWED_SEARCH_FIELDS = ['name', 'rollNumber', 'religion'];

      const searchFields = fields
        .split(',')
        .map(f => f.trim())
        .filter(f => ALLOWED_SEARCH_FIELDS.includes(f));

      if (!searchFields.length) {
        return next(new ErrorHandler("No valid search fields provided", 400));
      }

      const orQuery = searchFields.map(field => ({
        [field]: { $regex: search, $options: 'i' }
      }));

      const query = { $or: orQuery };
      if (session) query.session = session;

      const selectFields = searchFields.join(' ');

      const [students, total] = await Promise.all([
        Student.find(query)
          .select(selectFields)
          .populate('class', 'name section')
          .populate('parent', 'name phone')
          .skip(skip)
          .limit(limit)
          .sort({ rollNumber: 1 }),

        Student.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        students,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalStudents: total,
        },
      });
    } catch (error) {
      console.error("student search error:", error);
      next(error);
    }
  })
);
// ✅ Get single student details with summary - UPDATED
router.get("/:id",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const student = await Student.findById(id)
        .populate('class', 'name section academicYear')
        .populate('grade', 'name level')
        .populate('parent', 'name email phoneNumber')
        .populate('transportRoute', 'routeName vehicleNumber')
        .select('-password');

      if (!student) {
        return next(new ErrorHandler("Student not found", 404));
      }

      // Get student's recent payments summary
      const payments = await Payment.find({ student: id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('class', 'name');

      // Get attendance summary
      const attendanceStats = await Attendance.aggregate([
        {
          $match: { student: student._id }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        student,
        summary: {
          payments,
          attendance: attendanceStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        }
      });

    } catch (error) {
      next(new ErrorHandler("Failed to fetch student", 500));
    }
  }
);

/* ============================================================
 *  STUDENT FINANCE — extended endpoints
 * ============================================================ */

/**
 * GET /my/finance/summary
 * Lightweight summary only — used by the dashboard header and any page
 * that just needs the numbers without fetching bills/payments/fees.
 */
router.get("/my/finance/summary", isStudentAuthenticated, catchAsyncErrors(async (req, res) => {
  const session = req.query.session || getCurrentSession();
  const summary = await StudentFinanceSummaryService.getSummary(req.user._id, session);

  res.json({
    success: true,
    session,
    summary: summary ? {
      totalFee: summary.totalFee?.toString() || '0',
      totalPaid: summary.totalPaid?.toString() || '0',
      totalWaived: summary.totalWaived?.toString() || '0',
      totalAdvanceUsed: summary.totalAdvanceUsed?.toString() || '0',
      totalRefunded: summary.totalRefunded?.toString() || '0',
      totalLateFee: summary.totalLateFee?.toString() || '0',
      advanceBalance: summary.advanceBalance?.toString() || '0',
      dueBalance: summary.dueBalance?.toString() || '0',
      status: summary.status || 'clear',
      lastUpdated: summary.lastUpdated,
    } : {
      totalFee: '0', totalPaid: '0', totalWaived: '0',
      totalAdvanceUsed: '0', totalRefunded: '0', totalLateFee: '0',
      advanceBalance: '0', dueBalance: '0', status: 'clear',
    },
  });
}));

/**
 * GET /my/finance/bills/:monthKey
 * One month's bill, with the fee items enriched by their payment
 * allocations and waiver — so the student can see exactly which
 * payments settled which fee.
 * monthKey format: "YYYY-MM", e.g. "2026-01"
 */
router.get("/my/finance/bills/:monthKey", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  const FeeInstance = require('../financeSystem/models/FeeInstance');
  const session = req.query.session || getCurrentSession();
  const { monthKey } = req.params;

  const bills = await BillService.getMonthlyBills(req.user._id, session);
  const bill = bills.find((b) => b.monthKey === monthKey);

  if (!bill) return next(new ErrorHandler("Bill not found for this month", 404));

  // Enrich items
  const feeIds = bill.items.map((i) => i._id);
  const detailed = await FeeInstance.find({ _id: { $in: feeIds } })
    .populate({
      path: 'paymentAllocations',
      select: 'payment amount allocatedAt isReversed',
      populate: { path: 'payment', select: 'receiptNumber method createdAt' },
    })
    .populate('waiver', 'type amount status approvedDate reason')
    .lean();

  const byId = Object.fromEntries(detailed.map((f) => [String(f._id), f]));

  const items = bill.items.map((item) => {
    const d = byId[String(item._id)] || {};
    return {
      ...item,
      waiver: d.waiver ? {
        type: d.waiver.type,
        amount: d.waiver.amount?.toString?.() ?? String(d.waiver.amount),
        approvedDate: d.waiver.approvedDate,
        reason: d.waiver.reason,
      } : null,
      allocations: (d.paymentAllocations || [])
        .filter((a) => !a.isReversed)
        .map((a) => ({
          _id: a._id,
          receiptNumber: a.payment?.receiptNumber,
          method: a.payment?.method,
          amount: a.amount?.toString?.() ?? String(a.amount),
          allocatedAt: a.allocatedAt,
        })),
    };
  });

  res.json({
    success: true,
    session,
    bill: { ...bill, items },
  });
}));

/**
 * GET /my/finance/fees/:feeInstanceId
 * Single fee detail with a full timeline:
 *   fee_created → waiver_applied → payment_allocated (multiple) → advance_applied
 */
router.get("/my/finance/fees/:feeInstanceId", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  const FeeInstance = require('../financeSystem/models/FeeInstance');

  const fee = await FeeInstance.findById(req.params.feeInstanceId)
    .populate({
      path: 'paymentAllocations',
      select: 'payment amount allocatedAt isReversed',
      populate: { path: 'payment', select: 'receiptNumber method createdAt status' },
    })
    .populate('waiver', 'type amount status approvedDate reason')
    .populate('feeTemplate', 'title description frequency')
    .lean();

  if (!fee) return next(new ErrorHandler("Fee not found", 404));
  if (String(fee.student) !== String(req.user._id)) {
    return next(new ErrorHandler("Access denied", 403));
  }

  const timeline = [];

  timeline.push({
    at: fee.createdAt,
    type: 'fee_created',
    description: `Fee charged: ${fee.title}`,
    amount: fee.totalAmount?.toString?.() ?? String(fee.totalAmount),
  });

  if (fee.waiver && fee.waiver.status === 'approved') {
    timeline.push({
      at: fee.waiver.approvedDate || fee.waiver.createdAt,
      type: 'waiver_applied',
      description: `Waiver applied — ${fee.waiver.reason || fee.waiver.type}`,
      amount: fee.waiver.amount?.toString?.() ?? String(fee.waiver.amount),
    });
  }

  for (const alloc of fee.paymentAllocations || []) {
    if (alloc.isReversed) continue;
    timeline.push({
      at: alloc.allocatedAt,
      type: 'payment_allocated',
      description: `Payment received — ${alloc.payment?.receiptNumber || alloc.payment?._id}`,
      amount: alloc.amount?.toString?.() ?? String(alloc.amount),
      receiptNumber: alloc.payment?.receiptNumber,
      method: alloc.payment?.method,
    });
  }

  const advanceUsed = Number(fee.advanceUsed?.toString?.() || fee.advanceUsed || 0);
  if (advanceUsed > 0) {
    timeline.push({
      at: fee.updatedAt,
      type: 'advance_applied',
      description: 'Advance balance applied',
      amount: fee.advanceUsed?.toString?.() ?? String(fee.advanceUsed),
    });
  }

  timeline.sort((a, b) => new Date(a.at) - new Date(b.at));

  res.json({
    success: true,
    fee: {
      _id: fee._id,
      title: fee.title,
      frequency: fee.frequency,
      originalAmount: fee.originalAmount?.toString?.() ?? String(fee.originalAmount),
      taxAmount: fee.taxAmount?.toString?.() ?? String(fee.taxAmount),
      lateFeeAmount: fee.lateFeeAmount?.toString?.() ?? String(fee.lateFeeAmount),
      totalAmount: fee.totalAmount?.toString?.() ?? String(fee.totalAmount),
      paidAmount: fee.paidAmount?.toString?.() ?? String(fee.paidAmount),
      waivedAmount: fee.waivedAmount?.toString?.() ?? String(fee.waivedAmount),
      advanceUsed: fee.advanceUsed?.toString?.() ?? String(fee.advanceUsed),
      dueAmount: fee.dueAmount?.toString?.() ?? String(fee.dueAmount),
      status: fee.status,
      issueDate: fee.issueDate,
      dueDate: fee.dueDate,
      paidDate: fee.paidDate,
      session: fee.session,
      feeTemplate: fee.feeTemplate,
    },
    waiver: fee.waiver ? {
      type: fee.waiver.type,
      amount: fee.waiver.amount?.toString?.() ?? String(fee.waiver.amount),
      status: fee.waiver.status,
      approvedDate: fee.waiver.approvedDate,
      reason: fee.waiver.reason,
    } : null,
    allocations: (fee.paymentAllocations || [])
      .filter((a) => !a.isReversed)
      .map((a) => ({
        _id: a._id,
        receiptNumber: a.payment?.receiptNumber,
        method: a.payment?.method,
        amount: a.amount?.toString?.() ?? String(a.amount),
        allocatedAt: a.allocatedAt,
      })),
    timeline,
  });
}));

/**
 * GET /my/finance/waivers
 * Approved and revoked waivers applied to this student.
 */
router.get("/my/finance/waivers", isStudentAuthenticated, catchAsyncErrors(async (req, res) => {
  const FeeWaiver = require('../financeSystem/models/FeeWaiver');
  const session = req.query.session || getCurrentSession();

  const waivers = await FeeWaiver.find({
    student: req.user._id,
    status: { $in: ['approved', 'revoked'] },
  })
    .populate('feeInstance', 'title dueDate totalAmount session')
    .sort({ approvedDate: -1, createdAt: -1 })
    .lean();

  const filtered = session
    ? waivers.filter((w) => !w.feeInstance || w.feeInstance.session === session)
    : waivers;

  res.json({
    success: true,
    session,
    waivers: filtered.map((w) => ({
      _id: w._id,
      type: w.type,
      amount: w.amount?.toString?.() ?? String(w.amount),
      percentage: w.percentage?.toString?.() ?? null,
      status: w.status,
      reason: w.reason,
      requestDate: w.requestDate,
      approvedDate: w.approvedDate,
      effectiveFrom: w.effectiveFrom,
      effectiveUntil: w.effectiveUntil,
      feeInstance: w.feeInstance ? {
        _id: w.feeInstance._id,
        title: w.feeInstance.title,
        dueDate: w.feeInstance.dueDate,
        totalAmount: w.feeInstance.totalAmount?.toString?.() ?? String(w.feeInstance.totalAmount),
      } : null,
    })),
  });
}));

/**
 * GET /my/finance/advance/transactions
 * Every credit/debit that built up or drained the advance balance.
 */
router.get("/my/finance/advance/transactions", isStudentAuthenticated, catchAsyncErrors(async (req, res) => {
  const AdvanceBalance = require('../financeSystem/models/AdvanceBalance');
  const session = req.query.session || getCurrentSession();

  const advance = await AdvanceBalance.findOne({
    student: req.user._id,
    session,
  }).lean();

  if (!advance) {
    return res.json({
      success: true,
      session,
      currentBalance: '0',
      currency: 'BDT',
      transactions: [],
    });
  }

  const transactions = (advance.transactions || [])
    .map((t) => ({
      _id: t._id,
      type: t.type,
      amount: t.amount?.toString?.() ?? String(t.amount),
      previousBalance: t.previousBalance?.toString?.() ?? null,
      newBalance: t.newBalance?.toString?.() ?? null,
      description: t.description,
      paymentId: t.paymentId,
      refundId: t.refundId,
      feeInstanceId: t.feeInstanceId,
      transactionId: t.transactionId,
      createdAt: t.createdAt,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    session,
    currentBalance: advance.amount?.toString?.() ?? String(advance.amount ?? 0),
    currency: advance.currency || 'BDT',
    lastUpdated: advance.lastUpdated,
    transactions,
  });
}));

/**
 * GET /my/finance/statement
 * Streams the student's own statement PDF. Avoids a redirect so the
 * browser can save the file directly.
 */
router.get("/my/finance/statement", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  // Adjust this path if your StatementPdfService lives elsewhere — see how
  // financeSystem/routes/pdfRoutes.js imports it and mirror that path.
  const StatementPdfService = require('../services/pdf/StatementPdfService');
  const session = req.query.session || getCurrentSession();

  const buf = await StatementPdfService.generate(req.user._id, session);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="statement-${req.user.rollNumber || req.user._id}.pdf"`
  );
  res.send(buf);
}));

/* ============================================================
 *  STUDENT ONLINE PAYMENTS
 * ============================================================ */

const PaymentIntentService = require('../services/PaymentIntentService');
const { toDecimal } = require('../utils/decimal');

/**
 * POST /my/payment-intents
 * Student creates a payment intent for the current session.
 * Amount must be > 0 and within a sane ceiling.
 */
router.post("/my/payment-intents", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
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
  const summary = await StudentFinanceSummaryService.getSummary(req.user._id, session);
  const dueBalance = toDecimal(summary?.dueBalance || 0);

  // Ceiling: outstanding + a generous advance top-up buffer.
  // Prevents fat-finger and malicious inputs.
  const MAX_ADVANCE_TOPUP = toDecimal(50000);
  const maxAllowed = dueBalance.gt(0)
    ? dueBalance.plus(MAX_ADVANCE_TOPUP)
    : MAX_ADVANCE_TOPUP;

  if (payAmount.gt(maxAllowed)) {
    return next(new ErrorHandler(
      `Amount exceeds maximum allowed for this student (${maxAllowed.toFixed(2)})`,
      400
    ));
  }

  // Reject explicit fee targeting the student doesn't own.
  const FeeInstance = require('../financeSystem/models/FeeInstance');
  const feeIds = Array.isArray(feeInstances) ? feeInstances : [];
  if (feeIds.length > 0) {
    const owned = await FeeInstance.countDocuments({
      _id: { $in: feeIds },
      student: req.user._id,
    });
    if (owned !== feeIds.length) {
      return next(new ErrorHandler('One or more fee instances do not belong to you', 403));
    }
  }

  // Return to the student portal after gateway redirect
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const intent = await PaymentIntentService.createIntent(
    {
      studentId: req.user._id,
      amount: payAmount.toFixed(2),
      purpose: 'fee_payment',
      method,
      gateway,
      feeInstances: feeIds,
      session,
      notes,
      // returnUrl: `${FRONTEND_URL}/student/payments/result?intentId=__ID__&status=success`,
      // cancelUrl: `${FRONTEND_URL}/student/payments/result?intentId=__ID__&status=cancel`,
    },
    req.user._id
  );

  res.status(201).json({
    success: true,
    data: {
      _id: intent._id,
      status: intent.status,
      amount: intent.amount?.toString?.() ?? String(intent.amount),
      gateway: intent.gateway,
      // null for cash/manual — student portal should only offer online
      redirectUrl: intent.redirectUrl || null,
      expiresAt: intent.expiresAt,
    },
  });
}));

/**
 * GET /my/payment-intents/:id
 * Polled by the result page until status is terminal.
 */
router.get("/my/payment-intents/:id", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  const PaymentIntent = require('../financeSystem/models/PaymentIntent');
  const intent = await PaymentIntent.findById(req.params.id).lean();

  if (!intent) return next(new ErrorHandler('Intent not found', 404));
  if (String(intent.student) !== String(req.user._id)) {
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
    },
  });
}));

/**
 * POST /my/payment-intents/:id/cancel
 * Student backs out of a pending intent.
 */
router.post("/my/payment-intents/:id/cancel", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  const PaymentIntent = require('../financeSystem/models/PaymentIntent');
  const intent = await PaymentIntent.findById(req.params.id);
  if (!intent) return next(new ErrorHandler('Intent not found', 404));
  if (String(intent.student) !== String(req.user._id)) {
    return next(new ErrorHandler('Access denied', 403));
  }

  const cancelled = await PaymentIntentService.cancelIntent(intent._id, req.user._id);
  res.json({
    success: true,
    data: { _id: cancelled._id, status: cancelled.status },
  });
}));


module.exports = router;