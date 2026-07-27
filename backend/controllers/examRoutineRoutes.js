// routes/examRoutineRoutes.js
const express = require("express");
const router = express.Router();
const ExamRoutine = require("../models/ExamRoutine");
const Class = require("../models/Class");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// Create exam routine
router.post("/create", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            examType,
            title,
            academicYear,
            examDate,
            startTime,
            endTime,
            subject,
            class: classId,
            roomNumber,
            monitoringTeachers,
            totalMarks,
            passingMarks,
            instructions
        } = req.body;

        if (!examType || !title || !academicYear || !examDate || !startTime || !endTime || !subject || !classId || !roomNumber || !totalMarks || !passingMarks) {
            return next(new ErrorHandler("All required fields must be filled", 400));
        }

        // Check if class exists
        const classExists = await Class.findById(classId);
        if (!classExists) {
            return next(new ErrorHandler("Class not found", 404));
        }

        const examRoutine = await ExamRoutine.create({
            examType,
            title,
            academicYear,
            examDate,
            startTime,
            endTime,
            subject,
            class: classId,
            roomNumber,
            monitoringTeachers: monitoringTeachers || [],
            totalMarks,
            passingMarks,
            instructions,
            createdBy: req.user._id
        });

        const populatedExam = await ExamRoutine.findById(examRoutine._id)
            .populate('subject', 'name code')
            .populate('class', 'name section')
            .populate({
                path: 'class',
                populate: { path: 'section', select: 'name' }
            })
            .populate('monitoringTeachers', 'user')
            .populate({
                path: 'monitoringTeachers',
                populate: { path: 'user', select: 'name' }
            })
            .populate('createdBy', 'name');

        res.status(201).json({
            success: true,
            message: "Exam routine created successfully",
            examRoutine: populatedExam
        });

    } catch (error) {
        next(error);
    }
}));

// Get all exam routines
router.get("/all", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
    try {
        const { examType, class: classId, academicYear, startDate, endDate } = req.query;

        let filter = {};
        if (examType) filter.examType = examType;
        if (classId) filter.class = classId;
        if (academicYear) filter.academicYear = academicYear;
        
        if (startDate || endDate) {
            filter.examDate = {};
            if (startDate) filter.examDate.$gte = new Date(startDate);
            if (endDate) filter.examDate.$lte = new Date(endDate);
        }

        const examRoutines = await ExamRoutine.find(filter)
            .populate('subject', 'name code')
            .populate('class', 'name section')
            .populate({
                path: 'class',
                populate: { path: 'section', select: 'name' }
            })
            .populate('monitoringTeachers', 'user')
            .populate({
                path: 'monitoringTeachers',
                populate: { path: 'user', select: 'name' }
            })
            .populate('createdBy', 'name')
            .sort({ examDate: 1, startTime: 1 });

        res.status(200).json({
            success: true,
            examRoutines,
            count: examRoutines.length
        });

    } catch (error) {
        next(error);
    }
}));

// Get exam routine by ID
router.get("/:id", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
    try {
        const examRoutine = await ExamRoutine.findById(req.params.id)
            .populate('subject', 'name code')
            .populate('class', 'name section')
            .populate({
                path: 'class',
                populate: { path: 'section', select: 'name' }
            })
            .populate('monitoringTeachers', 'user')
            .populate({
                path: 'monitoringTeachers',
                populate: { path: 'user', select: 'name email' }
            })
            .populate('createdBy', 'name email');

        if (!examRoutine) {
            return next(new ErrorHandler("Exam routine not found", 404));
        }

        res.status(200).json({
            success: true,
            examRoutine
        });

    } catch (error) {
        next(error);
    }
}));

// Update exam routine
router.put("/:id", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            examType,
            title,
            academicYear,
            examDate,
            startTime,
            endTime,
            subject,
            class: classId,
            roomNumber,
            monitoringTeachers,
            totalMarks,
            passingMarks,
            instructions,
            isPublished
        } = req.body;

        const examRoutine = await ExamRoutine.findById(req.params.id);
        if (!examRoutine) {
            return next(new ErrorHandler("Exam routine not found", 404));
        }

        if (classId) {
            const classExists = await Class.findById(classId);
            if (!classExists) {
                return next(new ErrorHandler("Class not found", 404));
            }
        }

        const updatedExam = await ExamRoutine.findByIdAndUpdate(
            req.params.id,
            {
                examType: examType || examRoutine.examType,
                title: title || examRoutine.title,
                academicYear: academicYear || examRoutine.academicYear,
                examDate: examDate || examRoutine.examDate,
                startTime: startTime || examRoutine.startTime,
                endTime: endTime || examRoutine.endTime,
                subject: subject || examRoutine.subject,
                class: classId || examRoutine.class,
                roomNumber: roomNumber || examRoutine.roomNumber,
                monitoringTeachers: monitoringTeachers || examRoutine.monitoringTeachers,
                totalMarks: totalMarks || examRoutine.totalMarks,
                passingMarks: passingMarks || examRoutine.passingMarks,
                instructions: instructions || examRoutine.instructions,
                isPublished: isPublished !== undefined ? isPublished : examRoutine.isPublished
            },
            { new: true, runValidators: true }
        )
            .populate('subject', 'name code')
            .populate('class', 'name section')
            .populate({
                path: 'class',
                populate: { path: 'section', select: 'name' }
            })
            .populate('monitoringTeachers', 'user')
            .populate({
                path: 'monitoringTeachers',
                populate: { path: 'user', select: 'name' }
            })
            .populate('createdBy', 'name');

        res.status(200).json({
            success: true,
            message: "Exam routine updated successfully",
            examRoutine: updatedExam
        });

    } catch (error) {
        next(error);
    }
}));

// Delete exam routine
router.delete("/:id", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
    try {
        const examRoutine = await ExamRoutine.findById(req.params.id);
        if (!examRoutine) {
            return next(new ErrorHandler("Exam routine not found", 404));
        }

        await ExamRoutine.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Exam routine deleted successfully"
        });

    } catch (error) {
        next(error);
    }
}));

// Get student's exam routine
router.get("/student/my-exams", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
    try {
        const student = await Student.findOne({ user: req.user._id });
        if (!student) {
            return next(new ErrorHandler("Student not found", 404));
        }

        const examRoutines = await ExamRoutine.find({ 
            class: student.class,
            isPublished: true,
            examDate: { $gte: new Date() }
        })
            .populate('subject', 'name code')
            .populate('class', 'name section')
            .populate({
                path: 'class',
                populate: { path: 'section', select: 'name' }
            })
            .populate('monitoringTeachers', 'user')
            .populate({
                path: 'monitoringTeachers',
                populate: { path: 'user', select: 'name' }
            })
            .sort({ examDate: 1, startTime: 1 });

        res.status(200).json({
            success: true,
            examRoutines,
            count: examRoutines.length
        });

    } catch (error) {
        next(error);
    }
}));

// Get teacher's exam routine (where they are monitoring)
router.get("/teacher/my-exams", isAuthenticated, authorizeRoles("teacher"), catchAsyncErrors(async (req, res, next) => {
    try {
        const teacher = await Teacher.findOne({ user: req.user._id });
        if (!teacher) {
            return next(new ErrorHandler("Teacher not found", 404));
        }

        const examRoutines = await ExamRoutine.find({ 
            monitoringTeachers: teacher._id,
            isPublished: true,
            examDate: { $gte: new Date() }
        })
            .populate('subject', 'name code')
            .populate('class', 'name section')
            .populate({
                path: 'class',
                populate: { path: 'section', select: 'name' }
            })
            .populate('monitoringTeachers', 'user')
            .populate({
                path: 'monitoringTeachers',
                populate: { path: 'user', select: 'name' }
            })
            .sort({ examDate: 1, startTime: 1 });

        res.status(200).json({
            success: true,
            examRoutines,
            count: examRoutines.length
        });

    } catch (error) {
        next(error);
    }
}));

// Get class exam routine
router.get("/class/:classId", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
    try {
        const examRoutines = await ExamRoutine.find({ 
            class: req.params.classId,
            isPublished: true 
        })
            .populate('subject', 'name code')
            .populate('class', 'name section')
            .populate({
                path: 'class',
                populate: { path: 'section', select: 'name' }
            })
            .populate('monitoringTeachers', 'user')
            .populate({
                path: 'monitoringTeachers',
                populate: { path: 'user', select: 'name' }
            })
            .sort({ examDate: 1, startTime: 1 });

        res.status(200).json({
            success: true,
            examRoutines,
            count: examRoutines.length
        });

    } catch (error) {
        next(error);
    }
}));

// Publish/unpublish exam routine
router.put("/:id/publish", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
    try {
        const { isPublished } = req.body;

        const examRoutine = await ExamRoutine.findById(req.params.id);
        if (!examRoutine) {
            return next(new ErrorHandler("Exam routine not found", 404));
        }

        examRoutine.isPublished = isPublished;
        await examRoutine.save();

        res.status(200).json({
            success: true,
            message: `Exam routine ${isPublished ? 'published' : 'unpublished'} successfully`,
            examRoutine
        });

    } catch (error) {
        next(error);
    }
}));

module.exports = router;