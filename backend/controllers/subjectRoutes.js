// routes/subjectRoutes.js
const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");
const Class = require("../models/Class"); // Added
const Teacher = require("../models/Teacher"); // Added
const Routine = require("../models/Routine"); // Added
const Assignment = require("../models/Assignment"); // Added
const Exam = require("../models/Exam"); // Added
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// 🎯 Create new subject with optional class assignment
router.post("/", 
  isAuthenticated, 
  authorizeRoles("admin"), 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { name, code, description, classes = [] } = req.body;

      if (!name) {
        return next(new ErrorHandler("Subject name is required", 400));
      }

      // Check if subject name already exists
      const existingSubject = await Subject.findOne({ name });
      if (existingSubject) {
        return next(new ErrorHandler("Subject with this name already exists", 400));
      }

      // Check if subject code already exists (if provided)
      if (code) {
        const existingCode = await Subject.findOne({ code });
        if (existingCode) {
          return next(new ErrorHandler("Subject with this code already exists", 400));
        }
      }

      // Validate classes if provided
      if (classes && classes.length > 0) {
        const validClasses = await Class.countDocuments({ _id: { $in: classes } });
        if (validClasses !== classes.length) {
          return next(new ErrorHandler("One or more class IDs are invalid", 400));
        }
      }

      const subject = await Subject.create({
        name,
        code,
        description,
        classes: classes || []
      });

      // Add subject to classes if specified
      if (classes.length > 0) {
        await Class.updateMany(
          { _id: { $in: classes } },
          { $addToSet: { subjects: subject._id } }
        );
      }

      const populatedSubject = await Subject.findById(subject._id)
        .populate('classes', 'name section academicYear');

      res.status(201).json({
        success: true,
        message: "Subject created successfully",
        subject: populatedSubject
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get all subjects with optional filtering
router.get("/", 
  isAuthenticated, 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { 
        classId, 
        search = "", 
        page = 1, 
        limit = 20,
        hasClasses // true/false filter
      } = req.query;

      const skip = (page - 1) * limit;

      // Build filter
      let filter = {};

      // Filter by class
      if (classId) {
        filter.classes = classId;
      }

      // Filter by whether subject has classes assigned
      if (hasClasses !== undefined) {
        if (hasClasses === 'true') {
          filter.classes = { $exists: true, $ne: [] };
        } else if (hasClasses === 'false') {
          filter.$or = [
            { classes: { $exists: false } },
            { classes: [] }
          ];
        }
      }

      // Search across multiple fields
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const [subjects, total] = await Promise.all([
        Subject.find(filter)
          .populate('classes', 'name section')
          .sort({ name: 1 })
          .skip(skip)
          .limit(parseInt(limit)),
        
        Subject.countDocuments(filter)
      ]);

      // Get statistics
      const subjectsWithClasses = await Subject.countDocuments({ 
        classes: { $exists: true, $ne: [] } 
      });
      const subjectsWithoutClasses = await Subject.countDocuments({ 
        $or: [
          { classes: { $exists: false } },
          { classes: [] }
        ]
      });

      res.status(200).json({
        success: true,
        subjects,
        count: subjects.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        statistics: {
          totalSubjects: total,
          withClasses: subjectsWithClasses,
          withoutClasses: subjectsWithoutClasses,
          classCoverage: total > 0 ? 
            Math.round((subjectsWithClasses / total) * 100) : 0
        }
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get subject by ID with detailed information
router.get("/:id", 
  isAuthenticated, 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const subject = await Subject.findById(req.params.id)
        .populate({
          path: 'classes',
          select: 'name section academicYear students supervisor',
          populate: [
            {
              path: 'supervisor',
              select: 'user designation',
              populate: {
                path: 'user',
                select: 'name'
              }
            },
            {
              path: 'students',
              select: 'name rollNumber',
              options: { limit: 5 }
            }
          ]
        });

      if (!subject) {
        return next(new ErrorHandler("Subject not found", 404));
      }

      // Get teachers who teach this subject
      const teachers = await Teacher.find({ subjects: subject._id })
        .populate('user', 'name email')
        .select('user designation');

      // Get routines for this subject
      const routines = await Routine.find({ subject: subject._id })
        .populate('class', 'name section')
        .populate('teacher', 'user')
        .populate({
          path: 'teacher',
          populate: { path: 'user', select: 'name' }
        })
        .limit(10)
        .sort({ day: 1, startTime: 1 });

      // Get recent assignments
      const recentAssignments = await Assignment.find({ subject: subject._id })
        .populate('class', 'name')
        .populate('createdBy', 'name')
        .sort({ dueDate: -1 })
        .limit(5);

      res.status(200).json({
        success: true,
        subject,
        relatedData: {
          teachers,
          routines: routines.length,
          recentAssignments,
          totalClasses: subject.classes.length,
          totalTeachers: teachers.length
        }
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Update subject with class management
router.put("/:id", 
  isAuthenticated, 
  authorizeRoles("admin"), 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { name, code, description, classes = [] } = req.body;

      const subject = await Subject.findById(req.params.id);
      if (!subject) {
        return next(new ErrorHandler("Subject not found", 404));
      }

      // Check name uniqueness if changing
      if (name && name !== subject.name) {
        const existingSubject = await Subject.findOne({ name });
        if (existingSubject) {
          return next(new ErrorHandler("Subject with this name already exists", 400));
        }
      }

      // Check code uniqueness if changing
      if (code && code !== subject.code) {
        const existingCode = await Subject.findOne({ code });
        if (existingCode) {
          return next(new ErrorHandler("Subject with this code already exists", 400));
        }
      }

      // Store old classes for cleanup
      const oldClasses = subject.classes.map(c => c.toString());
      const newClasses = classes || [];

      // Validate new classes
      if (newClasses.length > 0) {
        const validClasses = await Class.countDocuments({ _id: { $in: newClasses } });
        if (validClasses !== newClasses.length) {
          return next(new ErrorHandler("One or more class IDs are invalid", 400));
        }
      }

      // Update subject
      const updatedSubject = await Subject.findByIdAndUpdate(
        req.params.id,
        {
          name: name || subject.name,
          code: code || subject.code,
          description: description || subject.description,
          classes: newClasses
        },
        { new: true, runValidators: true }
      ).populate('classes', 'name section');

      // Update class-subject relationships
      // Remove subject from old classes that are no longer assigned
      const classesToRemove = oldClasses.filter(c => !newClasses.includes(c));
      if (classesToRemove.length > 0) {
        await Class.updateMany(
          { _id: { $in: classesToRemove } },
          { $pull: { subjects: subject._id } }
        );
      }

      // Add subject to new classes that weren't previously assigned
      const classesToAdd = newClasses.filter(c => !oldClasses.includes(c));
      if (classesToAdd.length > 0) {
        await Class.updateMany(
          { _id: { $in: classesToAdd } },
          { $addToSet: { subjects: subject._id } }
        );
      }

      res.status(200).json({
        success: true,
        message: "Subject updated successfully",
        subject: updatedSubject,
        changes: {
          classesAdded: classesToAdd.length,
          classesRemoved: classesToRemove.length
        }
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Delete subject with dependency checks
router.delete("/:id", 
  isAuthenticated, 
  authorizeRoles("admin"), 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const subject = await Subject.findById(req.params.id);
      
      if (!subject) {
        return next(new ErrorHandler("Subject not found", 404));
      }

      // Check if subject is used in any classes
      if (subject.classes.length > 0) {
        const classNames = await Class.find({ _id: { $in: subject.classes } })
          .select('name')
          .limit(3);
        
        const classList = classNames.map(c => c.name).join(', ');
        const more = subject.classes.length > 3 ? ` and ${subject.classes.length - 3} more` : '';
        
        return next(new ErrorHandler(
          `Cannot delete subject. It is assigned to ${subject.classes.length} classes (${classList}${more}). Remove from classes first.`, 
          400
        ));
      }

      // Check if subject has any routines
      const routineCount = await Routine.countDocuments({ subject: subject._id });
      if (routineCount > 0) {
        return next(new ErrorHandler(
          `Cannot delete subject. It has ${routineCount} scheduled routines. Delete routines first.`, 
          400
        ));
      }

      // Check if subject has any assignments
      const assignmentCount = await Assignment.countDocuments({ subject: subject._id });
      if (assignmentCount > 0) {
        return next(new ErrorHandler(
          `Cannot delete subject. It has ${assignmentCount} assignments. Delete assignments first.`, 
          400
        ));
      }

      // Check if subject has any exams
      const examCount = await Exam.countDocuments({ subject: subject._id });
      if (examCount > 0) {
        return next(new ErrorHandler(
          `Cannot delete subject. It has ${examCount} exams. Delete exams first.`, 
          400
        ));
      }

      // Remove subject from teachers' subjects array
      await Teacher.updateMany(
        { subjects: subject._id },
        { $pull: { subjects: subject._id } }
      );

      await Subject.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Subject deleted successfully"
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Search subjects with class filtering
router.get("/search/:query", 
  isAuthenticated, 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { query } = req.params;
      const { classId } = req.query;

      let filter = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { code: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      };

      // Filter by class if specified
      if (classId) {
        filter.classes = classId;
      }

      const subjects = await Subject.find(filter)
        .populate('classes', 'name section')
        .sort({ name: 1 })
        .limit(20);

      res.status(200).json({
        success: true,
        subjects,
        count: subjects.length
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get subjects by class
router.get("/by-class/:classId", 
  isAuthenticated, 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { classId } = req.params;

      const classExists = await Class.findById(classId);
      if (!classExists) {
        return next(new ErrorHandler("Class not found", 404));
      }

      const subjects = await Subject.find({ classes: classId })
        .populate('classes', 'name section')
        .sort({ name: 1 });

      res.status(200).json({
        success: true,
        class: {
          name: classExists.name,
          section: classExists.section,
          academicYear: classExists.academicYear
        },
        subjects,
        count: subjects.length
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Add subject to class
router.post("/:id/classes/:classId", 
  isAuthenticated, 
  authorizeRoles("admin", "teacher"), 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const subject = await Subject.findById(req.params.id);
      if (!subject) {
        return next(new ErrorHandler("Subject not found", 404));
      }

      const classData = await Class.findById(req.params.classId);
      if (!classData) {
        return next(new ErrorHandler("Class not found", 404));
      }

      // Check if subject is already assigned to this class
      if (subject.classes.includes(req.params.classId)) {
        return next(new ErrorHandler("Subject already assigned to this class", 400));
      }

      // Add class to subject
      subject.classes.push(req.params.classId);
      await subject.save();

      // Add subject to class
      classData.subjects.push(subject._id);
      await classData.save();

      const populatedSubject = await Subject.findById(subject._id)
        .populate('classes', 'name section');

      res.status(200).json({
        success: true,
        message: `Subject "${subject.name}" added to class "${classData.name}" successfully`,
        subject: populatedSubject
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Remove subject from class
router.delete("/:id/classes/:classId", 
  isAuthenticated, 
  authorizeRoles("admin", "teacher"), 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const subject = await Subject.findById(req.params.id);
      if (!subject) {
        return next(new ErrorHandler("Subject not found", 404));
      }

      const classData = await Class.findById(req.params.classId);
      if (!classData) {
        return next(new ErrorHandler("Class not found", 404));
      }

      // Check if subject is assigned to this class
      if (!subject.classes.includes(req.params.classId)) {
        return next(new ErrorHandler("Subject not assigned to this class", 404));
      }

      // Remove class from subject
      subject.classes = subject.classes.filter(
        c => c.toString() !== req.params.classId
      );
      await subject.save();

      // Remove subject from class
      classData.subjects = classData.subjects.filter(
        s => s.toString() !== subject._id.toString()
      );
      await classData.save();

      const populatedSubject = await Subject.findById(subject._id)
        .populate('classes', 'name section');

      res.status(200).json({
        success: true,
        message: `Subject "${subject.name}" removed from class "${classData.name}" successfully`,
        subject: populatedSubject
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get subjects statistics with detailed information
router.get("/stats/count", 
  isAuthenticated, 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const totalSubjects = await Subject.countDocuments();
      const subjectsWithClasses = await Subject.countDocuments({ 
        classes: { $exists: true, $ne: [] } 
      });
      const subjectsWithCode = await Subject.countDocuments({ 
        code: { $exists: true, $ne: null } 
      });

      // Get most popular subjects (by number of classes)
      const popularSubjects = await Subject.aggregate([
        {
          $project: {
            name: 1,
            code: 1,
            classCount: { $size: { $ifNull: ["$classes", []] } }
          }
        },
        { $sort: { classCount: -1 } },
        { $limit: 5 }
      ]);

      res.status(200).json({
        success: true,
        statistics: {
          totalSubjects,
          subjectsWithClasses,
          subjectsWithoutClasses: totalSubjects - subjectsWithClasses,
          subjectsWithCode,
          classCoverage: totalSubjects > 0 ? 
            Math.round((subjectsWithClasses / totalSubjects) * 100) : 0,
          popularSubjects
        }
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get subjects without classes assigned
router.get("/without-classes", 
  isAuthenticated, 
  authorizeRoles("admin"), 
  catchAsyncErrors(async (req, res, next) => {
    try {
      const subjects = await Subject.find({
        $or: [
          { classes: { $exists: false } },
          { classes: [] }
        ]
      })
        .sort({ name: 1 });

      res.status(200).json({
        success: true,
        subjects,
        count: subjects.length
      });

    } catch (error) {
      next(error);
    }
  })
);

module.exports = router;

// // routes/subjectRoutes.js
// const express = require("express");
// const router = express.Router();
// const Subject = require("../models/Subject");
// const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
// const ErrorHandler = require("../utils/ErrorHandler");
// const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// // 🎯 Create new subject
// router.post("/", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { name, code, description } = req.body;

//     if (!name) {
//       return next(new ErrorHandler("Subject name is required", 400));
//     }

//     // Check if subject name already exists
//     const existingSubject = await Subject.findOne({ name });
//     if (existingSubject) {
//       return next(new ErrorHandler("Subject with this name already exists", 400));
//     }

//     // Check if subject code already exists (if provided)
//     if (code) {
//       const existingCode = await Subject.findOne({ code });
//       if (existingCode) {
//         return next(new ErrorHandler("Subject with this code already exists", 400));
//       }
//     }

//     const subject = await Subject.create({
//       name,
//       code,
//       description
//     });

//     res.status(201).json({
//       success: true,
//       message: "Subject created successfully",
//       subject
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// // 🎯 Get all subjects
// router.get("/", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const subjects = await Subject.find().sort({ name: 1 });

//     res.status(200).json({
//       success: true,
//       subjects,
//       count: subjects.length
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// // 🎯 Get subject by ID
// router.get("/:id", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const subject = await Subject.findById(req.params.id);

//     if (!subject) {
//       return next(new ErrorHandler("Subject not found", 404));
//     }

//     res.status(200).json({
//       success: true,
//       subject
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// // 🎯 Update subject
// router.put("/:id", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { name, code, description } = req.body;

//     const subject = await Subject.findById(req.params.id);
//     if (!subject) {
//       return next(new ErrorHandler("Subject not found", 404));
//     }

//     // Check name uniqueness if changing
//     if (name && name !== subject.name) {
//       const existingSubject = await Subject.findOne({ name });
//       if (existingSubject) {
//         return next(new ErrorHandler("Subject with this name already exists", 400));
//       }
//     }

//     // Check code uniqueness if changing
//     if (code && code !== subject.code) {
//       const existingCode = await Subject.findOne({ code });
//       if (existingCode) {
//         return next(new ErrorHandler("Subject with this code already exists", 400));
//       }
//     }

//     const updatedSubject = await Subject.findByIdAndUpdate(
//       req.params.id,
//       {
//         name: name || subject.name,
//         code: code || subject.code,
//         description: description || subject.description
//       },
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Subject updated successfully",
//       subject: updatedSubject
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// // 🎯 Delete subject
// router.delete("/:id", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
//   try {
//     const subject = await Subject.findById(req.params.id);
    
//     if (!subject) {
//       return next(new ErrorHandler("Subject not found", 404));
//     }

//     // TODO: Check if subject is used in any classes or routines before deletion
//     // You might want to add this check later

//     await Subject.findByIdAndDelete(req.params.id);

//     res.status(200).json({
//       success: true,
//       message: "Subject deleted successfully"
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// // 🎯 Search subjects
// router.get("/search/:query", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { query } = req.params;

//     const subjects = await Subject.find({
//       $or: [
//         { name: { $regex: query, $options: 'i' } },
//         { code: { $regex: query, $options: 'i' } },
//         { description: { $regex: query, $options: 'i' } }
//       ]
//     }).sort({ name: 1 });

//     res.status(200).json({
//       success: true,
//       subjects,
//       count: subjects.length
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// // 🎯 Get subjects statistics (optional)
// router.get("/stats/count", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const totalSubjects = await Subject.countDocuments();

//     res.status(200).json({
//       success: true,
//       totalSubjects
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// module.exports = router;