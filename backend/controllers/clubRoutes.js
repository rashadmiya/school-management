// routes/clubRoutes.js
const express = require("express");
const router = express.Router();
const Club = require("../models/Club");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// 🎯 Create new club
router.post("/",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        clubName,
        supervisor,
        session,
        description,
        members = [],
        meetingSchedule,
        isActive = true
      } = req.body;

      if (!clubName || !supervisor || !session) {
        return next(new ErrorHandler("Club name, supervisor, and session are required", 400));
      }
      // Check if club name already exists for this session
      const existingClub = await Club.findOne({
        clubName: { $regex: new RegExp(`^${clubName}$`, 'i') },
        session
      });

      if (existingClub) {
        return next(new ErrorHandler("Club with this name already exists for this session", 400));
      }

      // Validate supervisor
      const supervisorExists = await Teacher.findById(supervisor);
      if (!supervisorExists) {
        return next(new ErrorHandler("Supervisor not found", 404));
      }

      // Validate members if provided
      if (members.length > 0) {
        const studentIds = members.map(m => m.student);
        const validStudents = await Student.countDocuments({ _id: { $in: studentIds } });
        if (validStudents !== studentIds.length) {
          return next(new ErrorHandler("One or more student IDs are invalid", 400));
        }
      }

      const club = await Club.create({
        clubName,
        supervisor,
        session,
        description,
        members: members.map(member => ({
          student: member.student,
          role: member.role || 'member',
          joinedDate: member.joinedDate || Date.now()
        })),
        meetingSchedule,
        isActive
      });

      // Populate references
      const populatedClub = await Club.findById(club._id)
        .populate("supervisor", "user designation")
        .populate({
          path: "supervisor",
          populate: { path: "user", select: "name email" }
        })
        .populate("members.student", "name rollNumber class");

      res.status(201).json({
        success: true,
        message: "Club created successfully",
        club: populatedClub
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get all clubs
router.get("/",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        search = "",
        session = "",
        supervisor = "",
        isActive,
        page = 1,
        limit = 20
      } = req.query;

      const skip = (page - 1) * limit;

      let filter = {};

      if (search) {
        filter.$or = [
          { clubName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      if (session) filter.session = session;
      if (supervisor) filter.supervisor = supervisor;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const [clubs, total] = await Promise.all([
        Club.find(filter)
          .populate("supervisor", "user")
          .populate({
            path: "supervisor",
            populate: { path: "user", select: "name" }
          })
          .populate("members.student", "name rollNumber")
          .sort({ clubName: 1 })
          .skip(skip)
          .limit(parseInt(limit)),

        Club.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        clubs,
        count: clubs.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get club by ID
// router.get("/:id",
//   isAuthenticated,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const club = await Club.findById(req.params.id)
//         .populate("supervisor", "user designation")
//         .populate({
//           path: "supervisor",
//           populate: { path: "user", select: "name email phoneNumber" }
//         })
//         .populate("members.student", "name rollNumber class")
//         .populate({
//           path: "members.student",
//           populate: { path: "class", select: "name" }
//         });

//       if (!club) {
//         return next(new ErrorHandler("Club not found", 404));
//       }

//       res.status(200).json({
//         success: true,
//         club
//       });

//     } catch (error) {
//       next(error);
//     }
//   })
// );

router.get("/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const club = await Club.findById(req.params.id)
        .populate('supervisor', 'name email phone photo designation')
        .populate('members.student', 'name rollNumber classSection photo')
        .lean();

      if (!club) {
        return next(new ErrorHandler("Club not found", 404));
      }

      res.status(200).json({
        success: true,
        club
      });

    } catch (error) {
      if (error.name === 'CastError') {
        return next(new ErrorHandler("Invalid club ID", 400));
      }
      next(error);
    }
  })
);

// 🎯 Update club
router.put("/:id",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const club = await Club.findById(req.params.id);

      if (!club) {
        return next(new ErrorHandler("Club not found", 404));
      }

      // Check if club name is being changed
      if (req.body.clubName && req.body.clubName !== club.clubName) {
        const existingClub = await Club.findOne({
          clubName: { $regex: new RegExp(`^${req.body.clubName}$`, 'i') },
          session: req.body.session || club.session,
          _id: { $ne: club._id }
        });

        if (existingClub) {
          return next(new ErrorHandler("Club with this name already exists for this session", 400));
        }
      }

      const updatedClub = await Club.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate("supervisor", "user")
        .populate({
          path: "supervisor",
          populate: { path: "user", select: "name" }
        })
        .populate("members.student", "name rollNumber");

      res.status(200).json({
        success: true,
        message: "Club updated successfully",
        club: updatedClub
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Delete club
router.delete("/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const club = await Club.findById(req.params.id);

      if (!club) {
        return next(new ErrorHandler("Club not found", 404));
      }

      await Club.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Club deleted successfully"
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Add member to club
router.post("/:id/members",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { student, role = 'member' } = req.body;

      if (!student) {
        return next(new ErrorHandler("Student ID is required", 400));
      }

      const club = await Club.findById(req.params.id);
      if (!club) {
        return next(new ErrorHandler("Club not found", 404));
      }

      // Check if student exists
      const studentExists = await Student.findById(student);
      if (!studentExists) {
        return next(new ErrorHandler("Student not found", 404));
      }

      // Check if student is already a member
      const existingMember = club.members.find(m => m.student.toString() === student);
      if (existingMember) {
        return next(new ErrorHandler("Student is already a member of this club", 400));
      }

      // Check role uniqueness for president/vice president
      if (role === 'president' || role === 'vice_president') {
        const existingRole = club.members.find(m => m.role === role);
        if (existingRole) {
          return next(new ErrorHandler(
            `${role} role is already assigned in this club`,
            400
          ));
        }
      }

      club.members.push({
        student,
        role,
        joinedDate: Date.now()
      });

      await club.save();

      const populatedClub = await Club.findById(club._id)
        .populate("members.student", "name rollNumber class");

      res.status(200).json({
        success: true,
        message: "Member added to club successfully",
        club: populatedClub
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Remove member from club
router.delete("/:id/members/:memberId",
  isAuthenticated,
  authorizeRoles("admin", "teacher"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const club = await Club.findById(req.params.id);
      if (!club) {
        return next(new ErrorHandler("Club not found", 404));
      }

      const memberIndex = club.members.findIndex(
        m => m._id.toString() === req.params.memberId
      );

      if (memberIndex === -1) {
        return next(new ErrorHandler("Member not found in this club", 404));
      }

      club.members.splice(memberIndex, 1);
      await club.save();

      res.status(200).json({
        success: true,
        message: "Member removed from club successfully",
        club
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Public route: Get active clubs
router.get("/public/active",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { session = "" } = req.query;

      let filter = { isActive: true };
      if (session) filter.session = session;

      const clubs = await Club.find(filter)
        .populate("supervisor", "user")
        .populate({
          path: "supervisor",
          populate: { path: "user", select: "name" }
        })
        .populate("members.student", "name rollNumber")
        .select("clubName supervisor session description meetingSchedule members")
        .sort({ clubName: 1 });

      res.status(200).json({
        success: true,
        clubs,
        count: clubs.length
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Public route: Get club by ID
router.get("/public/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const club = await Club.findById(req.params.id)
        .populate("supervisor", "user designation")
        .populate({
          path: "supervisor",
          populate: { path: "user", select: "name email" }
        })
        .populate("members.student", "name rollNumber class")
        .select("clubName supervisor session description meetingSchedule members");

      if (!club || !club.isActive) {
        return next(new ErrorHandler("Club not found", 404));
      }

      res.status(200).json({
        success: true,
        club
      });

    } catch (error) {
      next(error);
    }
  })
);

module.exports = router;