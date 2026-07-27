// routes/resultSheetRoutes.js
const express = require("express");
const router = express.Router();
const ResultSheet = require("../models/ResultSheet");
const Result = require("../models/Result");
const Assignment = require("../models/Assignment");
const Grade = require("../models/Grade");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// 🎯 Generate result sheet for a student
router.post("/generate", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { student, class: classId, term, year } = req.body;

    if (!student || !classId || !term || !year) {
      return next(new ErrorHandler("Student, class, term, and year are required", 400));
    }

    // Check if result sheet already exists
    const existingSheet = await ResultSheet.findOne({
      student,
      class: classId,
      term,
      year
    });

    if (existingSheet) {
      return next(new ErrorHandler("Result sheet already exists for this term", 400));
    }

    // Get all exam results for the student in this term/year
    const examResults = await Result.find({
      student,
      term,
      year: parseInt(year),
      type: "exam"
    }).populate('exam', 'totalMarks').populate('subject', 'name code');

    // Get all assignment results for the student in this term/year
    const assignmentResults = await Result.find({
      student,
      term,
      year: parseInt(year),
      type: "assignment"
    }).populate('subject', 'name code');

    // Group results by subject
    const subjectResults = {};
    
    // Process exam results
    examResults.forEach(result => {
      const subjectId = result.subject._id.toString();
      if (!subjectResults[subjectId]) {
        subjectResults[subjectId] = {
          subject: result.subject,
          totalExamScore: 0,
          totalAssignmentScore: 0,
          examCount: 0,
          assignmentCount: 0
        };
      }
      subjectResults[subjectId].totalExamScore += result.marksObtained;
      subjectResults[subjectId].examCount++;
    });

    // Process assignment results
    assignmentResults.forEach(result => {
      const subjectId = result.subject._id.toString();
      if (!subjectResults[subjectId]) {
        subjectResults[subjectId] = {
          subject: result.subject,
          totalExamScore: 0,
          totalAssignmentScore: 0,
          examCount: 0,
          assignmentCount: 0
        };
      }
      subjectResults[subjectId].totalAssignmentScore += result.marksObtained;
      subjectResults[subjectId].assignmentCount++;
    });

    // Calculate totals and grades
    const results = [];
    let totalScore = 0;
    let totalPossible = 0;

    // Get grade scale
    const gradeScale = await Grade.find().sort({ minMarks: 1 });

    for (const [subjectId, data] of Object.entries(subjectResults)) {
      const total = data.totalExamScore + data.totalAssignmentScore;
      
      // Calculate percentage (assuming max 100 per subject for simplicity)
      // In real scenario, you might have different weighting
      const percentage = total; 
      
      // Find grade
      const gradeObj = gradeScale.find(g => percentage >= g.minMarks && percentage <= g.maxMarks) || gradeScale[gradeScale.length - 1];
      
      // Generate remarks
      const remarks = generateRemarks(percentage);

      results.push({
        subject: data.subject._id,
        totalExamScore: data.totalExamScore,
        totalAssignmentScore: data.totalAssignmentScore,
        total: total,
        grade: gradeObj.name,
        remarks: remarks
      });

      totalScore += total;
      totalPossible += 100; // Assuming each subject is out of 100
    }

    // Calculate overall average
    const overallAverage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

    // Find overall grade
    const overallGradeObj = gradeScale.find(g => overallAverage >= g.minMarks && overallAverage <= g.maxMarks) || gradeScale[gradeScale.length - 1];

    // Create result sheet
    const resultSheet = await ResultSheet.create({
      student,
      grade: overallGradeObj._id,
      class: classId,
      term,
      year: parseInt(year),
      results,
      overallAverage: Math.round(overallAverage * 100) / 100,
      position: 0, // Will be calculated after all sheets are generated
      isPublished: false
    });

    const populatedSheet = await ResultSheet.findById(resultSheet._id)
      .populate('student', 'name rollNumber')
      .populate('class', 'name')
      .populate('grade', 'name gradePoint')
      .populate('results.subject', 'name code');

    res.status(201).json({
      success: true,
      message: "Result sheet generated successfully",
      resultSheet: populatedSheet
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Generate result sheets for entire class
router.post("/generate-class", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { class: classId, term, year } = req.body;

    if (!classId || !term || !year) {
      return next(new ErrorHandler("Class, term, and year are required", 400));
    }

    // Get all students in the class
    const Student = require("../models/Student");
    const students = await Student.find({ class: classId });

    const generatedSheets = [];
    const errors = [];

    for (const student of students) {
      try {
        // Check if sheet already exists
        const existingSheet = await ResultSheet.findOne({
          student: student._id,
          class: classId,
          term,
          year: parseInt(year)
        });

        if (existingSheet) {
          errors.push(`Sheet already exists for ${student.name}`);
          continue;
        }

        // Generate sheet for this student (simplified - you might want to reuse the logic from above)
        const resultSheet = await ResultSheet.create({
          student: student._id,
          grade: await getOverallGrade(student._id, classId, term, year), // You'd implement this
          class: classId,
          term,
          year: parseInt(year),
          results: await calculateSubjectResults(student._id, classId, term, year), // You'd implement this
          overallAverage: await calculateOverallAverage(student._id, classId, term, year), // You'd implement this
          position: 0,
          isPublished: false
        });

        generatedSheets.push(resultSheet._id);
      } catch (error) {
        errors.push(`Failed to generate sheet for ${student.name}: ${error.message}`);
      }
    }

    // Calculate positions after all sheets are generated
    if (generatedSheets.length > 0) {
      await calculateClassPositions(classId, term, year);
    }

    res.status(200).json({
      success: true,
      message: `Generated ${generatedSheets.length} result sheets`,
      generated: generatedSheets.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get result sheets with filtering
router.get("/", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { student, class: classId, term, year, isPublished } = req.query;
    
    let filter = {};
    if (student) filter.student = student;
    if (classId) filter.class = classId;
    if (term) filter.term = term;
    if (year) filter.year = parseInt(year);
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';

    const resultSheets = await ResultSheet.find(filter)
      .populate('student', 'name rollNumber')
      .populate('class', 'name')
      .populate('grade', 'name gradePoint')
      .populate('results.subject', 'name code')
      .sort({ 'student.name': 1 });

    res.status(200).json({
      success: true,
      resultSheets,
      count: resultSheets.length
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get result sheet by ID
router.get("/:id", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const resultSheet = await ResultSheet.findById(req.params.id)
      .populate('student', 'name rollNumber')
      .populate('class', 'name')
      .populate('grade', 'name gradePoint minMarks maxMarks')
      .populate('results.subject', 'name code');

    if (!resultSheet) {
      return next(new ErrorHandler("Result sheet not found", 404));
    }

    res.status(200).json({
      success: true,
      resultSheet
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Publish result sheets
router.put("/publish", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { class: classId, term, year } = req.body;

    if (!classId || !term || !year) {
      return next(new ErrorHandler("Class, term, and year are required", 400));
    }

    const result = await ResultSheet.updateMany(
      {
        class: classId,
        term,
        year: parseInt(year)
      },
      {
        isPublished: true
      }
    );

    res.status(200).json({
      success: true,
      message: `Published ${result.modifiedCount} result sheets`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Unpublish result sheets
router.put("/unpublish", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { class: classId, term, year } = req.body;

    if (!classId || !term || !year) {
      return next(new ErrorHandler("Class, term, and year are required", 400));
    }

    const result = await ResultSheet.updateMany(
      {
        class: classId,
        term,
        year: parseInt(year)
      },
      {
        isPublished: false
      }
    );

    rec.status(200).json({
      success: true,
      message: `Unpublished ${result.modifiedCount} result sheets`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Update result sheet (manual override)
router.put("/:id", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { results, overallAverage, position, isPublished } = req.body;

    const resultSheet = await ResultSheet.findById(req.params.id);
    if (!resultSheet) {
      return next(new ErrorHandler("Result sheet not found", 404));
    }

    const updatedSheet = await ResultSheet.findByIdAndUpdate(
      req.params.id,
      {
        results: results || resultSheet.results,
        overallAverage: overallAverage || resultSheet.overallAverage,
        position: position || resultSheet.position,
        isPublished: isPublished !== undefined ? isPublished : resultSheet.isPublished
      },
      { new: true, runValidators: true }
    )
      .populate('student', 'name rollNumber')
      .populate('class', 'name')
      .populate('grade', 'name gradePoint')
      .populate('results.subject', 'name code');

    res.status(200).json({
      success: true,
      message: "Result sheet updated successfully",
      resultSheet: updatedSheet
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Delete result sheet
router.delete("/:id", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
  try {
    const resultSheet = await ResultSheet.findById(req.params.id);
    
    if (!resultSheet) {
      return next(new ErrorHandler("Result sheet not found", 404));
    }

    await ResultSheet.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Result sheet deleted successfully"
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get student's result sheets
router.get("/student/:studentId", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const resultSheets = await ResultSheet.find({ student: studentId })
      .populate('class', 'name')
      .populate('grade', 'name gradePoint')
      .populate('results.subject', 'name code')
      .sort({ year: -1, term: 1 });

    res.status(200).json({
      success: true,
      resultSheets,
      count: resultSheets.length
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get class result sheets for term
router.get("/class/:classId/term/:term/year/:year", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { classId, term, year } = req.params;

    const resultSheets = await ResultSheet.find({
      class: classId,
      term,
      year: parseInt(year)
    })
      .populate('student', 'name rollNumber')
      .populate('grade', 'name gradePoint')
      .populate('results.subject', 'name code')
      .sort({ position: 1 }); // Sort by position

    res.status(200).json({
      success: true,
      term,
      year: parseInt(year),
      class: classId,
      resultSheets,
      count: resultSheets.length,
      published: resultSheets.filter(sheet => sheet.isPublished).length
    });

  } catch (error) {
    next(error);
  }
}));

// Helper functions
function generateRemarks(percentage) {
  if (percentage >= 90) return "Excellent - Outstanding performance";
  if (percentage >= 80) return "Very Good - Consistent effort";
  if (percentage >= 70) return "Good - Satisfactory performance";
  if (percentage >= 60) return "Average - Needs improvement";
  if (percentage >= 50) return "Below Average - Requires attention";
  return "Poor - Immediate improvement needed";
}

// You would implement these helper functions:
async function calculateSubjectResults(studentId, classId, term, year) {
  // Implementation to calculate subject-wise results
  return [];
}

async function calculateOverallAverage(studentId, classId, term, year) {
  // Implementation to calculate overall average
  return 0;
}

async function getOverallGrade(studentId, classId, term, year) {
  // Implementation to get overall grade
  return null;
}

async function calculateClassPositions(classId, term, year) {
  const sheets = await ResultSheet.find({
    class: classId,
    term,
    year: parseInt(year)
  }).sort({ overallAverage: -1 });

  for (let i = 0; i < sheets.length; i++) {
    sheets[i].position = i + 1;
    await sheets[i].save();
  }
}

module.exports = router;

// const express = require("express");
// const Result = require("../models/Result");
// const ResultSheet = require("../models/ResultSheet");
// const Student = require("../models/Student");
// const Grade = require("../models/Grade");

// const router = express.Router();

// // 🧮 Helper: Convert score → grade & remarks
// function calculateGrade(score) {
//   if (score >= 80) return { grade: "A+", remarks: "Outstanding" };
//   if (score >= 70) return { grade: "A", remarks: "Excellent" };
//   if (score >= 60) return { grade: "B", remarks: "Very Good" };
//   if (score >= 50) return { grade: "C", remarks: "Good" };
//   if (score >= 40) return { grade: "D", remarks: "Needs Improvement" };
//   return { grade: "F", remarks: "Fail" };
// }



// /**
//  * @route GET /api/resultsheet/:studentId
//  * @desc Generate full result sheet for a student (grouped by exam)
//  * @access Private (admin/teacher/student)
//  */
// router.get("/:studentId", async (req, res) => {
//   const { studentId } = req.params;

//   try {
//     // 1️⃣ Find student
//     const student = await Student.findById(studentId)
//       .populate("class grade parent")
//       .lean();
//     if (!student)
//       return res.status(404).json({ success: false, message: "Student not found" });

//     // 2️⃣ Fetch all results for this student
//     const results = await Result.find({ student: studentId })
//       .populate("exam subject")
//       .lean();

//     if (!results.length)
//       return res.status(404).json({ success: false, message: "No results found" });

//     // 3️⃣ Fetch grading system (Grade table)
//     const grades = await Grade.find().sort({ minMarks: 1 }).lean();

//     // Helper to compute grade info
//     const getGrade = (mark) => {
//       const g = grades.find((gr) => mark >= gr.minMarks && mark <= gr.maxMarks);
//       return g ? { name: g.name, point: g.gradePoint } : { name: "N/A", point: 0 };
//     };

//     // 4️⃣ Group results by exam
//     const examMap = {};
//     for (const r of results) {
//       const examId = r.exam._id.toString();
//       if (!examMap[examId]) {
//         examMap[examId] = {
//           exam: {
//             id: r.exam._id,
//             title: r.exam.title,
//             date: r.exam.date,
//           },
//           subjects: [],
//           totalMarks: 0,
//           totalObtained: 0,
//         };
//       }

//       const subjectMark = {
//         subject: r.subject.name,
//         marksObtained: r.marksObtained,
//         grade: getGrade(r.marksObtained),
//       };

//       examMap[examId].subjects.push(subjectMark);
//       examMap[examId].totalMarks += r.exam.totalMarks;
//       examMap[examId].totalObtained += r.marksObtained;
//     }

//     // 5️⃣ Calculate average + overall grade
//     const exams = Object.values(examMap).map((e) => {
//       const avg = e.totalObtained / e.subjects.length;
//       const grade = getGrade(avg);
//       return {
//         ...e,
//         average: avg,
//         overallGrade: grade,
//       };
//     });

//     // 6️⃣ Construct final response
//     const resultSheet = {
//       success: true,
//       student: {
//         id: student._id,
//         name: student.name,
//         rollNumber: student.rollNumber,
//         class: student.class?.name,
//         grade: student.grade?.name,
//       },
//       exams,
//     };

//     res.json(resultSheet);
//   } catch (error) {
//     console.error("Error generating result sheet:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// /**
//  * 🧾 Generate Result Sheet for a Student
//  */
// router.post("/generate", async (req, res) => {
//   try {
//     const { studentId, gradeId, classId, term, year } = req.body;

//     // Fetch all raw results
//     const results = await Result.find({ student: studentId, term, year }).populate("subject");

//     if (!results.length) {
//       return res.status(404).json({ message: "No exam or assignment results found for this student." });
//     }

//     const subjectMap = {};

//     results.forEach((r) => {
//       if (!subjectMap[r.subject._id]) {
//         subjectMap[r.subject._id] = {
//           subject: r.subject._id,
//           totalExamScore: 0,
//           totalAssignmentScore: 0,
//           total: 0,
//         };
//       }

//       if (r.type === "exam") {
//         subjectMap[r.subject._id].totalExamScore += r.score;
//       } else if (r.type === "assignment") {
//         subjectMap[r.subject._id].totalAssignmentScore += r.score;
//       }

//       subjectMap[r.subject._id].total =
//         subjectMap[r.subject._id].totalExamScore + subjectMap[r.subject._id].totalAssignmentScore;

//       const { grade, remarks } = calculateGrade(subjectMap[r.subject._id].total);
//       subjectMap[r.subject._id].grade = grade;
//       subjectMap[r.subject._id].remarks = remarks;
//     });

//     const compiledResults = Object.values(subjectMap);
//     const overallAverage = compiledResults.reduce((sum, s) => sum + s.total, 0) / compiledResults.length;

//     const resultSheet = await ResultSheet.create({
//       student: studentId,
//       grade: gradeId,
//       class: classId,
//       term,
//       year,
//       results: compiledResults,
//       overallAverage,
//       isPublished: false, // default: not published
//     });

//     res.status(201).json({
//       success: true,
//       message: "Result sheet generated successfully",
//       data: resultSheet,
//     });
//   } catch (error) {
//     console.error("Error generating result sheet:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// });

// /**
//  * 📄 Get all result sheets
//  */
// router.get("/", async (req, res) => {
//   try {
//     const sheets = await ResultSheet.find()
//       .populate("student grade class results.subject")
//       .sort({ createdAt: -1 });
//     res.status(200).json(sheets);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// /**
//  * 📄 Get single student's result sheet
//  */
// router.get("/student/:studentId", async (req, res) => {
//   try {
//     const { studentId } = req.params;
//     const sheets = await ResultSheet.find({ student: studentId })
//       .populate("student grade class results.subject")
//       .sort({ createdAt: -1 });

//     if (!sheets.length) {
//       return res.status(404).json({ message: "No result sheets found for this student" });
//     }

//     res.status(200).json(sheets);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// /**
//  * 🟢 Publish or Unpublish a result sheet
//  * PATCH /api/resultsheets/:id/publish
//  */
// router.patch("/:id/publish", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { publish } = req.body; // true or false

//     const resultSheet = await ResultSheet.findById(id);
//     if (!resultSheet) {
//       return res.status(404).json({ message: "Result sheet not found" });
//     }

//     resultSheet.isPublished = publish;
//     await resultSheet.save();

//     res.status(200).json({
//       success: true,
//       message: publish ? "Result sheet published successfully" : "Result sheet unpublished",
//       data: resultSheet,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// module.exports = router;
