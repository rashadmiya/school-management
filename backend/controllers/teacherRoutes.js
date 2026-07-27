const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Role = require("../models/Role");
const ErrorHandler = require("../utils/ErrorHandler");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Routine = require("../models/Routine");
const Exam = require("../models/Exam");
const Assignment = require("../models/Assignment");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const Student = require("../models/Student");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const router = express.Router();
const { upload } = require("../multer");
const fs = require("fs"); // For file system operations (if storing files locally)
const path = require("path");

// ==================== TEACHER CREATION ENDPOINTS ====================
// ✅ OPTION 1: Create Teacher WITHOUT Photo (Simple)
router.post("/create",
  isAuthenticated,
  authorizeRoles("admin"),
  async (req, res, next) => {
    let user; // Declare here for cleanup scope

    try {
      const {
        name,
        email,
        password,
        phoneNumber,
        assignedSubjects = [],
        assignedClasses = [],
        designation,
        joiningDate,
        dateOfBirth,
        nationalIdNo,
        lastQualification,
        address,
        religion
        // Note: No photo field
      } = req.body;

      console.log("Creating teacher without photo:", req.body);

      // Validation for required fields
      if (!name || !email || !password) {
        return next(new ErrorHandler("Name, email, and password are required", 400));
      }

      if (!designation) {
        return next(new ErrorHandler("Designation is required", 400));
      }

      if (!joiningDate) {
        return next(new ErrorHandler("Joining date is required", 400));
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(new ErrorHandler("User with this email already exists", 400));
      }

      // Check if nationalIdNo is unique
      if (nationalIdNo) {
        const existingTeacher = await Teacher.findOne({ nationalIdNo });
        if (existingTeacher) {
          return next(new ErrorHandler("National ID already exists", 400));
        }
      }

      // Find teacher role
      const teacherRole = await Role.findOne({ name: "teacher" });
      if (!teacherRole) {
        return next(new ErrorHandler("Teacher role not found. Please seed roles first.", 500));
      }

      // Validate subjectIds and classIds if provided
      if (assignedSubjects.length > 0) {
        const validSubjects = await Subject.countDocuments({ _id: { $in: assignedSubjects } });
        if (validSubjects !== assignedSubjects.length) {
          return next(new ErrorHandler("One or more subject IDs are invalid", 400));
        }
      }

      if (assignedClasses.length > 0) {
        const validClasses = await Class.countDocuments({ _id: { $in: assignedClasses } });
        if (validClasses !== assignedClasses.length) {
          return next(new ErrorHandler("One or more class IDs are invalid", 400));
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with teacher role
      user = await User.create({
        name,
        email,
        password,
        role: teacherRole._id,
        phoneNumber,
        isVerified: true,
      });

      // Prepare lastQualification object
      let formattedLastQualification = null;
      if (lastQualification) {
        formattedLastQualification = {
          name: lastQualification.name || '',
          major: lastQualification.major || '',
          institute: lastQualification.institute || ''
        };
      }

      // Create teacher profile WITHOUT photo
      const teacher = await Teacher.create({
        user: user._id,
        designation,
        joiningDate,
        dateOfBirth,
        nationalIdNo,
        lastQualification: formattedLastQualification,
        phoneNumber,
        address,
        religion,
        // photo: undefined - Will be null/undefined
        subjects: assignedSubjects,
        classes: assignedClasses,
      });

      // Populate the created data for response
      const populatedUser = await User.findById(user._id)
        .populate('role', 'name')
        .select('-password');

      const populatedTeacher = await Teacher.findById(teacher._id)
        .populate('subjects', 'name code')
        .populate('classes', 'name section');

      res.status(201).json({
        success: true,
        message: "Teacher created successfully. You can now upload a photo if needed.",
        teacherId: teacher._id,
        user: populatedUser,
        profile: populatedTeacher,
        canUploadPhoto: true, // Indicate that photo can be uploaded
        data: {
          user: populatedUser,
          teacher: populatedTeacher
        },
      });

    } catch (err) {
      console.error("Teacher creation error:", err);

      // Cleanup if creation fails
      if (user) {
        await User.findByIdAndDelete(user._id);
        await Teacher.findOneAndDelete({ user: user._id });
      }

      // Handle duplicate key errors
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return next(new ErrorHandler(`${field} already exists`, 400));
      }

      next(new ErrorHandler("Failed to create teacher: " + err.message, 500));
    }
  }
);

// ✅ OPTION 2: Create Teacher WITH Photo (Single Step)
router.post("/create-with-photo",
  isAuthenticated,
  authorizeRoles("admin"),
  upload.single('photo'), // Handle file upload (photo is OPTIONAL)
  async (req, res, next) => {
    let user; // Declare here for cleanup scope

    try {
      // Parse form data
      const {
        name,
        email,
        password,
        phoneNumber,
        designation,
        joiningDate,
        dateOfBirth,
        nationalIdNo,
        lastQualification,
        address,
        religion,
        assignedSubjects = "[]", // Expect JSON string or array
        assignedClasses = "[]"   // Expect JSON string or array
      } = req.body;

      // console.log("Creating teacher with optional photo:", req.body);

      // Parse JSON arrays if sent as strings
      let subjectsArray = [];
      let classesArray = [];

      try {
        subjectsArray = assignedSubjects ? JSON.parse(assignedSubjects) : [];
        classesArray = assignedClasses ? JSON.parse(assignedClasses) : [];
      } catch (parseError) {
        // If not JSON, handle as simple values
        subjectsArray = Array.isArray(assignedSubjects) ? assignedSubjects : [assignedSubjects].filter(Boolean);
        classesArray = Array.isArray(assignedClasses) ? assignedClasses : [assignedClasses].filter(Boolean);
      }

      // Parse lastQualification if sent as string
      let parsedLastQualification = null;
      if (lastQualification) {
        try {
          parsedLastQualification = typeof lastQualification === 'string'
            ? JSON.parse(lastQualification)
            : lastQualification;
        } catch (e) {
          parsedLastQualification = null;
        }
      }

      // Validation for required fields
      if (!name || !email || !password) {
        return next(new ErrorHandler("Name, email, and password are required", 400));
      }

      if (!designation) {
        return next(new ErrorHandler("Designation is required", 400));
      }

      if (!joiningDate) {
        return next(new ErrorHandler("Joining date is required", 400));
      }

      // Validate photo if uploaded
      let photoPath = null;
      if (req.file) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          return next(new ErrorHandler("Please upload a valid image (JPEG, PNG, WebP)", 400));
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
          return next(new ErrorHandler("Image size should be less than 5MB", 400));
        }

        // photoPath = req.file.path || req.file.filename;
        photoPath = `/uploads/avatars/teachers/${req.file.filename}`;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        // Delete uploaded photo if user already exists
        if (photoPath && fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
        return next(new ErrorHandler("User with this email already exists", 400));
      }

      // Check if nationalIdNo is unique
      if (nationalIdNo) {
        const existingTeacher = await Teacher.findOne({ nationalIdNo });
        if (existingTeacher) {
          // Delete uploaded photo if national ID exists
          if (photoPath && fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
          }
          return next(new ErrorHandler("National ID already exists", 400));
        }
      }

      // Find teacher role
      const teacherRole = await Role.findOne({ name: "teacher" });
      if (!teacherRole) {
        // Delete uploaded photo if role not found
        if (photoPath && fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
        return next(new ErrorHandler("Teacher role not found. Please seed roles first.", 500));
      }

      // Validate subjectIds and classIds if provided
      if (subjectsArray.length > 0) {
        const validSubjects = await Subject.countDocuments({ _id: { $in: subjectsArray } });
        if (validSubjects !== subjectsArray.length) {
          // Delete uploaded photo if invalid subjects
          if (photoPath && fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
          }
          return next(new ErrorHandler("One or more subject IDs are invalid", 400));
        }
      }

      if (classesArray.length > 0) {
        const validClasses = await Class.countDocuments({ _id: { $in: classesArray } });
        if (validClasses !== classesArray.length) {
          // Delete uploaded photo if invalid classes
          if (photoPath && fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
          }
          return next(new ErrorHandler("One or more class IDs are invalid", 400));
        }
      }

      // Create user with teacher role
      user = await User.create({
        name,
        email,
        password,
        role: teacherRole._id,
        phoneNumber,
        isVerified: true,
      });

      // Prepare lastQualification object
      let formattedLastQualification = null;
      if (parsedLastQualification) {
        formattedLastQualification = {
          name: parsedLastQualification.name || '',
          major: parsedLastQualification.major || '',
          institute: parsedLastQualification.institute || ''
        };
      }

      // Create teacher profile WITH photo if provided
      const teacher = await Teacher.create({
        user: user._id,
        designation,
        joiningDate,
        dateOfBirth,
        nationalIdNo,
        lastQualification: formattedLastQualification,
        phoneNumber,
        address,
        religion,
        photo: photoPath,
        subjects: subjectsArray,
        classes: classesArray,
      });

      // Populate the created data for response
      const populatedUser = await User.findById(user._id)
        .populate('role', 'name')
        .select('-password');

      const populatedTeacher = await Teacher.findById(teacher._id)
        .populate('subjects', 'name code')
        .populate('classes', 'name section');

      res.status(201).json({
        success: true,
        message: photoPath
          ? "Teacher created successfully with photo"
          : "Teacher created successfully without photo",
        teacherId: teacher._id,
        user: populatedUser,
        profile: populatedTeacher,
        hasPhoto: !!photoPath,
        photoUrl: photoPath ? `/uploads/${path.basename(photoPath)}` : null,
        data: {
          user: populatedUser,
          teacher: populatedTeacher
        },
      });

    } catch (err) {
      console.error("Teacher creation with photo error:", err);

      // Cleanup if creation fails
      if (user) {
        await User.findByIdAndDelete(user._id);
        await Teacher.findOneAndDelete({ user: user._id });
      }

      // Delete uploaded photo if creation fails
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      // Handle duplicate key errors
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return next(new ErrorHandler(`${field} already exists`, 400));
      }

      next(new ErrorHandler("Failed to create teacher: " + err.message, 500));
    }
  }
);

// ✅ OPTION 3: Upload/Update Teacher Photo (Standalone)
router.post("/:id/photo",
  isAuthenticated,
  authorizeRoles("admin"),
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

      const teacherId = req.params.id;
      // console.log("upload image of the teacher :", teacherId, "file :", req.file.path)

      // Check if teacher exists
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        // Delete uploaded file if teacher not found
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return next(new ErrorHandler("Teacher not found", 404));
      }

      // Delete old photo if exists (optional cleanup)
      if (teacher.photo && fs.existsSync(teacher.photo)) {
        try {
          fs.unlinkSync(teacher.photo);
        } catch (unlinkError) {
          console.warn("Could not delete old photo:", unlinkError.message);
        }
      }

      // Update teacher photo
      const relativePath = `/uploads/avatars/teachers/${req.file.filename}`;
      teacher.photo = relativePath;
      await teacher.save({ validateBeforeSave: false });

      // Populate teacher with user data
      const populatedTeacher = await Teacher.findById(teacherId)
        .populate('user', 'name email');

      res.status(200).json({
        success: true,
        message: "Teacher photo uploaded successfully",
        photo: teacher.photo,
        photoUrl: `/uploads/${path.basename(teacher.photo)}`,
        teacher: {
          _id: populatedTeacher._id,
          name: populatedTeacher.user.name,
          email: populatedTeacher.user.email,
          designation: populatedTeacher.designation
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

// ✅ OPTION 4: Remove Teacher Photo
router.delete("/:id/photo",
  isAuthenticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const teacherId = req.params.id;

      // Check if teacher exists
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return next(new ErrorHandler("Teacher not found", 404));
      }

      if (!teacher.photo) {
        return next(new ErrorHandler("Teacher does not have a photo", 400));
      }

      // Delete photo file if exists
      if (fs.existsSync(teacher.photo)) {
        try {
          fs.unlinkSync(teacher.photo);
        } catch (unlinkError) {
          console.warn("Could not delete photo file:", unlinkError.message);
        }
      }

      // Remove photo reference from database
      teacher.photo = null;
      await teacher.save();

      res.status(200).json({
        success: true,
        message: "Teacher photo removed successfully"
      });

    } catch (error) {
      next(error);
    }
  })
);

// ==================== TEACHER UPDATE ENDPOINT ====================

// ✅ Update Teacher (with optional photo update) - UPDATED
router.put("/update/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        name,
        email,
        phoneNumber,
        password,
        assignedSubjects = [],
        assignedClasses = [],
        designation,
        joiningDate,
        dateOfBirth,
        nationalIdNo,
        lastQualification,
        address,
        religion,
        // Note: Photo is NOT updated here - use separate endpoint
      } = req.body;

      // Verify teacher exists
      const teacher = await Teacher.findById(id).populate("user");
      if (!teacher) {
        return next(new ErrorHandler("Teacher not found", 404));
      }

      // Check for duplicate nationalIdNo (if changed)
      if (nationalIdNo && nationalIdNo !== teacher.nationalIdNo) {
        const existingTeacher = await Teacher.findOne({ nationalIdNo });
        if (existingTeacher) {
          return next(new ErrorHandler("National ID already exists", 400));
        }
      }

      // Validate subjects
      if (assignedSubjects.length > 0) {
        const validSubjects = await Subject.countDocuments({
          _id: { $in: assignedSubjects },
        });
        if (validSubjects !== assignedSubjects.length) {
          return next(
            new ErrorHandler("One or more subject IDs are invalid", 400)
          );
        }
      }

      // Validate classes
      if (assignedClasses.length > 0) {
        const validClasses = await Class.countDocuments({
          _id: { $in: assignedClasses },
        });
        if (validClasses !== assignedClasses.length) {
          return next(
            new ErrorHandler("One or more class IDs are invalid", 400)
          );
        }
      }

      // Update User
      const updateUserData = {};
      if (name) updateUserData.name = name;
      if (email) updateUserData.email = email;
      if (phoneNumber) updateUserData.phoneNumber = phoneNumber;
      if (password) {
        updateUserData.password = await bcrypt.hash(password, 10);
      }

      if (Object.keys(updateUserData).length > 0) {
        await User.findByIdAndUpdate(teacher.user._id, updateUserData, {
          new: true,
        });
      }

      // Prepare lastQualification object
      let formattedLastQualification = null;
      if (lastQualification) {
        formattedLastQualification = {
          name: lastQualification.name || teacher.lastQualification?.name || '',
          major: lastQualification.major || teacher.lastQualification?.major || '',
          institute: lastQualification.institute || teacher.lastQualification?.institute || ''
        };
      }

      // Update Teacher Profile (excluding photo)
      const teacherUpdateData = {};
      if (designation !== undefined) teacherUpdateData.designation = designation;
      if (joiningDate !== undefined) teacherUpdateData.joiningDate = joiningDate;
      if (dateOfBirth !== undefined) teacherUpdateData.dateOfBirth = dateOfBirth;
      if (nationalIdNo !== undefined) teacherUpdateData.nationalIdNo = nationalIdNo;
      if (formattedLastQualification) teacherUpdateData.lastQualification = formattedLastQualification;
      if (address !== undefined) teacherUpdateData.address = address;
      if (religion !== undefined) teacherUpdateData.religion = religion;
      // Note: Photo is NOT updated here
      if (assignedSubjects) teacherUpdateData.subjects = assignedSubjects;
      if (assignedClasses) teacherUpdateData.classes = assignedClasses;

      const updatedTeacher = await Teacher.findByIdAndUpdate(
        id,
        teacherUpdateData,
        { new: true }
      )
        .populate("subjects", "name code")
        .populate("classes", "name section")
        .populate({
          path: "user",
          select: "name email phoneNumber role",
          populate: { path: "role", select: "name" }
        });

      res.status(200).json({
        success: true,
        message: "Teacher updated successfully. Note: Photo must be updated separately.",
        teacher: updatedTeacher,
        canUpdatePhoto: true, // Indicate that photo can be updated separately
      });
    } catch (err) {
      console.error("Teacher update error:", err);

      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return next(new ErrorHandler(`${field} already exists`, 400));
      }

      next(new ErrorHandler(err.message, 500));
    }
  }
);

router.get("/my-classes",
  isAuthenticated,
  authorizeRoles("teacher", "admin"),
  async (req, res, next) => {
    try {
      const teacher = await Teacher.findOne({ user: req.user._id });
      // console.log("teacher at my classes :", teacher)
      if (!teacher) {
        return res.status(404).json({ success: false, message: "Teacher profile not found" });
      }

      // Fetch all classes where this teacher is the supervisor or teaches a subject
      // const classes = await Class.find({
      //   $or: [
      //     { supervisor: teacher._id },
      //     { subjects: { $in: teacher.subjects } }
      //   ]
      // })
      //   .populate('students', 'name rollNumber')
      //   .populate('subjects', 'name');
      let teacherClassesIds = teacher.classes || [];
      const classes = await Class.find({ _id: { $in: teacherClassesIds } })
        .populate('students', 'name rollNumber')
        .populate('section', 'name capacity')
        .populate('subjects', 'name');

      // console.log("clases :", classes)
      res.status(200).json({ success: true, classes });
    } catch (error) {
      next(error);
    }
  });


// 🎯 Get teacher's routines
router.get("/my-routines",
  isAuthenticated,
  authorizeRoles("teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {

      const teacher = await Teacher.findOne({ user: req.user._id });
      if (!teacher) {
        return res.status(404).json({ success: false, message: "Teacher profile not found" });
      }

      const routines = await Routine.find({ teacher: teacher._id })
        .populate('class', 'name')
        .populate('subject', 'name code')
        .sort({ day: 1, startTime: 1 });

      res.status(200).json({
        success: true,
        routines
      });

    } catch (error) {
      next(error);
    }
  }));

// 🎯 Get teacher's assignments
router.get("/my-assignments",
  isAuthenticated,
  authorizeRoles("teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const assignments = await Assignment.find({ createdBy: req.user._id })
        .populate('class', 'name')
        .populate('subject', 'name code')
        .sort({ dueDate: 1 });

      res.status(200).json({
        success: true,
        assignments
      });

    } catch (error) {
      next(error);
    }
  }));

// 🎯 Get teacher's exams
router.get("/my-exams",
  isAuthenticated,
  authorizeRoles("teacher", "admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const exams = await Exam.find({ createdBy: req.user._id })
        .populate('class', 'name')
        .populate('subject', 'name code')
        .sort({ date: 1, startTime: 1 });

      // console.log("exams:", exams)
      res.status(200).json({
        success: true,
        exams
      });

    } catch (error) {
      next(error);
    }
  }));


// 🎯 Get all submissions for a specific assignment
router.get("/assignments/:assignmentId/submissions",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const assignment = await Assignment.findById(req.params.assignmentId)
        .populate('class', 'name')
        .populate('subject', 'name code');

      if (!assignment) {
        return next(new ErrorHandler("Assignment not found", 404));
      }

      // Verify teacher owns this assignment
      if (assignment.createdBy.toString() !== req.user._id.toString() && req.user.role.name !== 'admin') {
        return next(new ErrorHandler("Not authorized to view these submissions", 403));
      }

      const submissions = await AssignmentSubmission.find({
        assignment: req.params.assignmentId
      })
        .populate('student', 'name email rollNumber')
        .sort({ submittedAt: -1 });

      res.status(200).json({
        success: true,
        assignment,
        submissions
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Grade assignment submission
router.put("/assignments/submissions/:submissionId/grade",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { score, maxScore, feedback } = req.body;

      const submission = await AssignmentSubmission.findById(req.params.submissionId)
        .populate('assignment')
        .populate('student', 'name email');

      if (!submission) {
        return next(new ErrorHandler("Submission not found", 404));
      }

      // Verify teacher owns the assignment
      const assignment = await Assignment.findById(submission.assignment);
      if (assignment.createdBy.toString() !== req.user._id.toString() && req.user.role.name !== 'admin') {
        return next(new ErrorHandler("Not authorized to grade this submission", 403));
      }

      submission.grade = {
        score: parseFloat(score),
        maxScore: parseFloat(maxScore),
        feedback: feedback || '',
        gradedAt: new Date(),
        gradedBy: req.user._id
      };
      submission.status = 'graded';

      await submission.save();

      res.status(200).json({
        success: true,
        message: "Assignment graded successfully",
        submission
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get assignment statistics
router.get("/assignments/:assignmentId/statistics",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const assignment = await Assignment.findById(req.params.assignmentId);

      if (!assignment) {
        return next(new ErrorHandler("Assignment not found", 404));
      }

      const totalStudents = await Student.countDocuments({ class: assignment.class });
      const submissions = await AssignmentSubmission.find({ assignment: assignment._id });

      const submittedCount = submissions.length;
      const gradedCount = submissions.filter(sub => sub.status === 'graded').length;
      const lateCount = submissions.filter(sub => sub.status === 'late').length;

      // Calculate average grade
      const gradedSubmissions = submissions.filter(sub => sub.grade && sub.grade.score);
      const averageGrade = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, sub) => sum + sub.grade.score, 0) / gradedSubmissions.length
        : 0;

      res.status(200).json({
        success: true,
        statistics: {
          totalStudents,
          submittedCount,
          notSubmittedCount: totalStudents - submittedCount,
          gradedCount,
          pendingGradingCount: submittedCount - gradedCount,
          lateCount,
          averageGrade: Math.round(averageGrade * 100) / 100,
          submissionRate: Math.round((submittedCount / totalStudents) * 100)
        }
      });

    } catch (error) {
      next(error);
    }
  })
);


// ==================== TEACHER SEARCH & LIST ENDPOINTS ====================

// ✅ Get all teachers with search and filters - UPDATED
router.get("/",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    const {
      search = "",
      designation,
      religion,
      hasPhoto, // New filter: teachers with/without photos
      page = 1,
      limit = 20
    } = req.query;

    // Build query based on search parameters
    const query = {};

    // Text search across teacher name
    if (search) {
      query['user.name'] = { $regex: search, $options: 'i' };
    }

    // Filter by designation
    if (designation) {
      query.designation = designation;
    }

    // Filter by religion
    if (religion) {
      query.religion = { $regex: religion, $options: 'i' };
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

    // Get total count
    const total = await Teacher.countDocuments(query);

    // Get paginated results with population
    const teachers = await Teacher.find(query)
      .populate({
        path: "user",
        select: "name email phoneNumber",
        match: search ? { name: { $regex: search, $options: 'i' } } : {}
      })
      .populate("subjects", "name code")
      .populate("classes", "name section")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Filter out teachers without user (if any) and add photo URL
    const enrichedTeachers = teachers
      .filter(teacher => teacher.user)
      .map(teacher => ({
        ...teacher.toObject(),
        photoUrl: teacher.photo ? `/uploads/${path.basename(teacher.photo)}` : null,
        hasPhoto: !!teacher.photo
      }));

    // Get statistics
    const withPhotoCount = await Teacher.countDocuments({ photo: { $exists: true, $ne: null } });
    const withoutPhotoCount = await Teacher.countDocuments({
      $or: [
        { photo: { $exists: false } },
        { photo: null },
        { photo: '' }
      ]
    });

    res.status(200).json({
      success: true,
      docs: enrichedTeachers,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      statistics: {
        totalTeachers: total,
        withPhoto: withPhotoCount,
        withoutPhoto: withoutPhotoCount,
        photoCoverage: total > 0 ? Math.round((withPhotoCount / total) * 100) : 0
      }
    });
  })
);

// ✅ Get single teacher
router.get("/:id", isAuthenticated, authorizeRoles("admin", "teacher"), async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate("user subjects classes");
    if (!teacher) return next(new ErrorHandler("Teacher not found", 404));
    res.json({ success: true, data: teacher });
  } catch (err) {
    next(err);
  }
});

// ==================== HELPER FUNCTIONS ====================

// Helper to validate photo file
const validatePhotoFile = (file) => {
  if (!file) {
    return { valid: false, error: "No file uploaded" };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, error: "Invalid file type. Only JPEG, PNG, JPG, WebP allowed" };
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: "File size exceeds 5MB limit" };
  }

  return { valid: true };
};

// Helper to get photo URL
const getPhotoUrl = (photoPath) => {
  if (!photoPath) return null;
  return `/uploads/${path.basename(photoPath)}`;
};

module.exports = router;