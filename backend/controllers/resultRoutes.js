// routes/resultRoutes.js
const express = require("express");
const router = express.Router();
const Result = require("../models/Result");
const Exam = require("../models/Exam");
const Student = require("../models/Student");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// 🎯 Submit/Update student result
router.post("/submit", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { exam, student, subject, marksObtained, term, year, type = "exam" } = req.body;

    if (!exam || !student || !subject || !marksObtained || !term || !year) {
      return next(new ErrorHandler("All required fields must be filled", 400));
    }

    // Validate marks are within exam total marks
    const examData = await Exam.findById(exam);
    if (!examData) {
      return next(new ErrorHandler("Exam not found", 404));
    }

    if (marksObtained < 0 || marksObtained > examData.totalMarks) {
      return next(new ErrorHandler(`Marks must be between 0 and ${examData.totalMarks}`, 400));
    }

    // Check if result already exists
    const existingResult = await Result.findOne({
      exam,
      student,
      subject
    });

    if (existingResult) {
      // Update existing result
      existingResult.marksObtained = marksObtained;
      existingResult.term = term;
      existingResult.year = year;
      existingResult.type = type;
      await existingResult.save();

      const populatedResult = await Result.findById(existingResult._id)
        .populate('student', 'name rollNumber')
        .populate('exam', 'title totalMarks')
        .populate('subject', 'name code');

      res.status(200).json({
        success: true,
        message: "Result updated successfully",
        result: populatedResult
      });
    } else {
      // Create new result
      const result = await Result.create({
        exam,
        student,
        subject,
        marksObtained,
        term,
        year,
        type,
        score: marksObtained // For compatibility
      });

      const populatedResult = await Result.findById(result._id)
        .populate('student', 'name rollNumber')
        .populate('exam', 'title totalMarks')
        .populate('subject', 'name code');

      res.status(201).json({
        success: true,
        message: "Result submitted successfully",
        result: populatedResult
      });
    }

  } catch (error) {
    next(error);
  }
}));

// 🎯 Bulk submit results
router.post("/bulk-submit", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { exam, subject, term, year, results } = req.body;

    if (!exam || !subject || !term || !year || !results || !Array.isArray(results)) {
      return next(new ErrorHandler("All required fields must be filled", 400));
    }

    const examData = await Exam.findById(exam);
    if (!examData) {
      return next(new ErrorHandler("Exam not found", 404));
    }

    const processedResults = [];
    const errors = [];

    for (const resultData of results) {
      try {
        const { studentId, marksObtained } = resultData;

        if (!studentId || marksObtained === undefined) {
          errors.push(`Invalid data for student: ${studentId}`);
          continue;
        }

        // Validate marks
        if (marksObtained < 0 || marksObtained > examData.totalMarks) {
          errors.push(`Student ${studentId}: Marks must be between 0 and ${examData.totalMarks}`);
          continue;
        }

        // Check if result exists
        const existingResult = await Result.findOne({
          exam,
          student: studentId,
          subject
        });

        if (existingResult) {
          existingResult.marksObtained = marksObtained;
          existingResult.term = term;
          existingResult.year = year;
          await existingResult.save();
          processedResults.push({ studentId, action: 'updated' });
        } else {
          await Result.create({
            exam,
            student: studentId,
            subject,
            marksObtained,
            term,
            year,
            type: "exam",
            score: marksObtained
          });
          processedResults.push({ studentId, action: 'created' });
        }
      } catch (error) {
        errors.push(`Failed to process student ${resultData.studentId}: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed ${processedResults.length} results`,
      processed: processedResults,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get results with filtering
router.get("/", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { exam, student, subject, class: classId, term, year } = req.query;
    
    let filter = {};
    if (exam) filter.exam = exam;
    if (student) filter.student = student;
    if (subject) filter.subject = subject;
    if (term) filter.term = term;
    if (year) filter.year = parseInt(year);

    // If class is provided, get students from that class first
    if (classId) {
      const students = await Student.find({ class: classId }).select('_id');
      const studentIds = students.map(s => s._id);
      filter.student = { $in: studentIds };
    }

    const results = await Result.find(filter)
      .populate('student', 'name rollNumber class')
      .populate('exam', 'title totalMarks date')
      .populate('subject', 'name code')
      .sort({ 'student.name': 1 });

    res.status(200).json({
      success: true,
      results,
      count: results.length
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get student's results
router.get("/student/:studentId", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { term, year } = req.query;

    let filter = { student: studentId };
    if (term) filter.term = term;
    if (year) filter.year = parseInt(year);

    const results = await Result.find(filter)
      .populate('exam', 'title totalMarks date')
      .populate('subject', 'name code')
      .sort({ 'exam.date': -1 });

    // Calculate statistics
    const totalExams = results.length;
    const totalMarks = results.reduce((sum, result) => sum + result.marksObtained, 0);
    const averageMarks = totalExams > 0 ? totalMarks / totalExams : 0;

    // Group by term and year
    const termResults = {};
    results.forEach(result => {
      const key = `${result.term}-${result.year}`;
      if (!termResults[key]) {
        termResults[key] = [];
      }
      termResults[key].push(result);
    });

    res.status(200).json({
      success: true,
      results,
      statistics: {
        totalExams,
        totalMarks,
        averageMarks: Math.round(averageMarks * 100) / 100
      },
      termResults
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get class results for an exam
router.get("/exam/:examId/class/:classId", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { examId, classId } = req.params;

    // Get all students in the class
    const students = await Student.find({ class: classId })
      .populate('class', 'name')
      .sort({ rollNumber: 1 });

    // Get results for these students in this exam
    const results = await Result.find({
      exam: examId,
      student: { $in: students.map(s => s._id) }
    })
      .populate('subject', 'name code');

    // Combine student data with results
    const classResults = students.map(student => {
      const studentResult = results.find(r => r.student.toString() === student._id.toString());
      return {
        student: {
          _id: student._id,
          name: student.name,
          rollNumber: student.rollNumber
        },
        result: studentResult || null,
        hasResult: !!studentResult
      };
    });

    const exam = await Exam.findById(examId)
      .populate('subject', 'name code');

    res.status(200).json({
      success: true,
      exam,
      class: students[0]?.class,
      results: classResults,
      submitted: classResults.filter(r => r.hasResult).length,
      total: classResults.length
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get result by ID
router.get("/:id", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('student', 'name rollNumber class')
      .populate('exam', 'title totalMarks date')
      .populate('subject', 'name code');

    if (!result) {
      return next(new ErrorHandler("Result not found", 404));
    }

    res.status(200).json({
      success: true,
      result
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Update result
router.put("/:id", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { marksObtained, term, year } = req.body;

    const result = await Result.findById(req.params.id);
    if (!result) {
      return next(new ErrorHandler("Result not found", 404));
    }

    // Validate marks if provided
    if (marksObtained !== undefined) {
      const exam = await Exam.findById(result.exam);
      if (marksObtained < 0 || marksObtained > exam.totalMarks) {
        return next(new ErrorHandler(`Marks must be between 0 and ${exam.totalMarks}`, 400));
      }
    }

    const updatedResult = await Result.findByIdAndUpdate(
      req.params.id,
      {
        marksObtained: marksObtained || result.marksObtained,
        term: term || result.term,
        year: year || result.year,
        score: marksObtained || result.score
      },
      { new: true, runValidators: true }
    )
      .populate('student', 'name rollNumber')
      .populate('exam', 'title totalMarks')
      .populate('subject', 'name code');

    res.status(200).json({
      success: true,
      message: "Result updated successfully",
      result: updatedResult
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Delete result
router.delete("/:id", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);
    
    if (!result) {
      return next(new ErrorHandler("Result not found", 404));
    }

    await Result.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Result deleted successfully"
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get class performance summary
router.get("/class/:classId/summary", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { term, year } = req.query;

    if (!term || !year) {
      return next(new ErrorHandler("Term and year are required", 400));
    }

    // Get all students in the class
    const students = await Student.find({ class: classId })
      .populate('class', 'name');

    // Get all results for these students in the given term/year
    const results = await Result.find({
      student: { $in: students.map(s => s._id) },
      term,
      year: parseInt(year)
    })
      .populate('exam', 'title totalMarks date')
      .populate('subject', 'name code');

    // Calculate performance per student
    const studentPerformance = students.map(student => {
      const studentResults = results.filter(r => r.student.toString() === student._id.toString());
      
      const totalMarks = studentResults.reduce((sum, result) => sum + result.marksObtained, 0);
      const totalPossible = studentResults.reduce((sum, result) => sum + result.exam.totalMarks, 0);
      const averagePercentage = totalPossible > 0 ? (totalMarks / totalPossible) * 100 : 0;

      // Calculate subject-wise performance
      const subjectPerformance = {};
      studentResults.forEach(result => {
        const percentage = (result.marksObtained / result.exam.totalMarks) * 100;
        subjectPerformance[result.subject.name] = {
          marks: result.marksObtained,
          total: result.exam.totalMarks,
          percentage: Math.round(percentage * 100) / 100
        };
      });

      return {
        student: {
          _id: student._id,
          name: student.name,
          rollNumber: student.rollNumber
        },
        totalExams: studentResults.length,
        totalMarks,
        totalPossible,
        averagePercentage: Math.round(averagePercentage * 100) / 100,
        subjectPerformance
      };
    });

    // Sort by average percentage (highest first)
    studentPerformance.sort((a, b) => b.averagePercentage - a.averagePercentage);

    // Add rank
    studentPerformance.forEach((performance, index) => {
      performance.rank = index + 1;
    });

    // Class statistics
    const classStats = {
      totalStudents: studentPerformance.length,
      classAverage: studentPerformance.length > 0 
        ? studentPerformance.reduce((sum, p) => sum + p.averagePercentage, 0) / studentPerformance.length 
        : 0,
      topPerformer: studentPerformance[0] || null,
      subjects: [...new Set(results.map(r => r.subject.name))]
    };

    res.status(200).json({
      success: true,
      term,
      year: parseInt(year),
      class: students[0]?.class,
      performance: studentPerformance,
      statistics: classStats
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get result statistics
router.get("/stats/overview", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
    try {
        const { class: classId, term, year } = req.query;

        let filter = {};
        if (classId) {
            // Ensure Student model is available and imported
            const students = await Student.find({ class: classId }).select('_id');
            filter.student = { $in: students.map(s => s._id) };
        }
        if (term) filter.term = term;
        if (year) filter.year = parseInt(year);

        const results = await Result.find(filter)
            .populate('student', 'name class')
            .populate('exam', 'title totalMarks')
            .populate('subject', 'name');

        // Basic statistics
        const totalResults = results.length;
        
        // Use optional chaining and filter to safely handle broken references
        const validResults = results.filter(r => r.student && r.exam && r.subject);

        // Calculate total students from valid results
        const totalStudents = [...new Set(validResults.map(r => r.student._id.toString()))].length;
        
        // FIX APPLIED HERE: Filter out null/broken subject references before mapping
        const totalSubjects = [
            ...new Set(
                validResults
                    .map(r => r.subject.name)
            )
        ].length; 

        // Performance distribution
        const performance = {
            excellent: 0, // 90-100%
            good: 0,      // 75-89%
            average: 0,   // 50-74%
            poor: 0       // Below 50%
        };

        // Iterate over valid results only
        validResults.forEach(result => {
            const percentage = (result.marksObtained / result.exam.totalMarks) * 100;
            if (percentage >= 90) performance.excellent++;
            else if (percentage >= 75) performance.good++;
            else if (percentage >= 50) performance.average++;
            else performance.poor++;
        });

        res.status(200).json({
            success: true,
            statistics: {
                totalResults,
                totalStudents,
                totalSubjects,
                performance
            }
        });

    } catch (error) {
        console.log("error:", error)
        next(error);
    }
}));
module.exports = router;

// const express = require("express");
// const router = express.Router();
// const Result = require("../models/Result");
// const Student = require("../models/Student");
// const Exam = require("../models/Exam");
// const { isAuthenticated, isAdmin } = require("../middleware/auth");

// // ✅ Create or update student result
// router.post("/upsert", isAuthenticated, isAdmin("teacher", "admin"), async (req, res) => {
//   try {
//     const { studentId, examId, subjectId, marksObtained } = req.body;

//     const result = await Result.findOneAndUpdate(
//       { student: studentId, exam: examId, subject: subjectId },
//       { marksObtained },
//       { new: true, upsert: true }
//     );

//     res.status(200).json({ success: true, message: "Result saved", result });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Error saving result" });
//   }
// });

// // ✅ Get student result sheet
// router.get("/student/:studentId", isAuthenticated, async (req, res) => {
//   try {
//     const results = await Result.find({ student: req.params.studentId })
//       .populate("exam subject", "title name totalMarks")
//       .sort({ createdAt: -1 });

//     res.status(200).json({ success: true, results });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Error fetching results" });
//   }
// });

// module.exports = router;
