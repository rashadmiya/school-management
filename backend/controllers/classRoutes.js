// routes/classRoutes.js
const express = require("express");
const router = express.Router();
const Class = require("../models/Class");
const Section = require("../models/Section");
const Subject = require("../models/Subject"); // Added
const Teacher = require("../models/Teacher"); // Added
const Student = require("../models/Student"); // Added
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// Create class
router.post("/create", 
  isAuthenticated, 
  authorizeRoles("admin"), 
  catchAsyncErrors(async (req, res, next) => {
    const { name, section, supervisor, subjects, academicYear } = req.body;

    if (!name || !section) {
      return next(new ErrorHandler("Class name and section are required", 400));
    }

    // Validate section exists
    const sectionExists = await Section.findById(section);
    if (!sectionExists) {
      return next(new ErrorHandler("Section not found", 404));
    }

    // Validate supervisor if provided
    if (supervisor) {
      const teacherExists = await Teacher.findById(supervisor);
      if (!teacherExists) {
        return next(new ErrorHandler("Teacher not found", 404));
      }
    }

    // Validate subjects if provided
    if (subjects && subjects.length > 0) {
      const validSubjects = await Subject.countDocuments({ _id: { $in: subjects } });
      if (validSubjects !== subjects.length) {
        return next(new ErrorHandler("One or more subject IDs are invalid", 400));
      }
    }

    const currentYear = new Date().getFullYear();
    const defaultAcademicYear = `${currentYear}-${currentYear + 1}`;
    const finalAcademicYear = academicYear || defaultAcademicYear;

    // Check for duplicate class (name + section + academicYear)
    const existingClass = await Class.findOne({ 
      name, 
      section, 
      academicYear: finalAcademicYear 
    });
    
    if (existingClass) {
      return next(new ErrorHandler(
        `Class "${name}" already exists in section "${sectionExists.name}" for academic year ${finalAcademicYear}`, 
        400
      ));
    }

    const newClass = await Class.create({
      name,
      section,
      supervisor: supervisor || null,
      subjects: subjects || [],
      academicYear: finalAcademicYear
    });

    // Populate section name for supervisor population
    const populatedClass = await Class.findById(newClass._id)
      .populate('section', 'name')
      .populate({
        path: 'supervisor',
        select: 'user designation',
        populate: {
          path: 'user',
          select: 'name email phoneNumber'
        }
      })
      .populate('subjects', 'name code')
      .populate('students', 'name rollNumber guardianContact');

    res.status(201).json({ 
      success: true, 
      message: "Class created successfully", 
      class: populatedClass 
    });
}));

// Get all classes with advanced search
router.get("/all", 
  isAuthenticated, 
  catchAsyncErrors(async (req, res, next) => {
    const { 
      academicYear, 
      name, 
      section, 
      supervisor,
      page = 1, 
      limit = 20,
      search = ""
    } = req.query;

    const skip = (page - 1) * limit;

    // Build filter
    let filter = {};
    
    if (academicYear) filter.academicYear = academicYear;
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (section) filter.section = section;
    if (supervisor) filter.supervisor = supervisor;
    
    // Search across multiple fields
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { academicYear: { $regex: search, $options: 'i' } }
      ];
    }

    const [classes, total] = await Promise.all([
      Class.find(filter)
        .populate('section', 'name capacity')
        .populate({
          path: 'supervisor',
          select: 'user designation',
          populate: {
            path: 'user',
            select: 'name email phoneNumber'
          }
        })
        .populate('subjects', 'name code')
        .populate('students', 'name rollNumber')
        .sort({ academicYear: -1, name: 1, 'section.name': 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      
      Class.countDocuments(filter)
    ]);

    // Get statistics
    const currentYear = new Date().getFullYear();
    const currentAcademicYear = `${currentYear}-${currentYear + 1}`;
    
    const totalClasses = await Class.countDocuments();
    const activeClasses = await Class.countDocuments({ 
      academicYear: currentAcademicYear 
    });
    const classesWithSupervisor = await Class.countDocuments({ 
      supervisor: { $exists: true, $ne: null } 
    });

    res.status(200).json({ 
      success: true, 
      classes, 
      count: classes.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      statistics: {
        totalClasses,
        activeClasses,
        classesWithSupervisor,
        supervisorCoverage: totalClasses > 0 ? 
          Math.round((classesWithSupervisor / totalClasses) * 100) : 0
      }
    });
}));

// Get class by ID with detailed information
router.get("/single/:id", 
  isAuthenticated, 
  catchAsyncErrors(async (req, res, next) => {
    const classData = await Class.findById(req.params.id)
      .populate('section', 'name capacity currentStrength')
      .populate({
        path: 'supervisor',
        select: 'user designation joiningDate phoneNumber',
        populate: {
          path: 'user',
          select: 'name email phoneNumber'
        }
      })
      .populate('subjects', 'name code description classes')
      .populate({
        path: 'students',
        select: 'name rollNumber guardianContact gender dateOfBirth religion session photo',
        options: { sort: { rollNumber: 1 } }
      });

    if (!classData) {
      return next(new ErrorHandler("Class not found", 404));
    }

    // Get subject statistics
    const subjectStats = await Promise.all(
      classData.subjects.map(async (subject) => {
        const teachers = await Teacher.countDocuments({ 
          subjects: subject._id,
          classes: classData._id
        });
        return {
          subjectId: subject._id,
          subjectName: subject.name,
          teachersCount: teachers
        };
      })
    );

    // Get attendance statistics for recent month
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceStats = {
      totalAttendanceRecords: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0
    };

    res.status(200).json({ 
      success: true, 
      class: classData,
      statistics: {
        totalStudents: classData.students.length,
        totalSubjects: classData.subjects.length,
        maleStudents: classData.students.filter(s => s.gender === 'male').length,
        femaleStudents: classData.students.filter(s => s.gender === 'female').length,
        otherGenderStudents: classData.students.filter(s => s.gender === 'other').length,
        subjectStats,
        attendanceStats
      }
    });
}));

// Update class
router.put("/update/:id", 
  isAuthenticated, 
  authorizeRoles("admin", "teacher"), 
  catchAsyncErrors(async (req, res, next) => {
    const { name, section, supervisor, subjects, academicYear } = req.body;

    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return next(new ErrorHandler("Class not found", 404));
    }

    // Validate section if changing
    if (section && section !== classData.section.toString()) {
      const sectionExists = await Section.findById(section);
      if (!sectionExists) {
        return next(new ErrorHandler('Section not found', 404));
      }
      
      // Check for duplicate class in new section
      const existingClass = await Class.findOne({ 
        name: name || classData.name, 
        section, 
        academicYear: academicYear || classData.academicYear,
        _id: { $ne: classData._id }
      });
      
      if (existingClass) {
        const sectionName = sectionExists.name;
        return next(new ErrorHandler(
          `Class "${name || classData.name}" already exists in section "${sectionName}"`, 
          400
        ));
      }
    }

    // Validate supervisor if changing
    if (supervisor && supervisor !== classData.supervisor?.toString()) {
      const teacherExists = await Teacher.findById(supervisor);
      if (!teacherExists) {
        return next(new ErrorHandler("Teacher not found", 404));
      }
    }

    // Validate subjects if provided
    if (subjects) {
      const validSubjects = await Subject.countDocuments({ _id: { $in: subjects } });
      if (validSubjects !== subjects.length) {
        return next(new ErrorHandler("One or more subject IDs are invalid", 400));
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (section !== undefined) updateData.section = section;
    if (supervisor !== undefined) updateData.supervisor = supervisor;
    if (subjects !== undefined) updateData.subjects = subjects;
    if (academicYear !== undefined) updateData.academicYear = academicYear;

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('section', 'name')
      .populate({
        path: 'supervisor',
        select: 'user designation',
        populate: {
          path: 'user',
          select: 'name email phoneNumber'
        }
      })
      .populate('subjects', 'name code')
      .populate('students', 'name rollNumber guardianContact');

    res.status(200).json({ 
      success: true, 
      message: "Class updated successfully", 
      class: updatedClass 
    });
}));

// Delete class (only if no students)
router.delete("/delete/:id", 
  isAuthenticated, 
  authorizeRoles("admin"), 
  catchAsyncErrors(async (req, res, next) => {
    const classData = await Class.findById(req.params.id);
    
    if (!classData) {
      return next(new ErrorHandler("Class not found", 404));
    }
    
    if (classData.students.length > 0) {
      return next(new ErrorHandler(
        `Cannot delete class with ${classData.students.length} students. Remove students first.`, 
        400
      ));
    }
    
    // Remove class reference from teachers
    await Teacher.updateMany(
      { classes: classData._id },
      { $pull: { classes: classData._id } }
    );
    
    // Remove class reference from subjects
    await Subject.updateMany(
      { classes: classData._id },
      { $pull: { classes: classData._id } }
    );
    
    await Class.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ 
      success: true, 
      message: "Class deleted successfully" 
    });
}));

// Add student to class (with validation)
router.post("/:id/students", 
  isAuthenticated, 
  authorizeRoles("admin", "teacher"), 
  catchAsyncErrors(async (req, res, next) => {
    const { studentId } = req.body;
    
    if (!studentId) {
      return next(new ErrorHandler("Student ID is required", 400));
    }

    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return next(new ErrorHandler("Class not found", 404));
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    // Check if student is already in this class
    if (classData.students.includes(studentId)) {
      return next(new ErrorHandler("Student already in this class", 400));
    }

    // Check if student is already in another class in same academic year
    const existingClass = await Class.findOne({
      students: studentId,
      academicYear: classData.academicYear,
      _id: { $ne: classData._id }
    });
    
    if (existingClass) {
      return next(new ErrorHandler(
        `Student is already enrolled in class "${existingClass.name}" for academic year ${classData.academicYear}`, 
        400
      ));
    }

    // Add student to class
    classData.students.push(studentId);
    await classData.save();

    // Update student's class reference
    student.class = classData._id;
    await student.save();

    const updatedClass = await Class.findById(req.params.id)
      .populate('students', 'name rollNumber gender guardianContact');

    res.status(200).json({ 
      success: true, 
      message: "Student added to class successfully", 
      class: updatedClass 
    });
}));

// Remove student from class
router.delete("/:id/students/:studentId", 
  isAuthenticated, 
  authorizeRoles("admin", "teacher"), 
  catchAsyncErrors(async (req, res, next) => {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return next(new ErrorHandler("Class not found", 404));
    }

    const studentId = req.params.studentId;
    
    // Check if student is in this class
    if (!classData.students.includes(studentId)) {
      return next(new ErrorHandler("Student not found in this class", 404));
    }

    // Remove student from class
    classData.students = classData.students.filter(
      student => student.toString() !== studentId
    );
    await classData.save();

    // Remove class reference from student
    await Student.findByIdAndUpdate(
      studentId,
      { $unset: { class: "" } },
      { new: true }
    );

    const updatedClass = await Class.findById(req.params.id)
      .populate('students', 'name rollNumber gender');

    res.status(200).json({ 
      success: true, 
      message: "Student removed from class successfully", 
      class: updatedClass 
    });
}));

// Add subject to class
router.post("/:id/subjects", 
  isAuthenticated, 
  authorizeRoles("admin", "teacher"), 
  catchAsyncErrors(async (req, res, next) => {
    const { subjectId } = req.body;
    
    if (!subjectId) {
      return next(new ErrorHandler("Subject ID is required", 400));
    }

    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return next(new ErrorHandler("Class not found", 404));
    }

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return next(new ErrorHandler("Subject not found", 404));
    }

    // Check if subject is already assigned to this class
    if (classData.subjects.includes(subjectId)) {
      return next(new ErrorHandler("Subject already assigned to this class", 400));
    }

    // Add subject to class
    classData.subjects.push(subjectId);
    await classData.save();

    // Add class to subject's classes array
    subject.classes.push(classData._id);
    await subject.save();

    const updatedClass = await Class.findById(req.params.id)
      .populate('subjects', 'name code');

    res.status(200).json({ 
      success: true, 
      message: "Subject added to class successfully", 
      class: updatedClass 
    });
}));

// Remove subject from class
router.delete("/:id/subjects/:subjectId", 
  isAuthenticated, 
  authorizeRoles("admin", "teacher"), 
  catchAsyncErrors(async (req, res, next) => {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return next(new ErrorHandler("Class not found", 404));
    }

    const subjectId = req.params.subjectId;
    
    // Check if subject is assigned to this class
    if (!classData.subjects.includes(subjectId)) {
      return next(new ErrorHandler("Subject not assigned to this class", 404));
    }

    // Remove subject from class
    classData.subjects = classData.subjects.filter(
      subject => subject.toString() !== subjectId
    );
    await classData.save();

    // Remove class from subject's classes array
    await Subject.findByIdAndUpdate(
      subjectId,
      { $pull: { classes: classData._id } },
      { new: true }
    );

    const updatedClass = await Class.findById(req.params.id)
      .populate('subjects', 'name code');

    res.status(200).json({ 
      success: true, 
      message: "Subject removed from class successfully", 
      class: updatedClass 
    });
}));

// Get class statistics (enhanced)
router.get("/:id/stats", 
  isAuthenticated, 
  catchAsyncErrors(async (req, res, next) => {
    const classData = await Class.findById(req.params.id)
      .populate('students', 'name rollNumber gender guardianContact religion session')
      .populate('subjects', 'name code')
      .populate({
        path: 'supervisor',
        select: 'user designation',
        populate: {
          path: 'user',
          select: 'name email phoneNumber'
        }
      });

    if (!classData) {
      return next(new ErrorHandler("Class not found", 404));
    }

    const stats = {
      totalStudents: classData.students.length,
      totalSubjects: classData.subjects.length,
      genderDistribution: {
        male: classData.students.filter(s => s.gender === 'male').length,
        female: classData.students.filter(s => s.gender === 'female').length,
        other: classData.students.filter(s => s.gender === 'other').length
      },
      supervisor: classData.supervisor,
      academicYear: classData.academicYear,
      section: classData.section
    };

    // Get students by session
    const studentsBySession = {};
    classData.students.forEach(student => {
      const session = student.session || 'Not specified';
      if (!studentsBySession[session]) {
        studentsBySession[session] = 0;
      }
      studentsBySession[session]++;
    });

    stats.studentsBySession = studentsBySession;

    res.status(200).json({ 
      success: true, 
      stats,
      classInfo: {
        name: classData.name,
        section: classData.section,
        academicYear: classData.academicYear
      }
    });
}));

// Get classes by academic year
router.get("/by-year/:academicYear", 
  isAuthenticated, 
  catchAsyncErrors(async (req, res, next) => {
    const { academicYear } = req.params;
    const { section } = req.query;

    let filter = { academicYear };
    if (section) filter.section = section;

    const classes = await Class.find(filter)
      .populate('section', 'name')
      .populate({
        path: 'supervisor',
        select: 'user',
        populate: {
          path: 'user',
          select: 'name'
        }
      })
      .populate('students', 'name rollNumber')
      .sort({ name: 1 });

    res.status(200).json({ 
      success: true, 
      academicYear,
      classes,
      count: classes.length 
    });
}));

// Get classes without supervisor
router.get("/without-supervisor", 
  isAuthenticated, 
  authorizeRoles("admin"), 
  catchAsyncErrors(async (req, res, next) => {
    const classes = await Class.find({ 
      supervisor: { $exists: false } 
    })
      .populate('section', 'name')
      .populate('students', 'name rollNumber')
      .sort({ academicYear: -1, name: 1 });

    res.status(200).json({ 
      success: true, 
      classes,
      count: classes.length 
    });
}));

module.exports = router;

// // routes/classRoutes.js
// const express = require("express");
// const router = express.Router();
// const Class = require("../models/Class");
// const Section = require("../models/Section");
// const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
// const ErrorHandler = require("../utils/ErrorHandler");
// const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// // Create class
// router.post("/create", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
//     const { name, section, supervisor, subjects, academicYear } = req.body;

//     if (!name || !section) {
//         return next(new ErrorHandler("Class name and section are required", 400));
//     }

//     const sectionExists = await Section.findById(section);
//     if (!sectionExists) return next(new ErrorHandler("Section not found", 404));

//     const currentYear = new Date().getFullYear();
//     const defaultAcademicYear = `${currentYear}-${currentYear + 1}`;

//     const existingClass = await Class.findOne({ name, section, academicYear: academicYear || defaultAcademicYear });
//     if (existingClass) return next(new ErrorHandler("Class with this name, section and academic year already exists", 400));

//     const newClass = await Class.create({
//         name,
//         section,
//         supervisor,
//         subjects: subjects || [],
//         academicYear: academicYear || defaultAcademicYear
//     });

//     const populatedClass = await Class.findById(newClass._id)
//         .populate('section', 'name')
//         .populate('supervisor', 'name email')
//         .populate('subjects', 'name code')
//         .populate('students', 'name rollNumber');

//     res.status(201).json({ success: true, message: "Class created successfully", class: populatedClass });
// }));

// // Get all classes
// router.get("/all", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//     const { academicYear, name, section } = req.query;

//     let filter = {};
//     if (academicYear) filter.academicYear = academicYear;
//     if (name) filter.name = name;
//     if (section) filter.section = section;

//     const classes = await Class.find(filter)
//         .populate('section', 'name')
//         .populate({ // Use object notation for nested population on 'supervisor'
//             path: 'supervisor',
//             // Select the 'user' field from the Teacher document, as it holds the reference to the User document
//             select: 'user',
//             populate: {
//                 path: 'user', // Populating the 'user' reference inside the Teacher document
//                 select: 'name email' // Select the desired fields from the User document
//             }
//         })
//         .populate('subjects', 'name code')
//         .populate('students', 'name rollNumber')
//         .sort({ name: 1, 'section.name': 1 });

//     res.status(200).json({ success: true, classes, count: classes.length });
// }));

// // Get class by ID
// router.get("/single/:id", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//     const classData = await Class.findById(req.params.id)
//         .populate('section', 'name')
//         .populate('supervisor', 'name email phoneNumber')
//         .populate('subjects', 'name code description')
//         .populate('students', 'name rollNumber gender contact dateOfBirth');

//     if (!classData) return next(new ErrorHandler("Class not found", 404));
//     res.status(200).json({ success: true, class: classData });
// }));

// // Update class
// router.put("/update/:id", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
//     const { name, section, supervisor, subjects, academicYear } = req.body;

//     const classData = await Class.findById(req.params.id);
//     if (!classData) return next(new ErrorHandler("Class not found", 404));

//     if (section) {
//         const sectionExists = await Section.findById(section);
//         if (!sectionExists) return next(new ErrorHandler('Section not found', 404));
//     }

//     const updatedClass = await Class.findByIdAndUpdate(
//         req.params.id,
//         {
//             name: name || classData.name,
//             section: section || classData.section,
//             supervisor: supervisor || classData.supervisor,
//             subjects: subjects || classData.subjects,
//             academicYear: academicYear || classData.academicYear
//         },
//         { new: true, runValidators: true }
//     )
//         .populate('section', 'name')
//         .populate('supervisor', 'name email')
//         .populate('subjects', 'name code')
//         .populate('students', 'name rollNumber');

//     res.status(200).json({ success: true, message: "Class updated successfully", class: updatedClass });
// }));

// // Delete class
// router.delete("/delete/:id", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
//     const classData = await Class.findById(req.params.id);
//     if (!classData) return next(new ErrorHandler("Class not found", 404));
//     if (classData.students.length > 0) return next(new ErrorHandler("Cannot delete class with students. Remove students first.", 400));
//     await Class.findByIdAndDelete(req.params.id);
//     res.status(200).json({ success: true, message: "Class deleted successfully" });
// }));

// // Add student to class
// router.post("/:id/students", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
//     const { studentId } = req.body;
//     if (!studentId) return next(new ErrorHandler("Student ID is required", 400));

//     const classData = await Class.findById(req.params.id);
//     if (!classData) return next(new ErrorHandler("Class not found", 404));
//     if (classData.students.includes(studentId)) return next(new ErrorHandler("Student already in this class", 400));

//     classData.students.push(studentId);
//     await classData.save();

//     const updatedClass = await Class.findById(req.params.id).populate('students', 'name rollNumber gender');
//     res.status(200).json({ success: true, message: "Student added to class successfully", class: updatedClass });
// }));

// // Remove student from class
// router.delete("/:id/students/:studentId", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
//     const classData = await Class.findById(req.params.id);
//     if (!classData) return next(new ErrorHandler("Class not found", 404));

//     classData.students = classData.students.filter(student => student.toString() !== req.params.studentId);
//     await classData.save();

//     const updatedClass = await Class.findById(req.params.id).populate('students', 'name rollNumber gender');
//     res.status(200).json({ success: true, message: "Student removed from class successfully", class: updatedClass });
// }));

// // Add subject to class
// router.post("/:id/subjects", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
//     const { subjectId } = req.body;
//     if (!subjectId) return next(new ErrorHandler("Subject ID is required", 400));

//     const classData = await Class.findById(req.params.id);
//     if (!classData) return next(new ErrorHandler("Class not found", 404));
//     if (classData.subjects.includes(subjectId)) return next(new ErrorHandler("Subject already assigned to this class", 400));

//     classData.subjects.push(subjectId);
//     await classData.save();

//     const updatedClass = await Class.findById(req.params.id).populate('subjects', 'name code');
//     res.status(200).json({ success: true, message: "Subject added to class successfully", class: updatedClass });
// }));

// // Get class statistics
// router.get("/:id/stats", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//     const classData = await Class.findById(req.params.id).populate('students').populate('subjects');
//     if (!classData) return next(new ErrorHandler("Class not found", 404));

//     const stats = {
//         totalStudents: classData.students.length,
//         totalSubjects: classData.subjects.length,
//         maleStudents: classData.students.filter(s => s.gender === 'male').length,
//         femaleStudents: classData.students.filter(s => s.gender === 'female').length,
//         supervisor: classData.supervisor
//     };

//     res.status(200).json({ success: true, stats });
// }));

// module.exports = router;
