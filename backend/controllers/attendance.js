// routes/attendanceRoutes.js - UPDATED WITH NEW ENDPOINTS
const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Parent = require("../models/Parent");
const Routine = require("../models/Routine"); // ADD THIS
const Class = require("../models/Class"); // ADD THIS
const { isAuthenticated, authorizeRoles, isStudentAuthenticated } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Teacher = require("../models/Teacher");

// ==================== NEW ENDPOINTS ====================

// 🎯 GET CLASS ROUTINE FOR A SPECIFIC DAY
router.get("/routine/:classId", isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { classId } = req.params;
      const { day } = req.query;

      if (!day) {
        return next(new ErrorHandler("Day parameter is required", 400));
      }

      const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (!validDays.includes(day)) {
        return next(new ErrorHandler("Invalid day. Must be a weekday name", 400));
      }

      // Get teacher's classes if teacher
      if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user._id });
        if (!teacher.classes.includes(classId)) {
          return next(new ErrorHandler("You are not assigned to this class", 403));
        }
      }

      const routines = await Routine.find({
        class: classId,
        day: day,
        isActive: true
      })
        .populate('subject', 'name code')
        .populate('teacher', 'name')
        .sort('periodNumber');

      const scheduledPeriods = routines.map(routine => ({
        periodNumber: routine.periodNumber,
        subject: routine.subject,
        teacher: routine.teacher,
        startTime: routine.startTime,
        endTime: routine.endTime,
        roomNumber: routine.roomNumber
      }));

      res.status(200).json({
        success: true,
        classId,
        day,
        scheduledPeriods,
        count: scheduledPeriods.length
      });

    } catch (error) {
      next(error);
    }
  }));

// 🎯 GET TODAY'S SCHEDULE FOR TEACHER
// router.get("/todays-schedule", isAuthenticated,
//   authorizeRoles("admin", "teacher"),
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { date } = req.query;
//       const selectedDate = date ? new Date(date) : new Date();
//       const day = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

//       let teacher;
//       if (req.user.role === 'teacher') {
//         teacher = await Teacher.findOne({ user: req.user._id });
//         if (!teacher) {
//           return next(new ErrorHandler("Teacher profile not found", 404));
//         }
//       }

//       const todaysSchedule = [];

//       // For admin, get all classes
//       let classes;
//       if (req.user.role === 'admin') {
//         classes = await Class.find({}).populate('section', 'name');
//       } else {
//         // For teacher, get only assigned classes
//         classes = await Class.find({
//           _id: { $in: teacher.classes }
//         }).populate('section', 'name');
//       }

//       for (const cls of classes) {
//         // Get routine for this class on this day
//         const routines = await Routine.find({
//           class: cls._id,
//           day: day,
//           isActive: true
//         })
//           .populate('subject', 'name')
//           .sort('periodNumber');

//         for (const routine of routines) {
//           // Check if attendance is already marked
//           const attendanceMarked = await Attendance.findOne({
//             class: cls._id,
//             date: {
//               $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
//               $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
//             },
//             period: routine.periodNumber,
//             subject: routine.subject._id
//           });

//           todaysSchedule.push({
//             classId: cls._id,
//             className: cls.name,
//             sectionName: cls.section?.name || '',
//             periodNumber: routine.periodNumber,
//             subject: routine.subject,
//             teacher: routine.teacher,
//             startTime: routine.startTime,
//             endTime: routine.endTime,
//             roomNumber: routine.roomNumber,
//             attendanceMarked: !!attendanceMarked,
//             totalStudents: cls.students?.length || 0,
//             attendanceRecord: attendanceMarked ? {
//               markedBy: attendanceMarked.recordedBy,
//               markedAt: attendanceMarked.createdAt,
//               statusCounts: {} // You could add status counts here
//             } : null
//           });
//         }
//       }

//       // Sort by start time
//       todaysSchedule.sort((a, b) => {
//         const timeA = a.startTime.split(':').map(Number);
//         const timeB = b.startTime.split(':').map(Number);
//         return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
//       });

//       // Calculate upcoming classes
//       const now = new Date();
//       const currentTime = now.getHours() * 60 + now.getMinutes();
      
//       const upcomingClasses = todaysSchedule.filter(cls => {
//         const endTime = cls.endTime.split(':').map(Number);
//         const endTimeMinutes = endTime[0] * 60 + endTime[1];
//         return endTimeMinutes > currentTime && !cls.attendanceMarked;
//       });

//       const completedClasses = todaysSchedule.filter(cls => {
//         const endTime = cls.endTime.split(':').map(Number);
//         const endTimeMinutes = endTime[0] * 60 + endTime[1];
//         return endTimeMinutes <= currentTime;
//       });

//       res.status(200).json({
//         success: true,
//         date: selectedDate,
//         day,
//         todaysSchedule,
//         statistics: {
//           totalClasses: todaysSchedule.length,
//           completedClasses: completedClasses.length,
//           upcomingClasses: upcomingClasses.length,
//           markedClasses: todaysSchedule.filter(c => c.attendanceMarked).length
//         },
//         upcomingClasses: upcomingClasses.slice(0, 3) // Next 3 upcoming classes
//       });

//     } catch (error) {
//       console.log("/todays-schedule:", error)
//       next(error);
//     }
//   }));

// routes/attendanceRoutes.js - FIXED todays-schedule endpoint
router.get("/todays-schedule", isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { date } = req.query;
      const selectedDate = date ? new Date(date) : new Date();
      const day = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

      const todaysSchedule = [];

      // For teacher, we need to handle it differently
      if (req.user.role === 'teacher') {
        // First, find the teacher document
        const teacher = await Teacher.findOne({ user: req.user._id })
          .populate('classes', '_id name section students')
          .populate('subjects', '_id name');

        if (!teacher) {
          return next(new ErrorHandler("Teacher profile not found", 404));
        }

        // Get classes from teacher's classes field OR from routines
        let teacherClasses = [];
        
        // Option 1: Use teacher.classes if it exists
        if (teacher.classes && teacher.classes.length > 0) {
          teacherClasses = teacher.classes;
        } else {
          // Option 2: Get classes from routines where teacher is assigned
          const routinesWithClasses = await Routine.find({
            teacher: teacher._id,
            day: day,
            isActive: true
          }).distinct('class');
          
          teacherClasses = await Class.find({
            _id: { $in: routinesWithClasses }
          }).populate('section', 'name');
        }

        // Process each class
        for (const cls of teacherClasses) {
          // Get routines for this class where THIS teacher is teaching
          const routines = await Routine.find({
            class: cls._id,
            teacher: teacher._id,
            day: day,
            isActive: true
          })
            .populate('subject', 'name')
            .sort('periodNumber');

          for (const routine of routines) {
            await processRoutine(routine, cls, selectedDate);
          }
        }
      } else {
        // For admin, get all classes
        const classes = await Class.find({})
          .populate('section', 'name')
          .populate('students', '_id');

        for (const cls of classes) {
          // Get all routines for this class on this day
          const routines = await Routine.find({
            class: cls._id,
            day: day,
            isActive: true
          })
            .populate('subject', 'name')
            .populate('teacher', 'name')
            .sort('periodNumber');

          for (const routine of routines) {
            await processRoutine(routine, cls, selectedDate);
          }
        }
      }

      // Sort by start time
      todaysSchedule.sort((a, b) => {
        const timeA = a.startTime.split(':').map(Number);
        const timeB = b.startTime.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
      });

      // Calculate statistics
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const upcomingClasses = todaysSchedule.filter(cls => {
        const endTime = cls.endTime.split(':').map(Number);
        const endTimeMinutes = endTime[0] * 60 + endTime[1];
        return endTimeMinutes > currentTime && !cls.attendanceMarked;
      });

      const completedClasses = todaysSchedule.filter(cls => {
        const endTime = cls.endTime.split(':').map(Number);
        const endTimeMinutes = endTime[0] * 60 + endTime[1];
        return endTimeMinutes <= currentTime;
      });

      res.status(200).json({
        success: true,
        date: selectedDate,
        day,
        todaysSchedule,
        statistics: {
          totalClasses: todaysSchedule.length,
          completedClasses: completedClasses.length,
          upcomingClasses: upcomingClasses.length,
          markedClasses: todaysSchedule.filter(c => c.attendanceMarked).length
        },
        upcomingClasses: upcomingClasses.slice(0, 3)
      });

      // Helper function to process each routine
      async function processRoutine(routine, cls, selectedDate) {
        // Check if attendance is already marked
        const attendanceMarked = await Attendance.findOne({
          class: cls._id,
          date: {
            $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
            $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
          },
          period: routine.periodNumber,
          subject: routine.subject._id
        });

        // Get attendance counts if marked
        let statusCounts = null;
        if (attendanceMarked) {
          const allAttendance = await Attendance.find({
            class: cls._id,
            date: {
              $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
              $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
            },
            period: routine.periodNumber,
            subject: routine.subject._id
          });
          
          statusCounts = {
            present: allAttendance.filter(a => a.status === 'present').length,
            absent: allAttendance.filter(a => a.status === 'absent').length,
            late: allAttendance.filter(a => a.status === 'late').length,
            half_day: allAttendance.filter(a => a.status === 'half_day').length,
            total: allAttendance.length
          };
        }

        todaysSchedule.push({
          classId: cls._id,
          className: cls.name,
          sectionName: cls.section?.name || '',
          periodNumber: routine.periodNumber,
          subject: routine.subject,
          teacher: routine.teacher,
          startTime: routine.startTime,
          endTime: routine.endTime,
          roomNumber: routine.roomNumber,
          attendanceMarked: !!attendanceMarked,
          totalStudents: cls.students?.length || 0,
          attendanceRecord: attendanceMarked ? {
            markedBy: attendanceMarked.recordedBy,
            markedAt: attendanceMarked.createdAt,
            statusCounts
          } : null
        });
      }

    } catch (error) {
      console.error("/todays-schedule error:", error);
      next(error);
    }
  }));
  
// 🎯 GET ATTENDANCE OVERVIEW FOR DASHBOARD
router.get("/overview", isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { date } = req.query;
      const selectedDate = date ? new Date(date) : new Date();
      
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

      // For teacher, filter by their classes
      let classFilter = {};
      if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user._id });
        if (teacher && teacher.classes.length > 0) {
          classFilter = { class: { $in: teacher.classes } };
        }
      }

      const attendanceStats = await Attendance.aggregate([
        {
          $match: {
            date: { $gte: startOfDay, $lt: endOfDay },
            ...classFilter
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const present = attendanceStats.find(s => s._id === 'present')?.count || 0;
      const total = attendanceStats.reduce((sum, s) => sum + s.count, 0);
      const averageAttendance = total > 0 ? Math.round((present / total) * 100) : 0;

      // Get today's schedule count
      const day = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      let classIds = [];
      if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user._id });
        classIds = teacher?.classes || [];
      } else {
        const allClasses = await Class.find({}, '_id');
        classIds = allClasses.map(c => c._id);
      }

      const todaysRoutines = await Routine.countDocuments({
        class: { $in: classIds },
        day: day,
        isActive: true
      });

      // Get marked attendance count
      const markedAttendance = await Attendance.countDocuments({
        date: { $gte: startOfDay, $lt: endOfDay },
        ...classFilter
      });

      res.status(200).json({
        success: true,
        date: selectedDate,
        overview: {
          totalRecords: total,
          present,
          absent: attendanceStats.find(s => s._id === 'absent')?.count || 0,
          late: attendanceStats.find(s => s._id === 'late')?.count || 0,
          half_day: attendanceStats.find(s => s._id === 'half_day')?.count || 0,
          excused: attendanceStats.find(s => s._id === 'excused')?.count || 0,
          holiday: attendanceStats.find(s => s._id === 'holiday')?.count || 0,
          averageAttendance,
          scheduledClasses: todaysRoutines,
          markedClasses: Math.min(markedAttendance > 0 ? 1 : 0, todaysRoutines), // Estimate
          attendanceRate: averageAttendance
        }
      });

    } catch (error) {
      next(error);
    }
  }));

// 🎯 MARK ATTENDANCE WITH ROUTINE VALIDATION (UPDATED VERSION)
router.post("/mark-with-routine", isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { classId, date, attendanceRecords } = req.body;

      if (!classId || !date || !attendanceRecords || !Array.isArray(attendanceRecords)) {
        return next(new ErrorHandler("Class ID, date, and attendance records are required", 400));
      }

      const attendanceDate = new Date(date);
      const day = attendanceDate.toLocaleDateString('en-US', { weekday: 'long' });
      const today = new Date();

      // if (attendanceDate > today) {
      //   return next(new ErrorHandler("Cannot mark attendance for future dates", 400));
      // }

      // Verify teacher access
      if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user._id });
        if (!teacher.classes.includes(classId)) {
          return next(new ErrorHandler("You are not assigned to this class", 403));
        }
      }

      const operations = [];
      const results = [];
      const errors = [];

      // Group records by period for validation
      const periodGroups = {};
      attendanceRecords.forEach(record => {
        if (!periodGroups[record.period]) {
          periodGroups[record.period] = [];
        }
        periodGroups[record.period].push(record);
      });

      for (const [period, records] of Object.entries(periodGroups)) {
        const periodNum = parseInt(period);
        
        // Check if period exists in routine for this day
        const routine = await Routine.findOne({
          class: classId,
          day: day,
          periodNumber: periodNum,
          isActive: true
        }).populate('subject', '_id name');

        if (!routine) {
          errors.push(`No class scheduled for period ${period} on ${day}`);
          continue;
        }

        // For teacher, verify they teach this subject
        if (req.user.role === 'teacher') {
          const teacher = await Teacher.findOne({ user: req.user._id });
          if (!teacher.subjects.includes(routine.subject._id)) {
            errors.push(`You are not assigned to teach ${routine.subject.name}`);
            continue;
          }
        }

        for (const record of records) {
          try {
            const { studentId, status, remarks } = record;

            if (!studentId || !status) {
              errors.push(`Invalid record for student: ${studentId}`);
              continue;
            }

            const filter = {
              student: studentId,
              subject: routine.subject._id,
              date: attendanceDate,
              period: periodNum
            };

            operations.push({
              updateOne: {
                filter: filter,
                update: {
                  $set: {
                    ...filter,
                    class: classId,
                    subject: routine.subject._id,
                    day: day,
                    status: status,
                    periodTimeRange: {
                      start: routine.startTime,
                      end: routine.endTime
                    },
                    recordedBy: req.user._id,
                    remarks: remarks || "",
                    teacher: routine.teacher
                  }
                },
                upsert: true
              }
            });

            results.push({ 
              studentId, 
              status,
              period: periodNum,
              subject: routine.subject.name
            });

          } catch (error) {
            errors.push(`Failed to process student ${record.studentId}: ${error.message}`);
          }
        }
      }

      if (operations.length > 0) {
        await Attendance.bulkWrite(operations, { ordered: false });
      }

      res.status(200).json({
        success: true,
        message: `Attendance marked for ${results.length} students across ${Object.keys(periodGroups).length} periods`,
        date: attendanceDate,
        day: day,
        class: classId,
        results,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      next(error);
    }
  }));

// 🎯 GET ATTENDANCE BY DATE AND PERIOD
router.get("/date/:date/period/:period", isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { date, period } = req.params;
      const { classId, subjectId } = req.query;

      const attendanceDate = new Date(date);
      const periodNum = parseInt(period);

      if (periodNum < 1 || periodNum > 12) {
        return next(new ErrorHandler("Period must be between 1 and 12", 400));
      }

      let query = {
        date: attendanceDate,
        period: periodNum
      };

      if (classId) query.class = classId;
      if (subjectId) query.subject = subjectId;

      const attendance = await Attendance.find(query)
        .populate('student', 'name rollNumber')
        .populate('subject', 'name')
        .populate('class', 'name')
        .populate('recordedBy', 'name')
        .populate('teacher', 'name')
        .sort({ 'student.rollNumber': 1 });

      // Get day from date
      const day = attendanceDate.toLocaleDateString('en-US', { weekday: 'long' });

      res.status(200).json({
        success: true,
        date: attendanceDate,
        day,
        period: periodNum,
        attendance,
        count: attendance.length,
        statistics: {
          present: attendance.filter(a => a.status === 'present').length,
          absent: attendance.filter(a => a.status === 'absent').length,
          late: attendance.filter(a => a.status === 'late').length,
          half_day: attendance.filter(a => a.status === 'half_day').length
        }
      });

    } catch (error) {
      next(error);
    }
  }));

// 🎯 BULK MARK ATTENDANCE FOR MULTIPLE PERIODS
router.post("/bulk-mark", isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { classId, date, bulkRecords } = req.body;

      if (!classId || !date || !bulkRecords || !Array.isArray(bulkRecords)) {
        return next(new ErrorHandler("Class ID, date, and bulk records are required", 400));
      }

      const attendanceDate = new Date(date);
      const day = attendanceDate.toLocaleDateString('en-US', { weekday: 'long' });

      // Verify teacher access
      if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user._id });
        if (!teacher.classes.includes(classId)) {
          return next(new ErrorHandler("You are not assigned to this class", 403));
        }
      }

      const operations = [];
      const results = [];
      const errors = [];

      for (const bulkRecord of bulkRecords) {
        const { period, studentStatuses } = bulkRecord;

        if (!period || !studentStatuses || !Array.isArray(studentStatuses)) {
          errors.push(`Invalid bulk record for period ${period}`);
          continue;
        }

        // Check if period exists in routine
        const routine = await Routine.findOne({
          class: classId,
          day: day,
          periodNumber: period,
          isActive: true
        }).populate('subject', '_id name');

        if (!routine) {
          errors.push(`No class scheduled for period ${period} on ${day}`);
          continue;
        }

        for (const record of studentStatuses) {
          try {
            const { studentId, status, remarks } = record;

            if (!studentId || !status) {
              errors.push(`Invalid record for student: ${studentId} in period ${period}`);
              continue;
            }

            const filter = {
              student: studentId,
              subject: routine.subject._id,
              date: attendanceDate,
              period: period
            };

            operations.push({
              updateOne: {
                filter: filter,
                update: {
                  $set: {
                    ...filter,
                    class: classId,
                    subject: routine.subject._id,
                    day: day,
                    status: status,
                    periodTimeRange: {
                      start: routine.startTime,
                      end: routine.endTime
                    },
                    recordedBy: req.user._id,
                    remarks: remarks || "",
                    teacher: routine.teacher
                  }
                },
                upsert: true
              }
            });

            results.push({
              studentId,
              period,
              subject: routine.subject.name,
              status
            });

          } catch (error) {
            errors.push(`Failed to process student ${record.studentId} in period ${period}: ${error.message}`);
          }
        }
      }

      if (operations.length > 0) {
        const bulkResult = await Attendance.bulkWrite(operations, { ordered: false });
        
        res.status(200).json({
          success: true,
          message: `Bulk attendance marked successfully for ${results.length} records`,
          date: attendanceDate,
          day: day,
          class: classId,
          bulkWriteResult: {
            insertedCount: bulkResult.upsertedCount || 0,
            modifiedCount: bulkResult.modifiedCount || 0,
            matchedCount: bulkResult.matchedCount || 0
          },
          results: results.slice(0, 100), // Return first 100 results
          errors: errors.length > 0 ? errors.slice(0, 20) : undefined
        });
      } else {
        res.status(400).json({
          success: false,
          message: "No valid records to process",
          errors
        });
      }

    } catch (error) {
      next(error);
    }
  }));

// ==================== YOUR EXISTING ENDPOINTS (KEEP AS IS) ====================

// 🎯 MARK ATTENDANCE (SUBJECT-BASED) - KEEP THIS FOR BACKWARD COMPATIBILITY
router.post("/mark", isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { classId, subjectId, date, period, attendanceRecords } = req.body;

      if (!classId || !subjectId || !date || !period || !attendanceRecords || !Array.isArray(attendanceRecords)) {
        return next(new ErrorHandler("Class ID, subject ID, date, period, and attendance records are required", 400));
      }

      if (period < 1 || period > 10) {
        return next(new ErrorHandler("Period must be between 1 and 10", 400));
      }
      const teacher = await Teacher.findOne({ user: req.user._id });

      if (req.user.role === 'teacher') {
        if (!teacher.classes.includes(classId) || !teacher.subjects.includes(subjectId)) {
          return next(new ErrorHandler("You are not assigned to this class or subject", 403));
        }
      }
      const attendanceDate = new Date(date);
      const today = new Date();

      if (attendanceDate > today) {
        return next(new ErrorHandler("Cannot mark attendance for future dates", 400));
      }

      const operations = [];
      const results = [];
      const errors = [];

      for (const record of attendanceRecords) {
        try {
          const { studentId, status, remarks } = record;

          if (!studentId || !status) {
            errors.push(`Invalid record for student: ${studentId}`);
            continue;
          }

          const filter = {
            student: studentId,
            subject: subjectId,
            date: attendanceDate,
            period: period
          };

          operations.push({
            updateOne: {
              filter: filter,
              update: {
                $set: {
                  ...filter,
                  class: classId,
                  status: status,
                  recordedBy: req.user._id,
                  remarks: remarks || ""
                }
              },
              upsert: true
            }
          });

          results.push({ studentId, status });

        } catch (error) {
          errors.push(`Failed to process student ${record.studentId}: ${error.message}`);
        }
      }

      if (operations.length > 0) {
        await Attendance.bulkWrite(operations, { ordered: false });
      }

      res.status(200).json({
        success: true,
        message: `Attendance marked for ${results.length} students in period ${period}`,
        subject: subjectId,
        period: period,
        date: attendanceDate,
        results,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      next(error);
    }
  }));

// 🎯 GET ATTENDANCE BY CLASS, SUBJECT & DATE - UPDATED TO INCLUDE DAY
router.get("/class/:classId/subject/:subjectId/date/:date", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { classId, subjectId, date } = req.params;
    const { period } = req.query;

    const attendanceDate = new Date(date);
    const day = attendanceDate.toLocaleDateString('en-US', { weekday: 'long' });

    let query = {
      class: classId,
      subject: subjectId,
      date: attendanceDate
    };

    if (period) {
      query.period = parseInt(period);
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name rollNumber')
      .populate('subject', 'name')
      .populate('recordedBy', 'name')
      .sort({ period: 1, 'student.name': 1 });

    res.status(200).json({
      success: true,
      date: attendanceDate,
      day: day,
      class: classId,
      subject: subjectId,
      attendance,
      count: attendance.length
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 GET STUDENT ATTENDANCE HISTORY - UPDATED TO INCLUDE DAY
router.get("/student/:studentId", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { month, year, subjectId } = req.query;

    let dateFilter = {};

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter = {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }

    let query = {
      student: studentId,
      ...dateFilter
    };

    if (subjectId) {
      query.subject = subjectId;
    }

    const attendance = await Attendance.find(query)
      .populate('class', 'name')
      .populate('subject', 'name')
      .populate('recordedBy', 'name')
      .sort({ date: -1, period: 1 });

    // Calculate statistics
    const totalRecords = attendance.length;
    const presentRecords = attendance.filter(a => a.status === 'present').length;
    const absentRecords = attendance.filter(a => a.status === 'absent').length;
    const lateRecords = attendance.filter(a => a.status === 'late').length;
    const halfDayRecords = attendance.filter(a => a.status === 'half_day').length;
    const excusedRecords = attendance.filter(a => a.status === 'excused').length;
    const holidayRecords = attendance.filter(a => a.status === 'holiday').length;

    const attendancePercentage = totalRecords > 0 ?
      ((presentRecords + (lateRecords * 0.5) + (halfDayRecords * 0.5)) / totalRecords) * 100 : 0;

    res.status(200).json({
      success: true,
      attendance,
      statistics: {
        totalRecords,
        presentRecords,
        absentRecords,
        lateRecords,
        halfDayRecords,
        excusedRecords,
        holidayRecords,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100
      }
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 GET CLASS ATTENDANCE SUMMARY (SUBJECT-WISE) - UPDATED
router.get(
  "/class/:classId/summary",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { classId } = req.params;
      const { month, year, subjectId } = req.query;

      if (!month || !year) {
        return next(new ErrorHandler("Month and year are required", 400));
      }

      // Generate Month Range
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Base Query
      let query = {
        class: classId,
        date: { $gte: startDate, $lte: endDate },
      };

      // Subject logic
      if (subjectId) {
        query.subject = subjectId;
      } else {
        // Exclude invalid subject records
        query.subject = { $ne: null };
      }

      // Fetch attendance
      const attendance = await Attendance.find(query)
        .populate("student", "name rollNumber gender")
        .populate("subject", "name")
        .sort({ date: 1, period: 1 });

      // Group by student & subject
      const studentSubjectMap = new Map();

      for (const record of attendance) {
        // Safety checks
        if (!record.student || !record.subject) continue;

        const studentId = record.student._id.toString();
        const subjectId = record.subject._id.toString();
        const key = `${studentId}-${subjectId}`;

        // Initialize group
        if (!studentSubjectMap.has(key)) {
          studentSubjectMap.set(key, {
            student: record.student,
            subject: record.subject,
            records: [],
            present: 0,
            absent: 0,
            late: 0,
            half_day: 0,
            excused: 0,
            holiday: 0
          });
        }

        const group = studentSubjectMap.get(key);

        group.records.push(record);
        group[record.status]++;
      }

      // Convert grouped data into response format
      const summary = [...studentSubjectMap.values()].map((item) => {
        const total =
          item.present + item.absent + item.late + item.half_day;

        const weighted =
          item.present + item.late * 0.5 + item.half_day * 0.5;

        const percentage = total > 0 ? (weighted / total) * 100 : 0;

        return {
          ...item,
          totalRecords: total,
          attendancePercentage: Math.round(percentage * 100) / 100,
        };
      });

      // Calculate overall stats
      const totalRecords = summary.reduce(
        (sum, entry) => sum + entry.totalRecords,
        0
      );

      const averagePercentage =
        summary.length > 0
          ? Math.round(
              (summary.reduce(
                (sum, entry) => sum + entry.attendancePercentage,
                0
              ) /
                summary.length) *
                100
            ) / 100
          : 0;

      const uniqueStudents = new Set(
        attendance.map((a) => a.student?._id?.toString())
      ).size;

      const uniqueSubjects = new Set(
        attendance.map((a) => a.subject?._id?.toString())
      ).size;

      res.status(200).json({
        success: true,
        period: {
          month: parseInt(month),
          year: parseInt(year),
          startDate,
          endDate,
        },
        summary,
        statistics: {
          totalStudents: uniqueStudents,
          totalSubjects: uniqueSubjects,
          totalRecords,
          averagePercentage,
        },
      });
    } catch (error) {
      next(error);
    }
  })
);

// 🎯 UPDATE SINGLE ATTENDANCE RECORD - UPDATED TO INCLUDE DAY
router.put("/update/:id", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { status, remarks } = req.body;

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return next(new ErrorHandler("Attendance record not found", 404));
    }

    // Add after finding attendance record
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });

      if (!teacher.classes.includes(attendance.class.toString()) ||
        !teacher.subjects.includes(attendance.subject.toString())) {
        return next(new ErrorHandler("You are not assigned to this class or subject", 403));
      }
    }

    attendance.status = status;
    attendance.remarks = remarks || "";
    attendance.recordedBy = req.user._id;
    await attendance.save();

    const updatedAttendance = await Attendance.findById(req.params.id)
      .populate('student', 'name rollNumber')
      .populate('subject', 'name')
      .populate('recordedBy', 'name');

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      attendance: updatedAttendance
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 GET TODAY'S ATTENDANCE FOR A CLASS - UPDATED WITH ROUTINE CHECK
router.get("/class/:classId/today", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.toLocaleDateString('en-US', { weekday: 'long' });

    const { subjectId, period } = req.query;

    let query = {
      class: req.params.classId,
      date: today
    };

    // Add after query construction
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });

      if (!teacher.classes.includes(req.params.classId)) {
        return next(new ErrorHandler("You are not assigned to this class", 403));
      }

      // Only show subjects assigned to this teacher
      query.subject = { $in: teacher.subjects };
    }

    if (subjectId) query.subject = subjectId;
    if (period) query.period = parseInt(period);

    const attendance = await Attendance.find(query)
      .populate('student', 'name rollNumber')
      .populate('subject', 'name')
      .populate('recordedBy', 'name')
      .sort({ period: 1, 'student.name': 1 });

    // Get today's routine for comparison
    const todaysRoutine = await Routine.find({
      class: req.params.classId,
      day: day,
      isActive: true
    })
      .populate('subject', 'name')
      .sort('periodNumber');

    // Create a map of scheduled vs marked periods
    const scheduledPeriods = todaysRoutine.map(routine => ({
      period: routine.periodNumber,
      subject: routine.subject.name,
      startTime: routine.startTime,
      endTime: routine.endTime,
      marked: attendance.some(a => a.period === routine.periodNumber && a.subject._id.toString() === routine.subject._id.toString())
    }));

    // Get unique subjects marked today
    const subjectsMarked = [...new Set(attendance.map(a => a.subject?._id.toString()))];

    res.status(200).json({
      success: true,
      date: today,
      day: day,
      attendance,
      scheduledPeriods,
      markedCount: attendance.length,
      subjectsMarked,
      scheduledCount: todaysRoutine.length,
      isTodayMarked: attendance.length > 0,
      completionRate: todaysRoutine.length > 0 ? 
        Math.round((scheduledPeriods.filter(p => p.marked).length / todaysRoutine.length) * 100) : 0
    });

  } catch (error) {
    next(error);
  }
}));

// KEEP ALL OTHER EXISTING ENDPOINTS (teacher/my-subjects, my/attendance, etc.)
// 🎯 GET TEACHER'S SUBJECTS ATTENDANCE
router.get("/teacher/my-subjects", isAuthenticated, authorizeRoles("teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const teacherId = req.user._id;

    // Get teacher's subjects and classes
    const Teacher = require("../models/Teacher");
    const teacher = await Teacher.findOne({ user: teacherId })
      .populate('subjects', 'name')
      .populate('classes', 'name');

    if (!teacher) {
      return next(new ErrorHandler("Teacher profile not found", 404));
    }

    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter = {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }

    // Get attendance for teacher's subjects and classes
    const attendance = await Attendance.find({
      subject: { $in: teacher.subjects },
      class: { $in: teacher.classes },
      ...dateFilter
    })
      .populate('student', 'name rollNumber')
      .populate('subject', 'name')
      .populate('class', 'name')
      .sort({ date: -1, period: 1 });

    res.status(200).json({
      success: true,
      teacher: {
        name: req.user.name,
        subjects: teacher.subjects,
        classes: teacher.classes
      },
      attendance,
      count: attendance.length
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 STUDENT: GET MY ATTENDANCE
router.get("/my/attendance", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { month, year, subjectId } = req.query;
    const studentId = req.user._id;

    let dateFilter = {};

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter = {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }

    let query = {
      student: studentId,
      ...dateFilter
    };

    if (subjectId) {
      query.subject = subjectId;
    }

    const attendance = await Attendance.find(query)
      .populate('class', 'name')
      .populate('subject', 'name')
      .populate('recordedBy', 'name')
      .sort({ date: -1, period: 1 });

    // Calculate statistics
    const totalRecords = attendance.length;
    const presentRecords = attendance.filter(a => a.status === 'present').length;
    const absentRecords = attendance.filter(a => a.status === 'absent').length;
    const lateRecords = attendance.filter(a => a.status === 'late').length;
    const halfDayRecords = attendance.filter(a => a.status === 'half_day').length;

    const attendancePercentage = totalRecords > 0 ?
      ((presentRecords + (lateRecords * 0.5) + (halfDayRecords * 0.5)) / totalRecords) * 100 : 0;

    res.status(200).json({
      success: true,
      attendance,
      statistics: {
        totalRecords,
        presentRecords,
        absentRecords,
        lateRecords,
        halfDayRecords,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100
      }
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 PARENT: GET CHILDREN'S ATTENDANCE
router.get("/my/children/attendance", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { month, year, childId, subjectId } = req.query;

    const parent = await Parent.findOne({ user: req.user._id });
    if (!parent) {
      return next(new ErrorHandler("Parent profile not found", 404));
    }

    // Verify the child belongs to this parent
    if (childId && !parent.children.includes(childId)) {
      return next(new ErrorHandler("Access denied to this child's data", 403));
    }

    const childrenIds = childId ? [childId] : parent.children;

    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter = {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }

    let query = {
      student: { $in: childrenIds },
      ...dateFilter
    };

    if (subjectId) {
      query.subject = subjectId;
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name rollNumber class')
      .populate('class', 'name')
      .populate('subject', 'name')
      .sort({ date: -1, period: 1 });

    // Calculate statistics per child
    const childStats = {};
    childrenIds.forEach(childId => {
      const childAttendance = attendance.filter(a => a.student._id.toString() === childId.toString());
      const totalRecords = childAttendance.length;
      const presentRecords = childAttendance.filter(a => a.status === 'present').length;
      const lateRecords = childAttendance.filter(a => a.status === 'late').length;
      const halfDayRecords = childAttendance.filter(a => a.status === 'half_day').length;

      const attendancePercentage = totalRecords > 0 ?
        ((presentRecords + (lateRecords * 0.5) + (halfDayRecords * 0.5)) / totalRecords) * 100 : 0;

      childStats[childId] = {
        totalRecords,
        presentRecords,
        lateRecords,
        halfDayRecords,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100
      };
    });

    res.status(200).json({
      success: true,
      attendance,
      statistics: childStats
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 GET ATTENDANCE ANALYTICS
router.get("/analytics/class/:classId", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return next(new ErrorHandler("Month and year are required", 400));
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendance = await Attendance.find({
      class: classId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .populate('student', 'name rollNumber')
      .populate('subject', 'name');

    // Daily attendance trends
    const dailyTrends = {};
    attendance.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!dailyTrends[dateStr]) {
        dailyTrends[dateStr] = { present: 0, absent: 0, late: 0, half_day: 0, total: 0 };
      }
      dailyTrends[dateStr][record.status]++;
      dailyTrends[dateStr].total++;
    });

    // Subject-wise analysis
    const subjectAnalysis = {};
    attendance.forEach(record => {
      const subjectName = record.subject.name;
      if (!subjectAnalysis[subjectName]) {
        subjectAnalysis[subjectName] = { present: 0, absent: 0, late: 0, half_day: 0, total: 0 };
      }
      subjectAnalysis[subjectName][record.status]++;
      subjectAnalysis[subjectName].total++;
    });

    res.status(200).json({
      success: true,
      period: { month: parseInt(month), year: parseInt(year) },
      analytics: {
        dailyTrends,
        subjectAnalysis,
        totalRecords: attendance.length,
        uniqueStudents: new Set(attendance.map(a => a.student._id.toString())).size,
        uniqueSubjects: new Set(attendance.map(a => a.subject._id.toString())).size
      }
    });

  } catch (error) {
    next(error);
  }
}));
module.exports = router;

// // routes/attendanceRoutes.js - UPDATED WITH NEW ENDPOINTS
// const express = require("express");
// const router = express.Router();
// const Attendance = require("../models/Attendance");
// const Student = require("../models/Student");
// const Parent = require("../models/Parent");
// const Routine = require("../models/Routine"); // ADD THIS
// const Class = require("../models/Class"); // ADD THIS
// const { isAuthenticated, authorizeRoles, isStudentAuthenticated } = require("../middleware/auth");
// const ErrorHandler = require("../utils/ErrorHandler");
// const catchAsyncErrors = require("../middleware/catchAsyncErrors");
// const Teacher = require("../models/Teacher");

// // ==================== NEW ENDPOINTS ====================

// // 🎯 GET CLASS ROUTINE FOR A SPECIFIC DAY
// router.get("/routine/:classId", isAuthenticated,
//   authorizeRoles("admin", "teacher"),
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { classId } = req.params;
//       const { day } = req.query;

//       if (!day) {
//         return next(new ErrorHandler("Day parameter is required", 400));
//       }

//       const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
//       if (!validDays.includes(day)) {
//         return next(new ErrorHandler("Invalid day. Must be a weekday name", 400));
//       }

//       // Get teacher's classes if teacher
//       if (req.user.role === 'teacher') {
//         const teacher = await Teacher.findOne({ user: req.user._id });
//         if (!teacher.classes.includes(classId)) {
//           return next(new ErrorHandler("You are not assigned to this class", 403));
//         }
//       }

//       const routines = await Routine.find({
//         class: classId,
//         day: day,
//         isActive: true
//       })
//         .populate('subject', 'name code')
//         .populate('teacher', 'name')
//         .sort('periodNumber');

//       const scheduledPeriods = routines.map(routine => ({
//         periodNumber: routine.periodNumber,
//         subject: routine.subject,
//         teacher: routine.teacher,
//         startTime: routine.startTime,
//         endTime: routine.endTime,
//         roomNumber: routine.roomNumber
//       }));

//       res.status(200).json({
//         success: true,
//         classId,
//         day,
//         scheduledPeriods,
//         count: scheduledPeriods.length
//       });

//     } catch (error) {
//       next(error);
//     }
//   }));

// // 🎯 GET TODAY'S SCHEDULE FOR TEACHER
// router.get("/todays-schedule", isAuthenticated,
//   authorizeRoles("admin", "teacher"),
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { date } = req.query;
//       const selectedDate = date ? new Date(date) : new Date();
//       const day = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

//       let teacher;
//       if (req.user.role === 'teacher') {
//         teacher = await Teacher.findOne({ user: req.user._id });
//         if (!teacher) {
//           return next(new ErrorHandler("Teacher profile not found", 404));
//         }
//       }

//       const todaysSchedule = [];

//       // For admin, get all classes
//       let classes;
//       if (req.user.role === 'admin') {
//         classes = await Class.find({}).populate('section', 'name');
//       } else {
//         // For teacher, get only assigned classes
//         classes = await Class.find({
//           _id: { $in: teacher.classes }
//         }).populate('section', 'name');
//       }

//       for (const cls of classes) {
//         // Get routine for this class on this day
//         const routines = await Routine.find({
//           class: cls._id,
//           day: day,
//           isActive: true
//         })
//           .populate('subject', 'name')
//           .sort('periodNumber');

//         for (const routine of routines) {
//           // Check if attendance is already marked
//           const attendanceMarked = await Attendance.findOne({
//             class: cls._id,
//             date: {
//               $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
//               $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
//             },
//             period: routine.periodNumber,
//             subject: routine.subject._id
//           });

//           todaysSchedule.push({
//             classId: cls._id,
//             className: cls.name,
//             sectionName: cls.section?.name || '',
//             periodNumber: routine.periodNumber,
//             subject: routine.subject,
//             teacher: routine.teacher,
//             startTime: routine.startTime,
//             endTime: routine.endTime,
//             roomNumber: routine.roomNumber,
//             attendanceMarked: !!attendanceMarked,
//             totalStudents: cls.students?.length || 0,
//             attendanceRecord: attendanceMarked ? {
//               markedBy: attendanceMarked.recordedBy,
//               markedAt: attendanceMarked.createdAt,
//               statusCounts: {} // You could add status counts here
//             } : null
//           });
//         }
//       }

//       // Sort by start time
//       todaysSchedule.sort((a, b) => {
//         const timeA = a.startTime.split(':').map(Number);
//         const timeB = b.startTime.split(':').map(Number);
//         return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
//       });

//       // Calculate upcoming classes
//       const now = new Date();
//       const currentTime = now.getHours() * 60 + now.getMinutes();
      
//       const upcomingClasses = todaysSchedule.filter(cls => {
//         const endTime = cls.endTime.split(':').map(Number);
//         const endTimeMinutes = endTime[0] * 60 + endTime[1];
//         return endTimeMinutes > currentTime && !cls.attendanceMarked;
//       });

//       const completedClasses = todaysSchedule.filter(cls => {
//         const endTime = cls.endTime.split(':').map(Number);
//         const endTimeMinutes = endTime[0] * 60 + endTime[1];
//         return endTimeMinutes <= currentTime;
//       });

//       res.status(200).json({
//         success: true,
//         date: selectedDate,
//         day,
//         todaysSchedule,
//         statistics: {
//           totalClasses: todaysSchedule.length,
//           completedClasses: completedClasses.length,
//           upcomingClasses: upcomingClasses.length,
//           markedClasses: todaysSchedule.filter(c => c.attendanceMarked).length
//         },
//         upcomingClasses: upcomingClasses.slice(0, 3) // Next 3 upcoming classes
//       });

//     } catch (error) {
//       next(error);
//     }
//   }));

// // 🎯 GET ATTENDANCE OVERVIEW FOR DASHBOARD
// router.get("/overview", isAuthenticated,
//   authorizeRoles("admin", "teacher"),
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { date } = req.query;
//       const selectedDate = date ? new Date(date) : new Date();
      
//       const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
//       const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

//       // For teacher, filter by their classes
//       let classFilter = {};
//       if (req.user.role === 'teacher') {
//         const teacher = await Teacher.findOne({ user: req.user._id });
//         if (teacher && teacher.classes.length > 0) {
//           classFilter = { class: { $in: teacher.classes } };
//         }
//       }

//       const attendanceStats = await Attendance.aggregate([
//         {
//           $match: {
//             date: { $gte: startOfDay, $lt: endOfDay },
//             ...classFilter
//           }
//         },
//         {
//           $group: {
//             _id: '$status',
//             count: { $sum: 1 }
//           }
//         }
//       ]);

//       const present = attendanceStats.find(s => s._id === 'present')?.count || 0;
//       const total = attendanceStats.reduce((sum, s) => sum + s.count, 0);
//       const averageAttendance = total > 0 ? Math.round((present / total) * 100) : 0;

//       // Get today's schedule count
//       const day = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      
//       let classIds = [];
//       if (req.user.role === 'teacher') {
//         const teacher = await Teacher.findOne({ user: req.user._id });
//         classIds = teacher?.classes || [];
//       } else {
//         const allClasses = await Class.find({}, '_id');
//         classIds = allClasses.map(c => c._id);
//       }

//       const todaysRoutines = await Routine.countDocuments({
//         class: { $in: classIds },
//         day: day,
//         isActive: true
//       });

//       // Get marked attendance count
//       const markedAttendance = await Attendance.countDocuments({
//         date: { $gte: startOfDay, $lt: endOfDay },
//         ...classFilter
//       });

//       res.status(200).json({
//         success: true,
//         date: selectedDate,
//         overview: {
//           totalRecords: total,
//           present,
//           absent: attendanceStats.find(s => s._id === 'absent')?.count || 0,
//           late: attendanceStats.find(s => s._id === 'late')?.count || 0,
//           half_day: attendanceStats.find(s => s._id === 'half_day')?.count || 0,
//           excused: attendanceStats.find(s => s._id === 'excused')?.count || 0,
//           holiday: attendanceStats.find(s => s._id === 'holiday')?.count || 0,
//           averageAttendance,
//           scheduledClasses: todaysRoutines,
//           markedClasses: Math.min(markedAttendance > 0 ? 1 : 0, todaysRoutines), // Estimate
//           attendanceRate: averageAttendance
//         }
//       });

//     } catch (error) {
//       next(error);
//     }
//   }));

// // 🎯 MARK ATTENDANCE WITH ROUTINE VALIDATION (UPDATED VERSION)
// router.post("/mark-with-routine", isAuthenticated,
//   authorizeRoles("admin", "teacher"),
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { classId, date, attendanceRecords } = req.body;

//       if (!classId || !date || !attendanceRecords || !Array.isArray(attendanceRecords)) {
//         return next(new ErrorHandler("Class ID, date, and attendance records are required", 400));
//       }

//       const attendanceDate = new Date(date);
//       const day = attendanceDate.toLocaleDateString('en-US', { weekday: 'long' });
//       const today = new Date();

//       if (attendanceDate > today) {
//         return next(new ErrorHandler("Cannot mark attendance for future dates", 400));
//       }

//       // Verify teacher access
//       if (req.user.role === 'teacher') {
//         const teacher = await Teacher.findOne({ user: req.user._id });
//         if (!teacher.classes.includes(classId)) {
//           return next(new ErrorHandler("You are not assigned to this class", 403));
//         }
//       }

//       const operations = [];
//       const results = [];
//       const errors = [];

//       // Group records by period for validation
//       const periodGroups = {};
//       attendanceRecords.forEach(record => {
//         if (!periodGroups[record.period]) {
//           periodGroups[record.period] = [];
//         }
//         periodGroups[record.period].push(record);
//       });

//       for (const [period, records] of Object.entries(periodGroups)) {
//         const periodNum = parseInt(period);
        
//         // Check if period exists in routine for this day
//         const routine = await Routine.findOne({
//           class: classId,
//           day: day,
//           periodNumber: periodNum,
//           isActive: true
//         }).populate('subject', '_id name');

//         if (!routine) {
//           errors.push(`No class scheduled for period ${period} on ${day}`);
//           continue;
//         }

//         // For teacher, verify they teach this subject
//         if (req.user.role === 'teacher') {
//           const teacher = await Teacher.findOne({ user: req.user._id });
//           if (!teacher.subjects.includes(routine.subject._id)) {
//             errors.push(`You are not assigned to teach ${routine.subject.name}`);
//             continue;
//           }
//         }

//         for (const record of records) {
//           try {
//             const { studentId, status, remarks } = record;

//             if (!studentId || !status) {
//               errors.push(`Invalid record for student: ${studentId}`);
//               continue;
//             }

//             const filter = {
//               student: studentId,
//               subject: routine.subject._id,
//               date: attendanceDate,
//               period: periodNum
//             };

//             operations.push({
//               updateOne: {
//                 filter: filter,
//                 update: {
//                   $set: {
//                     ...filter,
//                     class: classId,
//                     subject: routine.subject._id,
//                     day: day,
//                     status: status,
//                     periodTimeRange: {
//                       start: routine.startTime,
//                       end: routine.endTime
//                     },
//                     recordedBy: req.user._id,
//                     remarks: remarks || "",
//                     teacher: routine.teacher
//                   }
//                 },
//                 upsert: true
//               }
//             });

//             results.push({ 
//               studentId, 
//               status,
//               period: periodNum,
//               subject: routine.subject.name
//             });

//           } catch (error) {
//             errors.push(`Failed to process student ${record.studentId}: ${error.message}`);
//           }
//         }
//       }

//       if (operations.length > 0) {
//         await Attendance.bulkWrite(operations, { ordered: false });
//       }

//       res.status(200).json({
//         success: true,
//         message: `Attendance marked for ${results.length} students across ${Object.keys(periodGroups).length} periods`,
//         date: attendanceDate,
//         day: day,
//         class: classId,
//         results,
//         errors: errors.length > 0 ? errors : undefined
//       });

//     } catch (error) {
//       next(error);
//     }
//   }));

// // 🎯 GET ATTENDANCE BY DATE AND PERIOD
// router.get("/date/:date/period/:period", isAuthenticated,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { date, period } = req.params;
//       const { classId, subjectId } = req.query;

//       const attendanceDate = new Date(date);
//       const periodNum = parseInt(period);

//       if (periodNum < 1 || periodNum > 12) {
//         return next(new ErrorHandler("Period must be between 1 and 12", 400));
//       }

//       let query = {
//         date: attendanceDate,
//         period: periodNum
//       };

//       if (classId) query.class = classId;
//       if (subjectId) query.subject = subjectId;

//       const attendance = await Attendance.find(query)
//         .populate('student', 'name rollNumber')
//         .populate('subject', 'name')
//         .populate('class', 'name')
//         .populate('recordedBy', 'name')
//         .populate('teacher', 'name')
//         .sort({ 'student.rollNumber': 1 });

//       // Get day from date
//       const day = attendanceDate.toLocaleDateString('en-US', { weekday: 'long' });

//       res.status(200).json({
//         success: true,
//         date: attendanceDate,
//         day,
//         period: periodNum,
//         attendance,
//         count: attendance.length,
//         statistics: {
//           present: attendance.filter(a => a.status === 'present').length,
//           absent: attendance.filter(a => a.status === 'absent').length,
//           late: attendance.filter(a => a.status === 'late').length,
//           half_day: attendance.filter(a => a.status === 'half_day').length
//         }
//       });

//     } catch (error) {
//       next(error);
//     }
//   }));

// // 🎯 BULK MARK ATTENDANCE FOR MULTIPLE PERIODS
// router.post("/bulk-mark", isAuthenticated,
//   authorizeRoles("admin", "teacher"),
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { classId, date, bulkRecords } = req.body;

//       if (!classId || !date || !bulkRecords || !Array.isArray(bulkRecords)) {
//         return next(new ErrorHandler("Class ID, date, and bulk records are required", 400));
//       }

//       const attendanceDate = new Date(date);
//       const day = attendanceDate.toLocaleDateString('en-US', { weekday: 'long' });

//       // Verify teacher access
//       if (req.user.role === 'teacher') {
//         const teacher = await Teacher.findOne({ user: req.user._id });
//         if (!teacher.classes.includes(classId)) {
//           return next(new ErrorHandler("You are not assigned to this class", 403));
//         }
//       }

//       const operations = [];
//       const results = [];
//       const errors = [];

//       for (const bulkRecord of bulkRecords) {
//         const { period, studentStatuses } = bulkRecord;

//         if (!period || !studentStatuses || !Array.isArray(studentStatuses)) {
//           errors.push(`Invalid bulk record for period ${period}`);
//           continue;
//         }

//         // Check if period exists in routine
//         const routine = await Routine.findOne({
//           class: classId,
//           day: day,
//           periodNumber: period,
//           isActive: true
//         }).populate('subject', '_id name');

//         if (!routine) {
//           errors.push(`No class scheduled for period ${period} on ${day}`);
//           continue;
//         }

//         for (const record of studentStatuses) {
//           try {
//             const { studentId, status, remarks } = record;

//             if (!studentId || !status) {
//               errors.push(`Invalid record for student: ${studentId} in period ${period}`);
//               continue;
//             }

//             const filter = {
//               student: studentId,
//               subject: routine.subject._id,
//               date: attendanceDate,
//               period: period
//             };

//             operations.push({
//               updateOne: {
//                 filter: filter,
//                 update: {
//                   $set: {
//                     ...filter,
//                     class: classId,
//                     subject: routine.subject._id,
//                     day: day,
//                     status: status,
//                     periodTimeRange: {
//                       start: routine.startTime,
//                       end: routine.endTime
//                     },
//                     recordedBy: req.user._id,
//                     remarks: remarks || "",
//                     teacher: routine.teacher
//                   }
//                 },
//                 upsert: true
//               }
//             });

//             results.push({
//               studentId,
//               period,
//               subject: routine.subject.name,
//               status
//             });

//           } catch (error) {
//             errors.push(`Failed to process student ${record.studentId} in period ${period}: ${error.message}`);
//           }
//         }
//       }

//       if (operations.length > 0) {
//         const bulkResult = await Attendance.bulkWrite(operations, { ordered: false });
        
//         res.status(200).json({
//           success: true,
//           message: `Bulk attendance marked successfully for ${results.length} records`,
//           date: attendanceDate,
//           day: day,
//           class: classId,
//           bulkWriteResult: {
//             insertedCount: bulkResult.upsertedCount || 0,
//             modifiedCount: bulkResult.modifiedCount || 0,
//             matchedCount: bulkResult.matchedCount || 0
//           },
//           results: results.slice(0, 100), // Return first 100 results
//           errors: errors.length > 0 ? errors.slice(0, 20) : undefined
//         });
//       } else {
//         res.status(400).json({
//           success: false,
//           message: "No valid records to process",
//           errors
//         });
//       }

//     } catch (error) {
//       next(error);
//     }
//   }));

// // ==================== YOUR EXISTING ENDPOINTS (KEEP AS IS) ====================

// // 🎯 MARK ATTENDANCE (SUBJECT-BASED) - KEEP THIS FOR BACKWARD COMPATIBILITY
// router.post("/mark", isAuthenticated,
//   authorizeRoles("admin", "teacher"),
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { classId, subjectId, date, period, attendanceRecords } = req.body;

//       if (!classId || !subjectId || !date || !period || !attendanceRecords || !Array.isArray(attendanceRecords)) {
//         return next(new ErrorHandler("Class ID, subject ID, date, period, and attendance records are required", 400));
//       }

//       if (period < 1 || period > 10) {
//         return next(new ErrorHandler("Period must be between 1 and 10", 400));
//       }
//       const teacher = await Teacher.findOne({ user: req.user._id });

//       if (req.user.role === 'teacher') {
//         if (!teacher.classes.includes(classId) || !teacher.subjects.includes(subjectId)) {
//           return next(new ErrorHandler("You are not assigned to this class or subject", 403));
//         }
//       }
//       const attendanceDate = new Date(date);
//       const today = new Date();

//       if (attendanceDate > today) {
//         return next(new ErrorHandler("Cannot mark attendance for future dates", 400));
//       }

//       const operations = [];
//       const results = [];
//       const errors = [];

//       for (const record of attendanceRecords) {
//         try {
//           const { studentId, status, remarks } = record;

//           if (!studentId || !status) {
//             errors.push(`Invalid record for student: ${studentId}`);
//             continue;
//           }

//           const filter = {
//             student: studentId,
//             subject: subjectId,
//             date: attendanceDate,
//             period: period
//           };

//           operations.push({
//             updateOne: {
//               filter: filter,
//               update: {
//                 $set: {
//                   ...filter,
//                   class: classId,
//                   status: status,
//                   recordedBy: req.user._id,
//                   remarks: remarks || ""
//                 }
//               },
//               upsert: true
//             }
//           });

//           results.push({ studentId, status });

//         } catch (error) {
//           errors.push(`Failed to process student ${record.studentId}: ${error.message}`);
//         }
//       }

//       if (operations.length > 0) {
//         await Attendance.bulkWrite(operations, { ordered: false });
//       }

//       res.status(200).json({
//         success: true,
//         message: `Attendance marked for ${results.length} students in period ${period}`,
//         subject: subjectId,
//         period: period,
//         date: attendanceDate,
//         results,
//         errors: errors.length > 0 ? errors : undefined
//       });

//     } catch (error) {
//       next(error);
//     }
//   }));

// // 🎯 GET ATTENDANCE BY CLASS, SUBJECT & DATE - UPDATED TO INCLUDE DAY
// router.get("/class/:classId/subject/:subjectId/date/:date", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { classId, subjectId, date } = req.params;
//     const { period } = req.query;

//     const attendanceDate = new Date(date);
//     const day = attendanceDate.toLocaleDateString('en-US', { weekday: 'long' });

//     let query = {
//       class: classId,
//       subject: subjectId,
//       date: attendanceDate
//     };

//     if (period) {
//       query.period = parseInt(period);
//     }

//     const attendance = await Attendance.find(query)
//       .populate('student', 'name rollNumber')
//       .populate('subject', 'name')
//       .populate('recordedBy', 'name')
//       .sort({ period: 1, 'student.name': 1 });

//     res.status(200).json({
//       success: true,
//       date: attendanceDate,
//       day: day,
//       class: classId,
//       subject: subjectId,
//       attendance,
//       count: attendance.length
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// // 🎯 GET STUDENT ATTENDANCE HISTORY - UPDATED TO INCLUDE DAY
// router.get("/student/:studentId", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { studentId } = req.params;
//     const { month, year, subjectId } = req.query;

//     let dateFilter = {};

//     if (month && year) {
//       const startDate = new Date(year, month - 1, 1);
//       const endDate = new Date(year, month, 0);
//       dateFilter = {
//         date: {
//           $gte: startDate,
//           $lte: endDate
//         }
//       };
//     }

//     let query = {
//       student: studentId,
//       ...dateFilter
//     };

//     if (subjectId) {
//       query.subject = subjectId;
//     }

//     const attendance = await Attendance.find(query)
//       .populate('class', 'name')
//       .populate('subject', 'name')
//       .populate('recordedBy', 'name')
//       .sort({ date: -1, period: 1 });

//     // Calculate statistics
//     const totalRecords = attendance.length;
//     const presentRecords = attendance.filter(a => a.status === 'present').length;
//     const absentRecords = attendance.filter(a => a.status === 'absent').length;
//     const lateRecords = attendance.filter(a => a.status === 'late').length;
//     const halfDayRecords = attendance.filter(a => a.status === 'half_day').length;
//     const excusedRecords = attendance.filter(a => a.status === 'excused').length;
//     const holidayRecords = attendance.filter(a => a.status === 'holiday').length;

//     const attendancePercentage = totalRecords > 0 ?
//       ((presentRecords + (lateRecords * 0.5) + (halfDayRecords * 0.5)) / totalRecords) * 100 : 0;

//     res.status(200).json({
//       success: true,
//       attendance,
//       statistics: {
//         totalRecords,
//         presentRecords,
//         absentRecords,
//         lateRecords,
//         halfDayRecords,
//         excusedRecords,
//         holidayRecords,
//         attendancePercentage: Math.round(attendancePercentage * 100) / 100
//       }
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// // 🎯 GET CLASS ATTENDANCE SUMMARY (SUBJECT-WISE) - UPDATED
// router.get(
//   "/class/:classId/summary",
//   isAuthenticated,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { classId } = req.params;
//       const { month, year, subjectId } = req.query;

//       if (!month || !year) {
//         return next(new ErrorHandler("Month and year are required", 400));
//       }

//       // Generate Month Range
//       const startDate = new Date(year, month - 1, 1);
//       const endDate = new Date(year, month, 0);

//       // Base Query
//       let query = {
//         class: classId,
//         date: { $gte: startDate, $lte: endDate },
//       };

//       // Subject logic
//       if (subjectId) {
//         query.subject = subjectId;
//       } else {
//         // Exclude invalid subject records
//         query.subject = { $ne: null };
//       }

//       // Fetch attendance
//       const attendance = await Attendance.find(query)
//         .populate("student", "name rollNumber gender")
//         .populate("subject", "name")
//         .sort({ date: 1, period: 1 });

//       // Group by student & subject
//       const studentSubjectMap = new Map();

//       for (const record of attendance) {
//         // Safety checks
//         if (!record.student || !record.subject) continue;

//         const studentId = record.student._id.toString();
//         const subjectId = record.subject._id.toString();
//         const key = `${studentId}-${subjectId}`;

//         // Initialize group
//         if (!studentSubjectMap.has(key)) {
//           studentSubjectMap.set(key, {
//             student: record.student,
//             subject: record.subject,
//             records: [],
//             present: 0,
//             absent: 0,
//             late: 0,
//             half_day: 0,
//             excused: 0,
//             holiday: 0
//           });
//         }

//         const group = studentSubjectMap.get(key);

//         group.records.push(record);
//         group[record.status]++;
//       }

//       // Convert grouped data into response format
//       const summary = [...studentSubjectMap.values()].map((item) => {
//         const total =
//           item.present + item.absent + item.late + item.half_day;

//         const weighted =
//           item.present + item.late * 0.5 + item.half_day * 0.5;

//         const percentage = total > 0 ? (weighted / total) * 100 : 0;

//         return {
//           ...item,
//           totalRecords: total,
//           attendancePercentage: Math.round(percentage * 100) / 100,
//         };
//       });

//       // Calculate overall stats
//       const totalRecords = summary.reduce(
//         (sum, entry) => sum + entry.totalRecords,
//         0
//       );

//       const averagePercentage =
//         summary.length > 0
//           ? Math.round(
//               (summary.reduce(
//                 (sum, entry) => sum + entry.attendancePercentage,
//                 0
//               ) /
//                 summary.length) *
//                 100
//             ) / 100
//           : 0;

//       const uniqueStudents = new Set(
//         attendance.map((a) => a.student?._id?.toString())
//       ).size;

//       const uniqueSubjects = new Set(
//         attendance.map((a) => a.subject?._id?.toString())
//       ).size;

//       res.status(200).json({
//         success: true,
//         period: {
//           month: parseInt(month),
//           year: parseInt(year),
//           startDate,
//           endDate,
//         },
//         summary,
//         statistics: {
//           totalStudents: uniqueStudents,
//           totalSubjects: uniqueSubjects,
//           totalRecords,
//           averagePercentage,
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   })
// );

// // 🎯 UPDATE SINGLE ATTENDANCE RECORD - UPDATED TO INCLUDE DAY
// router.put("/update/:id", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { status, remarks } = req.body;

//     const attendance = await Attendance.findById(req.params.id);
//     if (!attendance) {
//       return next(new ErrorHandler("Attendance record not found", 404));
//     }

//     // Add after finding attendance record
//     if (req.user.role === 'teacher') {
//       const teacher = await Teacher.findOne({ user: req.user._id });

//       if (!teacher.classes.includes(attendance.class.toString()) ||
//         !teacher.subjects.includes(attendance.subject.toString())) {
//         return next(new ErrorHandler("You are not assigned to this class or subject", 403));
//       }
//     }

//     attendance.status = status;
//     attendance.remarks = remarks || "";
//     attendance.recordedBy = req.user._id;
//     await attendance.save();

//     const updatedAttendance = await Attendance.findById(req.params.id)
//       .populate('student', 'name rollNumber')
//       .populate('subject', 'name')
//       .populate('recordedBy', 'name');

//     res.status(200).json({
//       success: true,
//       message: "Attendance updated successfully",
//       attendance: updatedAttendance
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// // 🎯 GET TODAY'S ATTENDANCE FOR A CLASS - UPDATED WITH ROUTINE CHECK
// router.get("/class/:classId/today", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const day = today.toLocaleDateString('en-US', { weekday: 'long' });

//     const { subjectId, period } = req.query;

//     let query = {
//       class: req.params.classId,
//       date: today
//     };

//     // Add after query construction
//     if (req.user.role === 'teacher') {
//       const teacher = await Teacher.findOne({ user: req.user._id });

//       if (!teacher.classes.includes(req.params.classId)) {
//         return next(new ErrorHandler("You are not assigned to this class", 403));
//       }

//       // Only show subjects assigned to this teacher
//       query.subject = { $in: teacher.subjects };
//     }

//     if (subjectId) query.subject = subjectId;
//     if (period) query.period = parseInt(period);

//     const attendance = await Attendance.find(query)
//       .populate('student', 'name rollNumber')
//       .populate('subject', 'name')
//       .populate('recordedBy', 'name')
//       .sort({ period: 1, 'student.name': 1 });

//     // Get today's routine for comparison
//     const todaysRoutine = await Routine.find({
//       class: req.params.classId,
//       day: day,
//       isActive: true
//     })
//       .populate('subject', 'name')
//       .sort('periodNumber');

//     // Create a map of scheduled vs marked periods
//     const scheduledPeriods = todaysRoutine.map(routine => ({
//       period: routine.periodNumber,
//       subject: routine.subject.name,
//       startTime: routine.startTime,
//       endTime: routine.endTime,
//       marked: attendance.some(a => a.period === routine.periodNumber && a.subject._id.toString() === routine.subject._id.toString())
//     }));

//     // Get unique subjects marked today
//     const subjectsMarked = [...new Set(attendance.map(a => a.subject?._id.toString()))];

//     res.status(200).json({
//       success: true,
//       date: today,
//       day: day,
//       attendance,
//       scheduledPeriods,
//       markedCount: attendance.length,
//       subjectsMarked,
//       scheduledCount: todaysRoutine.length,
//       isTodayMarked: attendance.length > 0,
//       completionRate: todaysRoutine.length > 0 ? 
//         Math.round((scheduledPeriods.filter(p => p.marked).length / todaysRoutine.length) * 100) : 0
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// // KEEP ALL OTHER EXISTING ENDPOINTS (teacher/my-subjects, my/attendance, etc.)
// // 🎯 GET TEACHER'S SUBJECTS ATTENDANCE
// router.get("/teacher/my-subjects", isAuthenticated, authorizeRoles("teacher"), catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { month, year } = req.query;
//     const teacherId = req.user._id;

//     // Get teacher's subjects and classes
//     const Teacher = require("../models/Teacher");
//     const teacher = await Teacher.findOne({ user: teacherId })
//       .populate('subjects', 'name')
//       .populate('classes', 'name');

//     if (!teacher) {
//       return next(new ErrorHandler("Teacher profile not found", 404));
//     }

//     let dateFilter = {};
//     if (month && year) {
//       const startDate = new Date(year, month - 1, 1);
//       const endDate = new Date(year, month, 0);
//       dateFilter = {
//         date: {
//           $gte: startDate,
//           $lte: endDate
//         }
//       };
//     }

//     // Get attendance for teacher's subjects and classes
//     const attendance = await Attendance.find({
//       subject: { $in: teacher.subjects },
//       class: { $in: teacher.classes },
//       ...dateFilter
//     })
//       .populate('student', 'name rollNumber')
//       .populate('subject', 'name')
//       .populate('class', 'name')
//       .sort({ date: -1, period: 1 });

//     res.status(200).json({
//       success: true,
//       teacher: {
//         name: req.user.name,
//         subjects: teacher.subjects,
//         classes: teacher.classes
//       },
//       attendance,
//       count: attendance.length
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// // 🎯 STUDENT: GET MY ATTENDANCE
// router.get("/my/attendance", isStudentAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { month, year, subjectId } = req.query;
//     const studentId = req.user._id;

//     let dateFilter = {};

//     if (month && year) {
//       const startDate = new Date(year, month - 1, 1);
//       const endDate = new Date(year, month, 0);
//       dateFilter = {
//         date: {
//           $gte: startDate,
//           $lte: endDate
//         }
//       };
//     }

//     let query = {
//       student: studentId,
//       ...dateFilter
//     };

//     if (subjectId) {
//       query.subject = subjectId;
//     }

//     const attendance = await Attendance.find(query)
//       .populate('class', 'name')
//       .populate('subject', 'name')
//       .populate('recordedBy', 'name')
//       .sort({ date: -1, period: 1 });

//     // Calculate statistics
//     const totalRecords = attendance.length;
//     const presentRecords = attendance.filter(a => a.status === 'present').length;
//     const absentRecords = attendance.filter(a => a.status === 'absent').length;
//     const lateRecords = attendance.filter(a => a.status === 'late').length;
//     const halfDayRecords = attendance.filter(a => a.status === 'half_day').length;

//     const attendancePercentage = totalRecords > 0 ?
//       ((presentRecords + (lateRecords * 0.5) + (halfDayRecords * 0.5)) / totalRecords) * 100 : 0;

//     res.status(200).json({
//       success: true,
//       attendance,
//       statistics: {
//         totalRecords,
//         presentRecords,
//         absentRecords,
//         lateRecords,
//         halfDayRecords,
//         attendancePercentage: Math.round(attendancePercentage * 100) / 100
//       }
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// // 🎯 PARENT: GET CHILDREN'S ATTENDANCE
// router.get("/my/children/attendance", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { month, year, childId, subjectId } = req.query;

//     const parent = await Parent.findOne({ user: req.user._id });
//     if (!parent) {
//       return next(new ErrorHandler("Parent profile not found", 404));
//     }

//     // Verify the child belongs to this parent
//     if (childId && !parent.children.includes(childId)) {
//       return next(new ErrorHandler("Access denied to this child's data", 403));
//     }

//     const childrenIds = childId ? [childId] : parent.children;

//     let dateFilter = {};
//     if (month && year) {
//       const startDate = new Date(year, month - 1, 1);
//       const endDate = new Date(year, month, 0);
//       dateFilter = {
//         date: {
//           $gte: startDate,
//           $lte: endDate
//         }
//       };
//     }

//     let query = {
//       student: { $in: childrenIds },
//       ...dateFilter
//     };

//     if (subjectId) {
//       query.subject = subjectId;
//     }

//     const attendance = await Attendance.find(query)
//       .populate('student', 'name rollNumber class')
//       .populate('class', 'name')
//       .populate('subject', 'name')
//       .sort({ date: -1, period: 1 });

//     // Calculate statistics per child
//     const childStats = {};
//     childrenIds.forEach(childId => {
//       const childAttendance = attendance.filter(a => a.student._id.toString() === childId.toString());
//       const totalRecords = childAttendance.length;
//       const presentRecords = childAttendance.filter(a => a.status === 'present').length;
//       const lateRecords = childAttendance.filter(a => a.status === 'late').length;
//       const halfDayRecords = childAttendance.filter(a => a.status === 'half_day').length;

//       const attendancePercentage = totalRecords > 0 ?
//         ((presentRecords + (lateRecords * 0.5) + (halfDayRecords * 0.5)) / totalRecords) * 100 : 0;

//       childStats[childId] = {
//         totalRecords,
//         presentRecords,
//         lateRecords,
//         halfDayRecords,
//         attendancePercentage: Math.round(attendancePercentage * 100) / 100
//       };
//     });

//     res.status(200).json({
//       success: true,
//       attendance,
//       statistics: childStats
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// // 🎯 GET ATTENDANCE ANALYTICS
// router.get("/analytics/class/:classId", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { classId } = req.params;
//     const { month, year } = req.query;

//     if (!month || !year) {
//       return next(new ErrorHandler("Month and year are required", 400));
//     }

//     const startDate = new Date(year, month - 1, 1);
//     const endDate = new Date(year, month, 0);

//     const attendance = await Attendance.find({
//       class: classId,
//       date: {
//         $gte: startDate,
//         $lte: endDate
//       }
//     })
//       .populate('student', 'name rollNumber')
//       .populate('subject', 'name');

//     // Daily attendance trends
//     const dailyTrends = {};
//     attendance.forEach(record => {
//       const dateStr = record.date.toISOString().split('T')[0];
//       if (!dailyTrends[dateStr]) {
//         dailyTrends[dateStr] = { present: 0, absent: 0, late: 0, half_day: 0, total: 0 };
//       }
//       dailyTrends[dateStr][record.status]++;
//       dailyTrends[dateStr].total++;
//     });

//     // Subject-wise analysis
//     const subjectAnalysis = {};
//     attendance.forEach(record => {
//       const subjectName = record.subject.name;
//       if (!subjectAnalysis[subjectName]) {
//         subjectAnalysis[subjectName] = { present: 0, absent: 0, late: 0, half_day: 0, total: 0 };
//       }
//       subjectAnalysis[subjectName][record.status]++;
//       subjectAnalysis[subjectName].total++;
//     });

//     res.status(200).json({
//       success: true,
//       period: { month: parseInt(month), year: parseInt(year) },
//       analytics: {
//         dailyTrends,
//         subjectAnalysis,
//         totalRecords: attendance.length,
//         uniqueStudents: new Set(attendance.map(a => a.student._id.toString())).size,
//         uniqueSubjects: new Set(attendance.map(a => a.subject._id.toString())).size
//       }
//     });

//   } catch (error) {
//     next(error);
//   }
// }));

// module.exports = router;