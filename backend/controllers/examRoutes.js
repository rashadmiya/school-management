// routes/examRoutes.js
const express = require("express");
const router = express.Router();
const Exam = require("../models/Exam");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Teacher = require("../models/Teacher");

// 🎯 Get exams for a specific class
router.get("/class/:classId", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { status } = req.query; // 'upcoming', 'completed', 'all'
    let filter = { class: req.params.classId };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (status === 'upcoming') {
      filter.date = { $gte: today };
    } else if (status === 'completed') {
      filter.date = { $lt: today };
    }

    const exams = await Exam.find(filter)
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      exams,
      count: exams.length
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get teacher's exams
router.get("/teacher/my-exams",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      // const exams = await Exam.find({ createdBy: req.user._id })
      //   .populate('class', 'name')
      //   .populate('subject', 'name code')
      //   .sort({ date: 1, startTime: 1 });

      const teacher = await Teacher.findOne({ user: req.user._id });

      const exams = await Exam.find({
        class: { $in: teacher.classes }
      })
        .populate('class', 'name section') // Add section here
        .populate('subject', 'name code')
        .sort({ date: 1, startTime: 1 });

      // Calculate statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalExams = exams.length;
      const upcomingExams = exams.filter(e => new Date(e.date) >= today).length;
      const completedExams = exams.filter(e => new Date(e.date) < today).length;
      const todayExams = exams.filter(e => {
        const examDate = new Date(e.date);
        return examDate.toDateString() === today.toDateString();
      }).length;

      res.status(200).json({
        success: true,
        exams,
        statistics: {
          total: totalExams,
          upcoming: upcomingExams,
          completed: completedExams,
          today: todayExams
        }
      });

    } catch (error) {
      next(error);
    }
  }));

// 🎯 Get upcoming exams (for students)
router.get("/student/upcoming", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exams = await Exam.find({
      date: { $gte: today }
    })
      .populate('class', 'name section')
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .sort({ date: 1, startTime: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      exams,
      count: exams.length
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get today's exams
router.get("/today", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exams = await Exam.find({
      date: today
    })
      .populate('class', 'name section')
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      date: today,
      exams,
      count: exams.length
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get exam calendar for a month
router.get("/calendar/:year/:month", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { year, month } = req.params;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const exams = await Exam.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .populate('class', 'name section')
      .populate('subject', 'name code')
      .sort({ date: 1, startTime: 1 });

    // Group exams by date
    const calendar = {};
    exams.forEach(exam => {
      const dateStr = exam.date.toISOString().split('T')[0];
      if (!calendar[dateStr]) {
        calendar[dateStr] = [];
      }
      calendar[dateStr].push(exam);
    });

    res.status(200).json({
      success: true,
      year: parseInt(year),
      month: parseInt(month),
      calendar,
      totalExams: exams.length
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Create new exam
router.post("/", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { title, class: classId, subject, date, startTime, endTime, totalMarks } = req.body;

    if (!title || !classId || !subject || !date || !startTime || !endTime || !totalMarks) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    if (req.user.role.name === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });

      if (!teacher.classes.includes(classId) || !teacher.subjects.includes(subject)) {
        return next(new ErrorHandler("You are not assigned to this class or subject", 403));
      }
    }
    // Validate date is not in the past
    const examDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (examDate < today) {
      return next(new ErrorHandler("Exam date cannot be in the past", 400));
    }

    // Validate time format and logic
    if (startTime >= endTime) {
      return next(new ErrorHandler("End time must be after start time", 400));
    }

    // Check for exam conflicts in the same class and time
    const conflictingExam = await Exam.findOne({
      class: classId,
      date: examDate,
      $or: [
        {
          $and: [
            { startTime: { $lte: startTime } },
            { endTime: { $gt: startTime } }
          ]
        },
        {
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gte: endTime } }
          ]
        }
      ]
    });

    if (conflictingExam) {
      return next(new ErrorHandler("There is already an exam scheduled for this class at this time", 400));
    }

    const exam = await Exam.create({
      title,
      class: classId,
      subject,
      date: examDate,
      startTime,
      endTime,
      totalMarks: parseInt(totalMarks),
      createdBy: req.user._id
    });

    const populatedExam = await Exam.findById(exam._id)
      .populate('class', 'name')
      .populate('subject', 'name code')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: "Exam created successfully",
      exam: populatedExam
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get all exams with filtering
router.get("/", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { class: classId, subject, status, month, year } = req.query;

    let filter = {};
    if (classId) filter.class = classId;
    if (subject) filter.subject = subject;

    // Status filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (status === 'upcoming') {
      filter.date = { $gte: today };
    } else if (status === 'completed') {
      filter.date = { $lt: today };
    } else if (status === 'today') {
      filter.date = today;
    }

    // Month and year filtering
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const exams = await Exam.find(filter)
      .populate('class', 'name')
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      exams,
      count: exams.length
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get exam by ID
router.get("/:id", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('class', 'name section')
      .populate('subject', 'name code description')
      .populate('createdBy', 'name email');

    if (!exam) {
      return next(new ErrorHandler("Exam not found", 404));
    }

    res.status(200).json({
      success: true,
      exam
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Update exam
router.put("/:id", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { title, date, startTime, endTime, totalMarks } = req.body;

    if (req.user.role.name === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });

      if (!teacher.classes.includes(exam.class.toString()) ||
        !teacher.subjects.includes(exam.subject.toString())) {
        return next(new ErrorHandler("You are not assigned to this class or subject", 403));
      }
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return next(new ErrorHandler("Exam not found", 404));
    }

    // Check if the current user is the creator or admin
    if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role.name !== 'admin') {
      return next(new ErrorHandler("You can only edit your own exams", 403));
    }

    // Validate date if provided
    if (date) {
      const examDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (examDate < today) {
        return next(new ErrorHandler("Exam date cannot be in the past", 400));
      }
    }

    // Validate time if provided
    if (startTime && endTime && startTime >= endTime) {
      return next(new ErrorHandler("End time must be after start time", 400));
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      req.params.id,
      {
        title: title || exam.title,
        date: date ? new Date(date) : exam.date,
        startTime: startTime || exam.startTime,
        endTime: endTime || exam.endTime,
        totalMarks: totalMarks ? parseInt(totalMarks) : exam.totalMarks
      },
      { new: true, runValidators: true }
    )
      .populate('class', 'name')
      .populate('subject', 'name code')
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      message: "Exam updated successfully",
      exam: updatedExam
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Delete exam
router.delete("/:id", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return next(new ErrorHandler("Exam not found", 404));
    }

    // Check if the current user is the creator or admin
    if (exam.createdBy.toString() !== req.user._id.toString() && req.user.role.name !== 'admin') {
      return next(new ErrorHandler("You can only delete your own exams", 403));
    }

    await Exam.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Exam deleted successfully"
    });

  } catch (error) {
    next(error);
  }
}));

module.exports = router;