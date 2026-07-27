// routes/assignmentRoutes.js
const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
// routes/assignmentSubmissions.js - Add these routes
const path = require("path");
const fs = require("fs");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const Teacher = require("../models/Teacher");


// 🎯 Get assignments for a specific class
router.get("/class/:classId", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { status } = req.query; // 'active', 'overdue', 'all'

    let filter = { class: req.params.classId };

    if (status === 'active') {
      filter.dueDate = { $gte: new Date() };
    } else if (status === 'overdue') {
      filter.dueDate = { $lt: new Date() };
    }

    const assignments = await Assignment.find(filter)
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      assignments,
      count: assignments.length
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get teacher's assignments
router.get("/teacher/my-assignments",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      // const assignments = await Assignment.find({ createdBy: req.user._id })
      //   .populate('class', 'name')
      //   .populate('subject', 'name code')
      //   .sort({ dueDate: 1 });

      const teacher = await Teacher.findOne({ user: req.user._id });

      const assignments = await Assignment.find({
        class: { $in: teacher.classes }
      })
        .populate('class', 'name section') // Add section here
        .populate('subject', 'name code')
        .sort({ dueDate: 1 });
        
      // Calculate statistics
      const totalAssignments = assignments.length;
      const activeAssignments = assignments.filter(a => new Date(a.dueDate) >= new Date()).length;
      const overdueAssignments = assignments.filter(a => new Date(a.dueDate) < new Date()).length;

      res.status(200).json({
        success: true,
        assignments,
        statistics: {
          total: totalAssignments,
          active: activeAssignments,
          overdue: overdueAssignments
        }
      });

    } catch (error) {
      next(error);
    }
  }));

// 🎯 Get upcoming assignments (for students)
router.get("/student/upcoming", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    // This would typically get the student's class and then find assignments
    // For now, we'll return all active assignments
    const assignments = await Assignment.find({
      dueDate: { $gte: new Date() }
    })
      .populate('class', 'name')
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      assignments,
      count: assignments.length
    });

  } catch (error) {
    next(error);
  }
}));


// 🎯 Download submission file
router.get("/submissions/:submissionId/files/:fileId/download",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const submission = await AssignmentSubmission.findById(req.params.submissionId)
        .populate('assignment')
        .populate('student');

      if (!submission) {
        return next(new ErrorHandler("Submission not found", 404));
      }

      // Check authorization
      if (req.user.role.name === 'student' && submission.student._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Not authorized", 403));
      }

      if (req.user.role.name === 'teacher') {
        const assignment = await Assignment.findById(submission.assignment);
        if (assignment.createdBy.toString() !== req.user._id.toString() && req.user.role.name !== 'admin') {
          return next(new ErrorHandler("Not authorized", 403));
        }
      }

      const file = submission.files.id(req.params.fileId);
      if (!file) {
        return next(new ErrorHandler("File not found", 404));
      }

      // Check if file exists
      if (!fs.existsSync(file.url)) {
        return next(new ErrorHandler("File not found on server", 404));
      }

      // Set headers for download
      // res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      const encodedName = encodeURIComponent(file.filename);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`);

      res.setHeader('Content-Type', file.mimetype);

      // Stream the file
      const fileStream = fs.createReadStream(file.url);
      fileStream.pipe(res);

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 View submission file (inline for preview)
router.get("/submissions/:submissionId/files/:fileId/view",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const submission = await AssignmentSubmission.findById(req.params.submissionId);

      if (!submission) {
        return next(new ErrorHandler("Submission not found", 404));
      }

      // Check authorization (same as download)
      if (req.user.role.name === 'student' && submission.student.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Not authorized", 403));
      }

      const file = submission.files.id(req.params.fileId);
      if (!file) {
        return next(new ErrorHandler("File not found", 404));
      }

      if (!fs.existsSync(file.url)) {
        return next(new ErrorHandler("File not found on server", 404));
      }

      // Set headers for inline viewing
      res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
      res.setHeader('Content-Type', file.mimetype);

      const fileStream = fs.createReadStream(file.url);
      fileStream.pipe(res);

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get file info
router.get("/submissions/:submissionId/files/:fileId",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const submission = await AssignmentSubmission.findById(req.params.submissionId);

      if (!submission) {
        return next(new ErrorHandler("Submission not found", 404));
      }

      // Check authorization
      if (req.user.role.name === 'student' && submission.student.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Not authorized", 403));
      }

      const file = submission.files.id(req.params.fileId);
      if (!file) {
        return next(new ErrorHandler("File not found", 404));
      }

      res.status(200).json({
        success: true,
        file
      });

    } catch (error) {
      next(error);
    }
  })
);


// 🎯 Create new assignment
router.post("/", isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { title, description, class: classId, subject, dueDate, mark } = req.body;

      if (!title || !classId || !subject || !dueDate) {
        return next(new ErrorHandler("Title, class, subject, and due date are required", 400));
      }

      if (req.user.role.name === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user._id });

        if (!teacher.classes.includes(classId) || !teacher.subjects.includes(subject)) {
          return next(new ErrorHandler("You are not assigned to this class or subject", 403));
        }
      }
      // Validate due date is in the future
      const dueDateObj = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDateObj < today) {
        return next(new ErrorHandler("Due date must be in the future", 400));
      }

      const assignment = await Assignment.create({
        title,
        description,
        class: classId,
        subject,
        dueDate: dueDateObj,
        mark,
        createdBy: req.user._id
      });

      const populatedAssignment = await Assignment.findById(assignment._id)
        .populate('class', 'name')
        .populate('subject', 'name code')
        .populate('createdBy', 'name');

      res.status(201).json({
        success: true,
        message: "Assignment created successfully",
        assignment: populatedAssignment
      });

    } catch (error) {
      next(error);
    }
  }));

// 🎯 Get all assignments with filtering
router.get("/", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { class: classId, subject, teacher, status } = req.query;

    let filter = {};
    if (classId) filter.class = classId;
    if (subject) filter.subject = subject;
    if (teacher) filter.createdBy = teacher;

    // Status filtering
    if (status === 'active') {
      filter.dueDate = { $gte: new Date() };
    } else if (status === 'overdue') {
      filter.dueDate = { $lt: new Date() };
    }

    const assignments = await Assignment.find(filter)
      .populate('class', 'name')
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      assignments,
      count: assignments.length
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get assignment by ID
router.get("/:id", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('class', 'name')
      .populate('subject', 'name code description')
      .populate('createdBy', 'name email');

    if (!assignment) {
      return next(new ErrorHandler("Assignment not found", 404));
    }

    res.status(200).json({
      success: true,
      assignment
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Update assignment
router.put("/:id", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { title, description, dueDate } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return next(new ErrorHandler("Assignment not found", 404));
    }

    if (req.user.role.name === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });

      if (!teacher.classes.includes(assignment.class.toString()) ||
        !teacher.subjects.includes(assignment.subject.toString())) {
        return next(new ErrorHandler("You are not assigned to this class or subject", 403));
      }
    }
    // Check if the current user is the creator or admin
    if (assignment.createdBy.toString() !== req.user._id.toString() && req.user.role.name !== 'admin') {
      return next(new ErrorHandler("You can only edit your own assignments", 403));
    }

    // Validate due date if provided
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDateObj < today) {
        return next(new ErrorHandler("Due date must be in the future", 400));
      }
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      {
        title: title || assignment.title,
        description: description || assignment.description,
        dueDate: dueDate ? new Date(dueDate) : assignment.dueDate
      },
      { new: true, runValidators: true }
    )
      .populate('class', 'name')
      .populate('subject', 'name code')
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      assignment: updatedAssignment
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Delete assignment
router.delete("/:id", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return next(new ErrorHandler("Assignment not found", 404));
    }

    // Check if the current user is the creator or admin
    if (assignment.createdBy.toString() !== req.user._id.toString() && req.user.role.name !== 'admin') {
      return next(new ErrorHandler("You can only delete your own assignments", 403));
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully"
    });

  } catch (error) {
    next(error);
  }
}));

module.exports = router;