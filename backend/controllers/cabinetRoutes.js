// routes/cabinetRoutes.js
const express = require("express");
const router = express.Router();
const StudentCabinet = require("../models/StudentCabinet");
const Student = require("../models/Student");
const Class = require("../models/Class");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// 🎯 Create cabinet member
router.post("/",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        name,
        class: classId,
        rollNumber,
        student: studentId,
        designation,
        session,
        isActive = true
      } = req.body;

      // Validate required fields
      if (!name || !classId || !rollNumber || !designation || !session) {
        return next(new ErrorHandler("All fields are required", 400));
      }

      // Validate class exists
      const classExists = await Class.findById(classId);
      if (!classExists) {
        return next(new ErrorHandler("Class not found", 404));
      }

      // Validate student if provided
      if (studentId) {
        const studentExists = await Student.findById(studentId);
        if (!studentExists) {
          return next(new ErrorHandler("Student not found", 404));
        }
      }

      // Check if designation already exists for this session
      const existingDesignation = await StudentCabinet.findOne({
        designation,
        session,
        isActive: true
      });

      if (existingDesignation && existingDesignation.designation !== 'member') {
        return next(new ErrorHandler(
          `${designation} position is already filled for this session`, 
          400
        ));
      }

      const cabinet = await StudentCabinet.create({
        name,
        class: classId,
        section: classExists.section,
        rollNumber,
        student: studentId || null,
        designation,
        session,
        isActive
      });

      // Populate references
      const populatedCabinet = await StudentCabinet.findById(cabinet._id)
        .populate("class", "name")
        .populate("section", "name")
        .populate("student", "name rollNumber");

      res.status(201).json({
        success: true,
        message: "Cabinet member added successfully",
        cabinet: populatedCabinet
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get all cabinet members
router.get("/",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        session = "",
        class: classId = "",
        designation = "",
        isActive,
        page = 1,
        limit = 20
      } = req.query;

      const skip = (page - 1) * limit;

      let filter = {};

      if (session) filter.session = session;
      if (classId) filter.class = classId;
      if (designation) filter.designation = designation;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const [cabinet, total] = await Promise.all([
        StudentCabinet.find(filter)
          .populate("class", "name")
          .populate("section", "name")
          .populate("student", "name rollNumber")
          .sort({ designation: 1, name: 1 })
          .skip(skip)
          .limit(parseInt(limit)),
        
        StudentCabinet.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        cabinet,
        count: cabinet.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Update cabinet member
router.put("/:id",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const cabinet = await StudentCabinet.findById(req.params.id);

      if (!cabinet) {
        return next(new ErrorHandler("Cabinet member not found", 404));
      }

      // Check designation uniqueness if changing
      if (req.body.designation && req.body.designation !== cabinet.designation) {
        const existingDesignation = await StudentCabinet.findOne({
          designation: req.body.designation,
          session: req.body.session || cabinet.session,
          isActive: true,
          _id: { $ne: cabinet._id }
        });

        if (existingDesignation && existingDesignation.designation !== 'member') {
          return next(new ErrorHandler(
            `${req.body.designation} position is already filled for this session`, 
            400
          ));
        }
      }

      const updatedCabinet = await StudentCabinet.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate("class", "name")
        .populate("section", "name")
        .populate("student", "name rollNumber");

      res.status(200).json({
        success: true,
        message: "Cabinet member updated successfully",
        cabinet: updatedCabinet
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Delete cabinet member
router.delete("/:id",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const cabinet = await StudentCabinet.findById(req.params.id);

      if (!cabinet) {
        return next(new ErrorHandler("Cabinet member not found", 404));
      }

      await StudentCabinet.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Cabinet member removed successfully"
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get cabinet by session
router.get("/session/:session",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { session } = req.params;

      const cabinet = await StudentCabinet.find({ session, isActive: true })
        .populate("class", "name")
        .populate("section", "name")
        .populate("student", "name rollNumber")
        .sort({ designation: 1 });

      res.status(200).json({
        success: true,
        cabinet,
        count: cabinet.length,
        session
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Public route: Get active cabinet
router.get("/public/active",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { session = "" } = req.query;

      let filter = { isActive: true };
      if (session) filter.session = session;

      const cabinet = await StudentCabinet.find(filter)
        .populate("class", "name")
        .populate("section", "name")
        .populate("student", "name rollNumber")
        .select("name class section rollNumber designation session")
        .sort({ designation: 1 });

      res.status(200).json({
        success: true,
        cabinet,
        count: cabinet.length
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Public route: Get cabinet by ID
router.get("/public/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const cabinet = await StudentCabinet.findById(req.params.id)
        .populate("class", "name")
        .populate("section", "name")
        .populate("student", "name rollNumber")
        .select("name class section rollNumber designation session");

      if (!cabinet || !cabinet.isActive) {
        return next(new ErrorHandler("Cabinet member not found", 404));
      }

      res.status(200).json({
        success: true,
        cabinet
      });

    } catch (error) {
      next(error);
    }
  })
);

// routes/studentCabinetRoutes.js
// 🎯 Get student cabinet member by ID (public)
router.get("/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const cabinetMember = await StudentCabinet.findById(req.params.id)
        .populate('class', 'className')
        .populate('section', 'sectionName')
        .populate('student', 'name rollNumber photo fatherName motherName dateOfBirth bloodGroup address')
        .lean();

      if (!cabinetMember) {
        return next(new ErrorHandler("Cabinet member not found", 404));
      }

      // Add additional calculated fields
      if (cabinetMember.student && cabinetMember.student.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(cabinetMember.student.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        cabinetMember.student.age = age;
      }

      res.status(200).json({
        success: true,
        cabinetMember
      });

    } catch (error) {
      if (error.name === 'CastError') {
        return next(new ErrorHandler("Invalid cabinet member ID", 400));
      }
      next(error);
    }
  })
);

module.exports = router;