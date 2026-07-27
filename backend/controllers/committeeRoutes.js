// routes/committeeRoutes.js
const express = require("express");
const router = express.Router();
const SchoolManagementCommittee = require("../models/SchoolManagementCommittee");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// 🎯 Create committee member
router.post("/",
  isAuthenticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        name,
        designation,
        quote,
        session,
        phoneNumber,
        address,
        religion,
        photo,
        order = 0,
        isActive = true
      } = req.body;

      if (!name || !designation || !session) {
        return next(new ErrorHandler("Name, designation, and session are required", 400));
      }

      const committee = await SchoolManagementCommittee.create({
        name,
        designation,
        quote,
        session,
        phoneNumber,
        address,
        religion,
        photo,
        order,
        isActive
      });

      res.status(201).json({
        success: true,
        message: "Committee member added successfully",
        committee
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Update committee member
router.put("/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const committee = await SchoolManagementCommittee.findById(req.params.id);

      if (!committee) {
        return next(new ErrorHandler("Committee member not found", 404));
      }

      const updatedCommittee = await SchoolManagementCommittee.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: "Committee member updated successfully",
        committee: updatedCommittee
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get committee members with quotes (for homepage display)
router.get("/with-quotes",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const membersWithQuotes = await SchoolManagementCommittee.find({
        designation: { $in: ['chairman', 'secretary', 'principal'] },
        isActive: true,
        quote: { $exists: true, $ne: '' } // Only members with quotes
      })
        .sort({ order: 1, createdAt: -1 })
        .limit(3)
        .select('name designation quote photo order')
        .lean();

      res.status(200).json({
        success: true,
        count: membersWithQuotes.length,
        members: membersWithQuotes
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Get single committee member by ID
router.get("/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const committee = await SchoolManagementCommittee.findById(req.params.id);

      if (!committee) {
        return next(new ErrorHandler("Committee member not found", 404));
      }

      res.status(200).json({
        success: true,
        committee
      });

    } catch (error) {
      next(error);
    }
  })
);
// 🎯 Get all committee members
router.get("/",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        session = "",
        designation = "",
        isActive,
        page = 1,
        limit = 20
      } = req.query;

      const skip = (page - 1) * limit;

      let filter = {};

      if (session) filter.session = session;
      if (designation) filter.designation = designation;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const [committee, total] = await Promise.all([
        SchoolManagementCommittee.find(filter)
          .sort({ order: 1, designation: 1 })
          .skip(skip)
          .limit(parseInt(limit)),

        SchoolManagementCommittee.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        committee,
        count: committee.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      });

    } catch (error) {
      next(error);
    }
  })
);


// 🎯 Delete committee member
router.delete("/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const committee = await SchoolManagementCommittee.findById(req.params.id);

      if (!committee) {
        return next(new ErrorHandler("Committee member not found", 404));
      }

      await SchoolManagementCommittee.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Committee member deleted successfully"
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Update committee order
router.put("/order/update",
  isAuthenticated,
  authorizeRoles("admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderUpdates } = req.body;

      if (!Array.isArray(orderUpdates)) {
        return next(new ErrorHandler("Invalid order updates", 400));
      }

      const bulkOps = orderUpdates.map(update => ({
        updateOne: {
          filter: { _id: update.id },
          update: { $set: { order: update.order } }
        }
      }));

      await SchoolManagementCommittee.bulkWrite(bulkOps);

      res.status(200).json({
        success: true,
        message: "Committee order updated successfully"
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Public route: Get active committee members
router.get("/public/active",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { session = "" } = req.query;

      let filter = { isActive: true };
      if (session) filter.session = session;

      const committee = await SchoolManagementCommittee.find(filter)
        .select("name designation session phoneNumber photo order")
        .sort({ order: 1, designation: 1 });

      res.status(200).json({
        success: true,
        committee,
        count: committee.length
      });

    } catch (error) {
      next(error);
    }
  })
);

// 🎯 Public route: Get committee by ID
router.get("/public/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const committee = await SchoolManagementCommittee.findById(req.params.id)
        .select("name designation session phoneNumber address religion photo order");

      if (!committee || !committee.isActive) {
        return next(new ErrorHandler("Committee member not found", 404));
      }

      res.status(200).json({
        success: true,
        committee
      });

    } catch (error) {
      next(error);
    }
  })
);

module.exports = router;