// routes/stuffRoutes.js
const express = require("express");
const router = express.Router();
const Stuff = require("../models/Stuff");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// 🎯 Create new staff member
router.post("/",
  isAuthenticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        name,
        designation,
        session,
        dateOfBirth,
        nationalIdNo,
        lastQualification,
        phoneNumber,
        address,
        religion,
        photo,
        joiningDate,
        isActive = true
      } = req.body;

      if (!name || !designation || !session || !phoneNumber) {
        return next(new ErrorHandler("Name, designation, session, and phone number are required", 400));
      }

      // Check if national ID already exists
      if (nationalIdNo) {
        const existingId = await Stuff.findOne({ nationalIdNo });
        if (existingId) {
          return next(new ErrorHandler("National ID already exists", 400));
        }
      }

      const staff = await Stuff.create({
        name,
        designation,
        session,
        dateOfBirth,
        nationalIdNo,
        lastQualification,
        phoneNumber,
        address,
        religion,
        photo,
        joiningDate: joiningDate || Date.now(),
        isActive
      });

      res.status(201).json({
        success: true,
        message: "Staff member created successfully",
        staff
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get all staff with filtering
router.get("/",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        search = "",
        session = "",
        designation = "",
        isActive,
        page = 1,
        limit = 20
      } = req.query;

      const skip = (page - 1) * limit;

      // Build filter
      let filter = {};

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { nationalIdNo: { $regex: search, $options: 'i' } }
        ];
      }

      if (session) filter.session = session;
      if (designation) filter.designation = designation;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const [staff, total] = await Promise.all([
        Stuff.find(filter)
          .sort({ name: 1 })
          .skip(skip)
          .limit(parseInt(limit)),
        
        Stuff.countDocuments(filter)
      ]);

      // Get statistics
      const totalStaff = await Stuff.countDocuments();
      const activeStaff = await Stuff.countDocuments({ isActive: true });
      const staffByDesignation = await Stuff.aggregate([
        { $group: { _id: "$designation", count: { $sum: 1 } } }
      ]);

      res.status(200).json({
        success: true,
        staff,
        count: staff.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        statistics: {
          totalStaff,
          activeStaff,
          inactiveStaff: totalStaff - activeStaff,
          staffByDesignation
        }
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get staff by ID
router.get("/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const staff = await Stuff.findById(req.params.id);

      if (!staff) {
        return next(new ErrorHandler("Staff member not found", 404));
      }

      res.status(200).json({
        success: true,
        staff
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Update staff member
router.put("/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const staff = await Stuff.findById(req.params.id);

      if (!staff) {
        return next(new ErrorHandler("Staff member not found", 404));
      }

      // Check if national ID is being changed and if it already exists
      if (req.body.nationalIdNo && req.body.nationalIdNo !== staff.nationalIdNo) {
        const existingId = await Stuff.findOne({ nationalIdNo: req.body.nationalIdNo });
        if (existingId) {
          return next(new ErrorHandler("National ID already exists", 400));
        }
      }

      const updatedStaff = await Stuff.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: "Staff member updated successfully",
        staff: updatedStaff
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Delete staff member
router.delete("/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const staff = await Stuff.findById(req.params.id);

      if (!staff) {
        return next(new ErrorHandler("Staff member not found", 404));
      }

      await Stuff.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Staff member deleted successfully"
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get staff statistics
router.get("/stats/count",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const totalStaff = await Stuff.countDocuments();
      const activeStaff = await Stuff.countDocuments({ isActive: true });
      const staffBySession = await Stuff.aggregate([
        { $group: { _id: "$session", count: { $sum: 1 } } },
        { $sort: { _id: -1 } }
      ]);
      const staffByDesignation = await Stuff.aggregate([
        { $group: { _id: "$designation", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      res.status(200).json({
        success: true,
        statistics: {
          totalStaff,
          activeStaff,
          inactiveStaff: totalStaff - activeStaff,
          staffBySession,
          staffByDesignation
        }
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Public route: Get active staff
router.get("/public/active",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { session = "", designation = "" } = req.query;

      let filter = { isActive: true };

      if (session) filter.session = session;
      if (designation) filter.designation = designation;

      const staff = await Stuff.find(filter)
        .select("name designation session phoneNumber photo lastQualification joiningDate")
        .sort({ designation: 1, name: 1 });

      res.status(200).json({
        success: true,
        staff,
        count: staff.length
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Public route: Get staff by ID
router.get("/public/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const staff = await Stuff.findById(req.params.id)
        .select("name designation session dateOfBirth nationalIdNo lastQualification phoneNumber address religion photo joiningDate");

      if (!staff || !staff.isActive) {
        return next(new ErrorHandler("Staff member not found", 404));
      }

      res.status(200).json({
        success: true,
        staff
      });

    } catch (error) {
      next(error);
    }
  })
);

module.exports = router;