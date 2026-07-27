// routes/sectionRoutes.js
const express = require("express");
const router = express.Router();
const Section = require("../models/Section");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// Create section
router.post("/create", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
    const { name, capacity } = req.body;

    const existingSection = await Section.findOne({ name });
    if (existingSection) {
        return next(new ErrorHandler('Section with this name already exists', 400));
    }

    const section = await Section.create({ name, capacity });

    res.status(201).json({ success: true, section });
}));

// Get all sections
router.get("/all", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
    const sections = await Section.find().sort({ name: 1 });
    res.status(200).json({ success: true, sections });
}));

// Get active sections
router.get("/active", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
    const sections = await Section.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, sections });
}));

// Get single section
router.get("/:id", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
    const section = await Section.findById(req.params.id);
    if (!section) return next(new ErrorHandler('Section not found', 404));
    res.status(200).json({ success: true, section });
}));

// Update section
router.put("/:id", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
    const { name, capacity, isActive } = req.body;

    let section = await Section.findById(req.params.id);
    if (!section) return next(new ErrorHandler('Section not found', 404));

    if (name && name !== section.name) {
        const existingSection = await Section.findOne({ name });
        if (existingSection) return next(new ErrorHandler('Section with this name already exists', 400));
    }

    section = await Section.findByIdAndUpdate(req.params.id, { name, capacity, isActive }, { new: true });
    res.status(200).json({ success: true, section });
}));

// Delete section
router.delete("/:id", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
    const section = await Section.findById(req.params.id);
    if (!section) return next(new ErrorHandler('Section not found', 404));

    if (section.currentStrength > 0) {
        return next(new ErrorHandler('Cannot delete section with assigned students', 400));
    }

    await section.deleteOne();
    res.status(200).json({ success: true, message: 'Section deleted successfully' });
}));

module.exports = router;