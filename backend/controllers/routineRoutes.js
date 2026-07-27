
// routes/routineRoutes.js
const express = require("express");
const router = express.Router();
const Routine = require("../models/Routine");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Class = require("../models/Class");


// 🎯 Get today's routine for a class
// 🎯 Get today's routine for a class - UPDATED
router.get("/class/:classId/today", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];

    // Get class details
    const classData = await Class.findById(req.params.classId)
      .populate('section', 'name');

    if (!classData) {
      return next(new ErrorHandler("Class not found", 404));
    }

    const routines = await Routine.find({
      class: req.params.classId,
      // section: classData.section._id,
      day: today
    })
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ periodNumber: 1 });

    res.status(200).json({
      success: true,
      day: today,
      class: classData,
      routines
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get today's routine for a class
router.get("/today-schedules", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];

    const teacher = req.user._id;
    const routines = await Routine.find({
      teacher,
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

// 🎯 Get routine slots for a class (for clickable grid)
// Updated slots route to support dynamic periods
router.get("/class/:classId/slots", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { day } = req.query;

    const classData = await Class.findById(req.params.classId).populate('section', 'name');

    if (!classData) {
      return next(new ErrorHandler("Class not found", 404));
    }

    // Get existing routines for the day
    const existingRoutines = await Routine.find({
      class: req.params.classId,
      day: day
    })
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ periodNumber: 1 });

    // Generate slots based on existing routines
    const slots = existingRoutines.map(routine => ({
      periodNumber: routine.periodNumber,
      isOccupied: true,
      routine,
      startTime: routine.startTime,
      endTime: routine.endTime
    }));

    res.status(200).json({
      success: true,
      day,
      class: classData,
      slots,
      totalPeriods: existingRoutines.length
    });

  } catch (error) {
    next(error);
  }
}));
// router.get("/class/:classId/slots", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { day } = req.query;

//     // Get class details including section
//     const classData = await Class.findById(req.params.classId)
//       .populate('section', 'name');

//     if (!classData) {
//       return next(new ErrorHandler("Class not found", 404));
//     }

//     // Get existing routines for the day
//     const existingRoutines = await Routine.find({
//       class: req.params.classId,
//       // section: classData.section._id,
//       day: day
//     })
//       .populate('subject', 'name code')
//       .populate('teacher', 'user')
//       .populate({
//         path: 'teacher',
//         populate: { path: 'user', select: 'name' }
//       })
//       .sort({ periodNumber: 1 });

//     // Calculate next available period number
//     const maxPeriods = 10;
//     const occupiedPeriods = existingRoutines.map(r => r.periodNumber);
//     let nextPeriodNumber = 1;

//     // Find the first available period number
//     while (occupiedPeriods.includes(nextPeriodNumber) && nextPeriodNumber <= maxPeriods) {
//       nextPeriodNumber++;
//     }

//     // Generate slots
//     const slots = [];
//     for (let i = 1; i <= maxPeriods; i++) {
//       const existingRoutine = existingRoutines.find(r => r.periodNumber === i);
//       slots.push({
//         periodNumber: i,
//         isOccupied: !!existingRoutine,
//         routine: existingRoutine || null,
//         startTime: existingRoutine ? existingRoutine.startTime : null,
//         endTime: existingRoutine ? existingRoutine.endTime : null
//       });
//     }

//     res.status(200).json({
//       success: true,
//       day,
//       class: classData,
//       nextPeriodNumber: nextPeriodNumber > maxPeriods ? null : nextPeriodNumber,
//       slots
//     });

//   } catch (error) {
//     next(error);
//   }
// }));


// 🎯 Create routine (click-to-add style) - UPDATED
router.post("/", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const {
      class: classId,
      subject,
      teacher,
      day,
      periodNumber,
      startTime,
      endTime,
      roomNumber
    } = req.body;

    // Validation
    if (!classId || !subject || !teacher || !day || !periodNumber || !startTime || !endTime) {
      return next(new ErrorHandler("All required fields must be filled", 400));
    }

    // Get class to get its section
    const classData = await Class.findById(classId).populate('section');
    if (!classData) {
      return next(new ErrorHandler("Class not found", 404));
    }

    // console.log("class data :", classData)
    // Check if period number already taken for this class+day
    const existingPeriod = await Routine.findOne({
      class: classId,
      // section: classData.section._id,
      day,
      periodNumber
    });

    if (existingPeriod) {
      return next(new ErrorHandler(`Period ${periodNumber} is already occupied for this class`, 400));
    }

    // Check for teacher time conflicts
    const teacherConflict = await Routine.findOne({
      teacher,
      day,
      $or: [
        {
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gt: startTime } }
          ]
        }
      ]
    });

    if (teacherConflict) {
      return next(new ErrorHandler("Teacher has another class during this time", 400));
    }

    // Create routine with section from class
    const routine = await Routine.create({
      class: classId,
      // section: classData.section._id,
      subject,
      teacher,
      day,
      periodNumber,
      startTime,
      endTime,
      roomNumber,
      createdBy: req.user._id
    });

    const populatedRoutine = await Routine.findById(routine._id)
      .populate({
        path: 'class',           // 1. Populate the 'class' field (references Class model)
        select: 'name section',  // 2. Select the class's name AND the section ID
        populate: {
          path: 'section',     // 3. Populate the 'section' field within the Class document
          select: 'name'       // 4. Select the desired field(s) from the Section model (e.g., just the name)
        }
      })
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' }
      });

    res.status(201).json({
      success: true,
      message: "Routine created successfully",
      routine: populatedRoutine
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get all routines with filtering
router.get("/", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { class: classId, teacher: teacherId, day } = req.query;

    let filter = {};
    if (classId) filter.class = classId;
    if (teacherId) filter.teacher = teacherId;
    if (day) filter.day = day;

    const routines = await Routine.find(filter)
      .populate('class', 'name')
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ day: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      routines,
      count: routines.length
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Get routine by ID
router.get("/:id", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const routine = await Routine.findById(req.params.id)
      .populate('class', 'name')
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name email' }
      });

    if (!routine) {
      return next(new ErrorHandler("Routine not found", 404));
    }

    res.status(200).json({
      success: true,
      routine
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Update routine
router.put("/:id", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const { class: classId, subject, teacher, day, startTime, endTime, roomNumber } = req.body;

    const routine = await Routine.findById(req.params.id);
    if (!routine) {
      return next(new ErrorHandler("Routine not found", 404));
    }

    // Check conflicts (excluding current routine)
    const conflictingRoutine = await Routine.findOne({
      _id: { $ne: req.params.id },
      teacher,
      day,
      $or: [
        {
          $and: [
            { startTime: { $lte: startTime } },
            { endTime: { $gt: startTime } }
          ]
        },
        {
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gte: endTime } }
          ]
        }
      ]
    });

    if (conflictingRoutine) {
      return next(new ErrorHandler("Teacher has conflicting schedule at this time", 400));
    }

    const updatedRoutine = await Routine.findByIdAndUpdate(
      req.params.id,
      {
        class: classId,
        subject,
        teacher,
        day,
        startTime,
        endTime,
        roomNumber
      },
      { new: true, runValidators: true }
    )
      .populate('class', 'name')
      .populate('subject', 'name code')
      .populate('teacher', 'user')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' }
      });

    res.status(200).json({
      success: true,
      message: "Routine updated successfully",
      routine: updatedRoutine
    });

  } catch (error) {
    next(error);
  }
}));

// 🎯 Delete routine
router.delete("/:id", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
  try {
    const routine = await Routine.findById(req.params.id);

    if (!routine) {
      return next(new ErrorHandler("Routine not found", 404));
    }

    await Routine.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Routine deleted successfully"
    });

  } catch (error) {
    next(error);
  }
}));

module.exports = router;