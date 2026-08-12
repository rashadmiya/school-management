const express = require("express");
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
const router = express.Router();

// ==================== STUDENT CREATION ENDPOINTS ====================

// ✅ OPTION 1: Create Student WITHOUT Photo (Simple)
router.post(
  "/register",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  async (req, res, next) => {
    let user; // For cleanup scope

    try {
      const {
        name,
        rollNumber,
        password = "123456",
        classId,
        parentId,
        gender,
        session,
        birthRegNo,
        fathersName,
        mothersName,
        guardianContact,
        religion,
        isPhysicallyDisabled = false,
        disabilityDescription,
        lastExamResult,
        dateOfBirth,
        feeCategory = 'regular',
        transportRoute,
        outstandingBalance = 0,
        financialNotes
      } = req.body;

      // Validation for required fields
      if (!session) {
        return next(new ErrorHandler("Session is required", 400));
      }

      // Check for duplicate roll number
      const existing = await Student.findOne({ rollNumber });
      if (existing) {
        return next(new ErrorHandler("Roll number already exists", 400));
      }

      // ✅ Make parent optional: only validate if parentId is provided
      let parentObjectId = null;
      if (parentId) {
        const parent = await Parent.findById(parentId);
        if (parent) {
          parentObjectId = parent._id;
        } else {
          // Optionally log or ignore; you can also throw a warning
          console.warn(`Parent with ID ${parentId} not found, skipping association.`);
        }
      }

      // Check if class exists (if provided)
      if (classId) {
        const classExists = await Class.findById(classId);
        if (!classExists) {
          return next(new ErrorHandler("Class not found", 404));
        }
      }

      // Prepare lastExamResult object
      let formattedLastExamResult = null;
      if (lastExamResult) {
        formattedLastExamResult = {
          examName: lastExamResult.examName || '',
          achievedMarks: lastExamResult.achievedMarks || '',
          totalMarks: lastExamResult.totalMarks || ''
        };
      }

      // Create student WITHOUT photo
      const student = await Student.create({
        name,
        rollNumber,
        password,
        class: classId,
        parent: parentObjectId, // Will be null if no parent or not found
        gender,
        session,
        birthRegNo,
        fathersName,
        mothersName,
        guardianContact,
        religion,
        isPhysicallyDisabled,
        disabilityDescription: isPhysicallyDisabled ? disabilityDescription : '',
        lastExamResult: formattedLastExamResult,
        dateOfBirth,
        feeCategory,
        transportRoute,
        outstandingBalance,
        financialNotes,
        isStudent: true
      });

      // 🔹 Assign the student to the class (if classId provided)
      if (classId) {
        await Class.findByIdAndUpdate(
          classId,
          { $addToSet: { students: student._id } },
          { new: true }
        );
      }

      // 🔹 Update parent's children array (only if parentObjectId exists)
      if (parentObjectId) {
        await Parent.findByIdAndUpdate(
          parentObjectId,
          { $addToSet: { children: student._id } },
          { new: true }
        );
      }

      // Send response
      sendStudentToken(student, 201, res);
    } catch (error) {
      console.error("Student registration error:", error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return next(new ErrorHandler(messages.join(', '), 400));
      }

      // Handle duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return next(new ErrorHandler(`${field} already exists`, 400));
      }

      next(error);
    }
  }
);

// router.post("/register",
//   isAuthenticated,
//   authorizeRoles("admin", "teacher"),
//   async (req, res, next) => {
//     let user; // For cleanup scope

//     try {
//       const {
//         name,
//         rollNumber,
//         password = "123456",
//         classId,
//         // gradeId,
//         parentId,
//         gender,
//         // New fields
//         session,
//         birthRegNo,
//         fathersName,
//         mothersName,
//         guardianContact,
//         religion,
//         isPhysicallyDisabled = false,
//         disabilityDescription,
//         lastExamResult,
//         dateOfBirth,
//         feeCategory = 'regular',
//         transportRoute,
//         outstandingBalance = 0,
//         financialNotes
//         // Note: No photo field
//       } = req.body;

//       // Validation for required fields
//       if (!session) {
//         return next(new ErrorHandler("Session is required", 400));
//       }

//       // Check for duplicate roll number
//       const existing = await Student.findOne({ rollNumber });
//       if (existing) {
//         return next(new ErrorHandler("Roll number already exists", 400));
//       }

//       // Check if parent exists
//       const parent = await Parent.findById(parentId);
//       if (!parent) {
//         return next(new ErrorHandler("Parent not found", 404));
//       }

//       // Check if class exists
//       if (classId) {
//         const classExists = await Class.findById(classId);
//         if (!classExists) {
//           return next(new ErrorHandler("Class not found", 404));
//         }
//       }

//       // Prepare lastExamResult object
//       let formattedLastExamResult = null;
//       if (lastExamResult) {
//         formattedLastExamResult = {
//           examName: lastExamResult.examName || '',
//           achievedMarks: lastExamResult.achievedMarks || '',
//           totalMarks: lastExamResult.totalMarks || ''
//         };
//       }

//       // Create student WITHOUT photo
//       const student = await Student.create({
//         name,
//         rollNumber,
//         password,
//         class: classId,
//         parent: parentId,
//         // grade: gradeId,
//         gender,
//         // New fields
//         session,
//         birthRegNo,
//         fathersName,
//         mothersName,
//         guardianContact,
//         religion,
//         isPhysicallyDisabled,
//         disabilityDescription: isPhysicallyDisabled ? disabilityDescription : '',
//         lastExamResult: formattedLastExamResult,
//         // Additional fields
//         dateOfBirth,
//         feeCategory,
//         transportRoute,
//         outstandingBalance,
//         financialNotes,
//         isStudent: true
//       });

//       // 🔹 Assign the student to the class
//       if (classId) {
//         await Class.findByIdAndUpdate(
//           classId,
//           { $addToSet: { students: student._id } },
//           { new: true }
//         );
//       }

//       // 🔹 Update parent's children array
//       await Parent.findByIdAndUpdate(
//         parentId,
//         { $addToSet: { children: student._id } },
//         { new: true }
//       );

//       // Send response
//       sendStudentToken(student, 201, res);

//     } catch (error) {
//       console.error("Student registration error:", error);

//       // Handle validation errors
//       if (error.name === 'ValidationError') {
//         const messages = Object.values(error.errors).map(val => val.message);
//         return next(new ErrorHandler(messages.join(', '), 400));
//       }

//       // Handle duplicate key error
//       if (error.code === 11000) {
//         const field = Object.keys(error.keyPattern)[0];
//         return next(new ErrorHandler(`${field} already exists`, 400));
//       }

//       next(error);
//     }
//   }
// );

router.post(
  "/register-with-photo",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  upload.single('photo'),
  async (req, res, next) => {
    let user; // For cleanup scope

    try {
      // Parse form data
      const {
        name,
        rollNumber,
        password = "123456",
        classId,
        parentId, // Could be empty string or undefined
        gender,
        session,
        birthRegNo,
        fathersName,
        mothersName,
        guardianContact,
        religion,
        isPhysicallyDisabled = "false",
        disabilityDescription,
        lastExamResult,
        dateOfBirth,
        feeCategory = 'regular',
        transportRoute,
        outstandingBalance = "0",
        financialNotes
      } = req.body;

      // Clean up parentId - handle empty string or "undefined" string
      let cleanedParentId = parentId && parentId.trim() !== "" && parentId !== "undefined"
        ? parentId
        : null;

      // Parse boolean and number values
      const parsedIsPhysicallyDisabled = isPhysicallyDisabled === 'true';
      const parsedOutstandingBalance = parseFloat(outstandingBalance) || 0;

      // Validation for required fields
      if (!session) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return next(new ErrorHandler("Session is required", 400));
      }

      // Validate photo if uploaded
      let photoPath = null;
      if (req.file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          return next(new ErrorHandler("Please upload a valid image (JPEG, PNG, WebP)", 400));
        }

        const maxSize = 5 * 1024 * 1024;
        if (req.file.size > maxSize) {
          return next(new ErrorHandler("Image size should be less than 5MB", 400));
        }

        photoPath = `/uploads/avatars/students/${req.file.filename}`;
      }

      // Check for duplicate roll number
      const existing = await Student.findOne({ rollNumber });
      if (existing) {
        if (photoPath && fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
        return next(new ErrorHandler("Roll number already exists", 400));
      }

      // 🟢 Parent lookup – now optional and lenient
      let parent = null;
      if (cleanedParentId) {
        parent = await Parent.findById(cleanedParentId);
        if (!parent) {
          // Log a warning but continue; student will be created without parent association
          console.warn(`Parent with ID ${cleanedParentId} not found, proceeding without parent.`);
          cleanedParentId = null; // Reset to null for student creation
        }
      }

      // Check if class exists (if provided)
      if (classId) {
        const classExists = await Class.findById(classId);
        if (!classExists) {
          if (photoPath && fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
          }
          return next(new ErrorHandler("Class not found", 404));
        }
      }

      // Prepare lastExamResult object
      let formattedLastExamResult = null;
      if (lastExamResult) {
        try {
          const parsedLastExamResult = typeof lastExamResult === 'string'
            ? JSON.parse(lastExamResult)
            : lastExamResult;

          formattedLastExamResult = {
            examName: parsedLastExamResult.examName || '',
            achievedMarks: parsedLastExamResult.achievedMarks || '',
            totalMarks: parsedLastExamResult.totalMarks || ''
          };
        } catch (e) {
          formattedLastExamResult = null;
        }
      }

      // Create student
      const studentData = {
        name,
        rollNumber,
        password,
        class: classId,
        parent: cleanedParentId, // null if parent not found or not provided
        gender,
        session,
        birthRegNo,
        fathersName,
        mothersName,
        guardianContact,
        religion,
        isPhysicallyDisabled: parsedIsPhysicallyDisabled,
        disabilityDescription: parsedIsPhysicallyDisabled ? disabilityDescription : '',
        lastExamResult: formattedLastExamResult,
        photo: photoPath,
        dateOfBirth,
        feeCategory,
        transportRoute,
        outstandingBalance: parsedOutstandingBalance,
        financialNotes,
        isStudent: true
      };

      // Remove null/undefined fields to avoid validation issues
      Object.keys(studentData).forEach(key => {
        if (studentData[key] === null || studentData[key] === undefined) {
          delete studentData[key];
        }
      });

      const student = await Student.create(studentData);

      // 🔹 Assign the student to the class
      if (classId) {
        await Class.findByIdAndUpdate(
          classId,
          { $addToSet: { students: student._id } },
          { new: true }
        );
      }

      // 🔹 Update parent's children array ONLY if a valid parent exists
      if (cleanedParentId && parent) {
        await Parent.findByIdAndUpdate(
          cleanedParentId,
          { $addToSet: { children: student._id } },
          { new: true }
        );
      }

      // Populate for response
      const populatedStudent = await Student.findById(student._id)
        .populate('class', 'name section')
        .populate('parent', 'name phone email')
        .populate('grade', 'name level')
        .select('-password');

      // Generate token
      const token = student.getJwtToken();

      res.status(201).json({
        success: true,
        message: photoPath
          ? "Student created successfully with photo"
          : "Student created successfully without photo",
        token,
        student: populatedStudent,
        studentId: student._id,
        hasPhoto: !!photoPath,
        photoUrl: photoPath ? `/uploads/${path.basename(photoPath)}` : null,
        hasParent: !!cleanedParentId
      });

    } catch (error) {
      console.error("Student registration with photo error:", error);

      // Delete uploaded photo if registration fails
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return next(new ErrorHandler(messages.join(', '), 400));
      }

      // Handle duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return next(new ErrorHandler(`${field} already exists`, 400));
      }

      // Handle ObjectId casting error
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
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const studentId = req.params.id;

      // Check if student exists
      const student = await Student.findById(studentId);
      if (!student) {
        return next(new ErrorHandler("Student not found", 404));
      }

      if (!student.photo) {
        return next(new ErrorHandler("Student does not have a photo", 400));
      }

      // Delete photo file if exists
      if (fs.existsSync(student.photo)) {
        try {
          fs.unlinkSync(student.photo);
        } catch (unlinkError) {
          console.warn("Could not delete photo file:", unlinkError.message);
        }
      }

      // Remove photo reference from database
      student.photo = null;
      await student.save();

      res.status(200).json({
        success: true,
        message: "Student photo removed successfully"
      });

    } catch (error) {
      next(error);
    }
  })
);

// ✅ Update Student (without photo) - Updated
router.put("/update/:id",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  async (req, res, next) => {
    try {
      console.log("Update student called:", req.body);
      const {
        name,
        rollNumber,
        password,
        // Updated fields
        guardianContact,
        gender,
        dateOfBirth,
        classId,
        gradeId,
        parentId,
        session,
        birthRegNo,
        fathersName,
        mothersName,
        religion,
        isPhysicallyDisabled,
        disabilityDescription,
        lastExamResult,
        // Note: Photo is NOT updated here
        feeCategory,
        transportRoute,
        outstandingBalance,
        financialNotes
      } = req.body;

      const studentId = req.params.id;

      // Find student
      const student = await Student.findById(studentId);
      if (!student) return next(new ErrorHandler("Student not found", 404));

      // Check for duplicate roll number
      if (rollNumber && rollNumber !== student.rollNumber) {
        const existing = await Student.findOne({ rollNumber });
        if (existing) return next(new ErrorHandler("Roll number already exists", 400));
      }

      // Store old values for relationship updates
      const oldParentId = student.parent?.toString();
      const oldClassId = student.class?.toString();

      // Update student fields (excluding photo)
      if (name) student.name = name;
      if (rollNumber) student.rollNumber = rollNumber;
      if (guardianContact) student.guardianContact = guardianContact;
      if (gender) student.gender = gender;
      if (dateOfBirth) student.dateOfBirth = dateOfBirth;
      if (classId) student.class = classId;
      if (gradeId) student.grade = gradeId;
      if (parentId) student.parent = parentId;
      if (password) student.password = password;

      // Update NEW FIELDS (excluding photo)
      if (session) student.session = session;
      if (birthRegNo !== undefined) student.birthRegNo = birthRegNo;
      if (fathersName !== undefined) student.fathersName = fathersName;
      if (mothersName !== undefined) student.mothersName = mothersName;
      if (religion !== undefined) student.religion = religion;
      // Note: Photo is NOT updated here
      if (isPhysicallyDisabled !== undefined) {
        student.isPhysicallyDisabled = isPhysicallyDisabled;
        if (!isPhysicallyDisabled) {
          student.disabilityDescription = '';
        }
      }
      if (disabilityDescription !== undefined) {
        student.disabilityDescription = disabilityDescription;
      }
      if (lastExamResult) {
        student.lastExamResult = {
          examName: lastExamResult.examName || '',
          achievedMarks: lastExamResult.achievedMarks || '',
          totalMarks: lastExamResult.totalMarks || ''
        };
      }
      if (feeCategory) student.feeCategory = feeCategory;
      if (transportRoute !== undefined) student.transportRoute = transportRoute;
      if (outstandingBalance !== undefined) student.outstandingBalance = outstandingBalance;
      if (financialNotes !== undefined) student.financialNotes = financialNotes;

      // Update parent relationships if parent changed
      if (parentId && parentId !== oldParentId) {
        // Remove from old parent
        if (oldParentId) {
          await Parent.findByIdAndUpdate(
            oldParentId,
            { $pull: { children: studentId } }
          );
        }

        // Add to new parent
        const newParent = await Parent.findById(parentId);
        if (!newParent) return next(new ErrorHandler("New parent not found", 404));

        await Parent.findByIdAndUpdate(
          parentId,
          { $addToSet: { children: studentId } }
        );
      }

      // Update class relationships if class changed
      if (classId && classId !== oldClassId) {
        // Remove from old class
        if (oldClassId) {
          await Class.findByIdAndUpdate(
            oldClassId,
            { $pull: { students: studentId } }
          );
        }

        // Add to new class
        await Class.findByIdAndUpdate(
          classId,
          { $addToSet: { students: studentId } }
        );
      }

      // Save the student
      await student.save();

      // Populate the updated student for response
      const updatedStudent = await Student.findById(studentId)
        .populate('class', 'name section')
        .populate('parent', 'name phone email')
        .populate('grade', 'name level')
        .select('-password');

      res.status(200).json({
        success: true,
        message: "Student updated successfully. Note: Photo must be updated separately.",
        student: updatedStudent,
        canUpdatePhoto: true,
      });

    } catch (error) {
      console.log("Student update error:", error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return next(new ErrorHandler(messages.join(', '), 400));
      }

      // Handle duplicate key error
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
    // console.log("login student :", student)
    if (!student) return next(new ErrorHandler("Invalid credentials", 400));

    const isMatch = await student.comparePassword(password);
    if (!isMatch) return next(new ErrorHandler("Invalid credentials", 400));

    sendStudentToken(student, 200, res);
  } catch (error) {
    next(error);
  }
});

// Route
router.get("/me",
  isStudentAuthenticated,
  catchAsyncErrors(async (req, res) => {
    try {
      // Populate student with all details
      const student = await Student.findById(req.user._id)
        .populate('class', 'name section academicYear supervisor')
        .populate('grade', 'name gradePoint')
        .populate('parent', 'name phone email')
        .populate('transportRoute', 'routeName vehicleNumber driverName')
        .select('-password');

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found"
        });
      }

      // Add photo URL
      const studentWithPhoto = {
        ...student.toObject(),
        photoUrl: student.photo ? `/uploads/${path.basename(student.photo)}` : null,
        hasPhoto: !!student.photo
      };

      // Get quick stats for dashboard
      const [payments, attendance] = await Promise.all([
        Payment.find({ student: student._id })
          .sort({ dueDate: -1 })
          .limit(3),
        Attendance.find({ student: student._id })
          .sort({ date: -1 })
          .limit(5)
          .populate('subject', 'name')
      ]);

      res.json({
        success: true,
        token: req.token,
        user: {
          ...studentWithPhoto,
          role: { name: "student" },
          isStudent: true
        },
        dashboard: {
          payments,
          attendance
        }
      });

    } catch (error) {
      console.error("Student me route error:", error);
      res.status(500).json({
        success: false,
        message: "Server Error"
      });
    }
  })
);
// router.get("/me", 
//   isStudentAuthenticated, 
//   catchAsyncErrors(async (req, res) => {
//     try {
//       // Populate student with all details
//       const student = await Student.findById(req.user._id)
//         .populate('class', 'name section academicYear supervisor')
//         .populate('grade', 'name gradePoint')
//         .populate('parent', 'name phone email')
//         .populate('transportRoute', 'routeName vehicleNumber driverName')
//         .select('-password');

//       if (!student) {
//         return res.status(404).json({ 
//           success: false, 
//           message: "Student not found" 
//         });
//       }

//       // Get quick stats for dashboard
//       const [payments, attendance] = await Promise.all([
//         Payment.find({ student: student._id })
//           .sort({ dueDate: -1 })
//           .limit(3),
//         Attendance.find({ student: student._id })
//           .sort({ date: -1 })
//           .limit(5)
//           .populate('subject', 'name')
//       ]);

//       res.json({
//         success: true,
//         token: req.token,
//         user: {
//           ...student.toObject(),
//           role: { name: "student" },
//           isStudent: true
//         },
//         dashboard: {
//           payments,
//           attendance
//         }
//       });

//     } catch (error) {
//       console.error("Student me route error:", error);
//       res.status(500).json({ 
//         success: false, 
//         message: "Server Error" 
//       });
//     }
//   })
// );

router.get("/refresh", async (req, res, next) => {
  try {
    const oldRefresh = req.cookies.student_refreshToken;
    if (!oldRefresh) return next(new ErrorHandler("Refresh token not found", 403));

    // ✅ FIXED: Use same secret as token creation
    jwt.verify(oldRefresh, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return next(new ErrorHandler("Invalid refresh token", 403));

      const newAccess = jwt.sign({ id: decoded.id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
      });

      const newRefresh = jwt.sign({ id: decoded.id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
      });

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
  } catch (err) {
    next(err);
  }
});


// ✅ Logout
router.post("/logout", (req, res) => {
  res
    .cookie("student_token", "", { expires: new Date(0), httpOnly: true })
    .cookie("student_refreshToken", "", { expires: new Date(0), httpOnly: true })
    .json({ success: true, message: "Student logged out" });
});

// 🎯 Get student's assignments
router.get("/my/assignments",
  isStudentAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const student = await Student.findById(req.user._id).populate('class');

      if (!student?.class) {
        return res.status(200).json({ success: true, assignments: [] });
      }

      // Get assignments with submission status in single query
      const assignments = await Assignment.aggregate([
        {
          $match: {
            class: student.class._id,
            // Include both current and recent past assignments (last 6 months)
            dueDate: {
              $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // 6 months back
            }
          }
        },
        {
          $lookup: {
            from: "assignmentsubmissions",
            let: { assignmentId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$assignment", "$$assignmentId"] },
                      { $eq: ["$student", student._id] }
                    ]
                  }
                }
              }
            ],
            as: "submission"
          }
        },
        {
          $addFields: {
            submission: { $ifNull: ["$submission", []] },
            submitted: { $gt: [{ $size: { $ifNull: ["$submission", []] } }, 0] }
          }
        },
        {
          $project: {
            title: 1,
            description: 1,
            class: 1,
            subject: 1,
            dueDate: 1,
            createdAt: 1,
            submitted: 1,
            submission: { $arrayElemAt: ["$submission", 0] },
            status: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ["$submission", []] } }, 0] },
                "submitted",
                {
                  $cond: [
                    { $lt: ["$dueDate", new Date()] },
                    "overdue",
                    "pending"
                  ]
                }
              ]
            }
          }
        },
        { $sort: { dueDate: 1 } }
      ]);

      // Populate references
      await Assignment.populate(assignments, [
        { path: 'class', select: 'name' },
        { path: 'subject', select: 'name code' },
        { path: 'createdBy', select: 'name' }
      ]);

      res.status(200).json({ success: true, assignments });
    } catch (error) {
      next(error);
    }
  }));

// 🎯 Get student's exams
router.get("/my/exams", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const student = await Student.findById(req.user._id).populate('class');

    if (!student || !student.class) {
      return res.status(200).json({
        success: true,
        exams: []
      });
    }

    const exams = await Exam.find({
      class: student.class._id,
      // date: { $gte: new Date() }
    })
      .populate('class', 'name section')
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      exams
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get student's results
router.get("/my/results", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { term, year } = req.query;
    const studentId = req.user._id;

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

// 🎯 Get student's routines/schedule
router.get("/my/routines", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const student = await Student.findById(req.user._id).populate('class');

    if (!student || !student.class) {
      return res.status(200).json({
        success: true,
        routines: []
      });
    }

    const routines = await Routine.find({
      class: student.class._id
    })
      .populate('class', 'name section')
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ day: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      routines
    });

  } catch (error) {
    next(error);
  }
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

//start student payment endpoints
// ✅ Get student's payment information
router.get("/my/payments", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { academicYear = new Date().getFullYear().toString(), page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Since student is authenticated, we can use req.user._id
    const studentId = req.user._id;

    const [payments, total, student] = await Promise.all([
      Payment.find({
        student: studentId,
        academicYear
      })
        .populate('class', 'name')
        .populate('collectedBy', 'name')
        .sort({ dueDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),

      Payment.countDocuments({
        student: studentId,
        academicYear
      }),

      Student.findById(studentId)
        .populate('class', 'name section')
        .select('name rollNumber class')
    ]);

    // Calculate payment summary
    const totalDue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const outstanding = totalDue - totalPaid;

    // Group payments by status
    const paymentsByStatus = {
      paid: payments.filter(p => p.status === 'paid'),
      pending: payments.filter(p => p.status === 'pending'),
      overdue: payments.filter(p => p.status === 'overdue'),
      partial: payments.filter(p => p.status === 'partial')
    };

    res.status(200).json({
      success: true,
      student,
      payments,
      summary: {
        totalDue,
        totalPaid,
        outstanding,
        collectionRate: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 100,
        statusCounts: {
          paid: paymentsByStatus.paid.length,
          pending: paymentsByStatus.pending.length,
          overdue: paymentsByStatus.overdue.length,
          partial: paymentsByStatus.partial.length
        }
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPayments: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error in student payments:', error);
    next(error);
  }
}));

// ✅ Get student payment summary for dashboard
router.get("/my/payments/summary", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { academicYear = new Date().getFullYear().toString() } = req.query;
    const studentId = req.user._id;

    const payments = await Payment.find({
      student: studentId,
      academicYear
    });

    const totalDue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const outstanding = totalDue - totalPaid;

    // Get upcoming due payments
    const upcomingPayments = await Payment.find({
      student: studentId,
      academicYear,
      dueDate: { $gte: new Date() },
      status: { $in: ['pending', 'overdue'] }
    })
      .populate('class', 'name')
      .sort({ dueDate: 1 })
      .limit(5);

    // Get recent payments
    const recentPayments = await Payment.find({
      student: studentId,
      academicYear,
      status: { $in: ['paid', 'partial'] }
    })
      .populate('class', 'name')
      .sort({ paidDate: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      summary: {
        totalDue,
        totalPaid,
        outstanding,
        collectionRate: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 100
      },
      upcomingPayments: upcomingPayments.map(p => ({
        _id: p._id,
        feeType: p.feeType,
        amount: p.amount,
        dueDate: p.dueDate,
        status: p.status
      })),
      recentPayments: recentPayments.map(p => ({
        _id: p._id,
        feeType: p.feeType,
        paidAmount: p.paidAmount,
        paidDate: p.paidDate,
        receiptNumber: p.receiptNumber
      }))
    });

  } catch (error) {
    console.error('Error in student payment summary:', error);
    next(error);
  }
}));

// ✅ Download student's payment receipt
router.get("/my/payments/:paymentId/receipt", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const studentId = req.user._id;

    // Find payment and verify it belongs to the student
    const payment = await Payment.findOne({
      _id: paymentId,
      student: studentId
    })
      .populate('class', 'name')
      .populate('recordedBy', 'name');

    if (!payment) {
      return next(new ErrorHandler("Payment not found or access denied", 404));
    }

    // Get student info
    const student = await Student.findById(studentId)
      .populate('class', 'name section')
      .select('name rollNumber class');

    res.status(200).json({
      success: true,
      receipt: {
        receiptNumber: payment.receiptNumber,
        student: student,
        class: payment.class,
        feeType: payment.feeType,
        amount: payment.amount,
        paidAmount: payment.paidAmount,
        paidDate: payment.paidDate,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        recordedBy: payment.recordedBy,
        transactionId: payment.transactionId,
        dueDate: payment.dueDate
      }
    });

  } catch (error) {
    console.error('Error generating student receipt:', error);
    next(error);
  }
}));

// ✅ Get student dashboard with payment info (enhanced version)
router.get("/my/dashboard", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const currentYear = new Date().getFullYear().toString();

    const student = await Student.findById(studentId)
      .populate('class', 'name section')
      .select('name rollNumber class email');

    if (!student) {
      return next(new ErrorHandler("Student profile not found", 404));
    }

    // Get payment summary
    const payments = await Payment.find({
      student: studentId,
      academicYear: currentYear
    });

    const paymentSummary = {
      totalDue: payments.reduce((sum, p) => sum + p.amount, 0),
      totalPaid: payments.reduce((sum, p) => sum + p.paidAmount, 0),
      totalOutstanding: payments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0)
    };

    paymentSummary.collectionRate = paymentSummary.totalDue > 0 ?
      Math.round((paymentSummary.totalPaid / paymentSummary.totalDue) * 100) : 100;

    // Get upcoming due payments
    const upcomingPayments = await Payment.find({
      student: studentId,
      academicYear: currentYear,
      dueDate: { $gte: new Date() },
      status: { $in: ['pending', 'overdue'] }
    })
      .populate('class', 'name')
      .sort({ dueDate: 1 })
      .limit(3);

    // Get recent payments
    const recentPayments = await Payment.find({
      student: studentId,
      academicYear: currentYear,
      status: { $in: ['paid', 'partial'] }
    })
      .populate('class', 'name')
      .sort({ paidDate: -1 })
      .limit(3);

    // Get recent attendance (last 10 records)
    const recentAttendance = await Attendance.find({
      student: studentId,
      date: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 30))
      }
    })
      .populate('subject', 'name')
      .populate('class', 'name')
      .sort({ date: -1, period: 1 })
      .limit(10);

    // Get recent results
    const recentResults = await Result.find({
      student: studentId
    })
      .populate('exam', 'title')
      .populate('subject', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get today's assignments
    const today = new Date();
    const todayAssignments = await Assignment.find({
      class: student.class?._id,
      dueDate: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    })
      .populate('subject', 'name')
      .populate('class', 'name')
      .limit(5);

    // Calculate attendance statistics
    const attendanceStats = {
      totalRecords: recentAttendance.length,
      presentRecords: recentAttendance.filter(a => a.status === 'present').length,
      lateRecords: recentAttendance.filter(a => a.status === 'late').length,
      halfDayRecords: recentAttendance.filter(a => a.status === 'half_day').length
    };

    const weightedScore = attendanceStats.presentRecords +
      (attendanceStats.lateRecords * 0.5) +
      (attendanceStats.halfDayRecords * 0.5);

    attendanceStats.attendancePercentage = attendanceStats.totalRecords > 0 ?
      Math.round((weightedScore / attendanceStats.totalRecords) * 100) : 0;

    res.status(200).json({
      success: true,
      dashboard: {
        student,
        payments: {
          summary: paymentSummary,
          upcoming: upcomingPayments,
          recent: recentPayments
        },
        attendance: {
          stats: attendanceStats,
          recent: recentAttendance
        },
        assignments: {
          today: todayAssignments
        },
        results: recentResults
      }
    });

  } catch (error) {
    console.error('Error in student dashboard:', error);
    next(error);
  }
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

module.exports = router;