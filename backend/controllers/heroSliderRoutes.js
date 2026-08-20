// routes/heroSliderRoutes.js
const express = require("express");
const HeroSlider = require("../models/HeroSlider");
const ErrorHandler = require("../utils/ErrorHandler");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const { uploadSingleImage, uploadHeroImage } = require("../multer");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// Public routes
router.get("/public", catchAsyncErrors(async (req, res, next) => {
    try {
        const sliders = await HeroSlider.find({ isActive: true })
            .sort({ order: 1, createdAt: -1 })
            .select('title subtitle imageUrl link linkText');

        res.status(200).json({
            success: true,
            data: sliders
        });

    } catch (error) {
        next(error);
    }
}));

// Admin routes
router.post(
    "/upload",
    isAuthenticated,
    authorizeRoles("admin"),
    uploadHeroImage,
    catchAsyncErrors(async (req, res, next) => {
        try {
            if (!req.file) {
                return next(new ErrorHandler("Please upload an image", 400));
            }

            console.log("upload hero called :", req.body)
            const { title, subtitle, link, linkText, order } = req.body;

            const imageUrl = `/uploads/hero/${req.file.filename}`;

            const slider = await HeroSlider.create({
                title: title || "",
                subtitle: subtitle || "",
                imageUrl,
                imageKey: req.file.filename,
                order: order || 0,
                isActive: true,
                link: link || "",
                linkText: linkText || "",
                uploadedBy: req.user._id
            });

            res.status(201).json({
                success: true,
                message: "Hero slider image uploaded successfully",
                data: slider
            });

        } catch (error) {
            // Clean up uploaded file if error occurs
            if (req.file) {
                fs.unlink(req.file.path, (err) => err && console.log(err));
            }
            next(error);
        }
    })
);

router.get(
    "/",
    isAuthenticated,
    authorizeRoles("admin"),
    catchAsyncErrors(async (req, res, next) => {
        try {
            const sliders = await HeroSlider.find()
                .sort({ order: 1, createdAt: -1 })
                .populate('uploadedBy', 'name email');

            res.status(200).json({
                success: true,
                data: sliders
            });

        } catch (error) {
            next(error);
        }
    })
);

router.get(
    "/:id",
    isAuthenticated,
    authorizeRoles("admin"),
    catchAsyncErrors(async (req, res, next) => {
        try {
            const slider = await HeroSlider.findById(req.params.id)
                .populate('uploadedBy', 'name email');

            if (!slider) {
                return next(new ErrorHandler("Hero slider not found", 404));
            }

            res.status(200).json({
                success: true,
                data: slider
            });

        } catch (error) {
            next(error);
        }
    })
);

router.put(
    "/:id",
    isAuthenticated,
    authorizeRoles("admin"),
    catchAsyncErrors(async (req, res, next) => {
        try {
            const { title, subtitle, link, linkText, order, isActive } = req.body;

            const slider = await HeroSlider.findById(req.params.id);

            if (!slider) {
                return next(new ErrorHandler("Hero slider not found", 404));
            }

            const updatedSlider = await HeroSlider.findByIdAndUpdate(
                req.params.id,
                {
                    title: title || slider.title,
                    subtitle: subtitle || slider.subtitle,
                    link: link || slider.link,
                    linkText: linkText || slider.linkText,
                    order: order !== undefined ? order : slider.order,
                    isActive: isActive !== undefined ? isActive : slider.isActive
                },
                { new: true, runValidators: true }
            );

            res.status(200).json({
                success: true,
                message: "Hero slider updated successfully",
                data: updatedSlider
            });

        } catch (error) {
            next(error);
        }
    })
);

router.delete(
    "/:id",
    isAuthenticated,
    authorizeRoles("admin"),
    catchAsyncErrors(async (req, res, next) => {
        try {
            const slider = await HeroSlider.findById(req.params.id);

            if (!slider) {
                return next(new ErrorHandler("Hero slider not found", 404));
            }

            // Delete file from server
            if (slider.imageUrl) {
                const filePath = path.join(__dirname, "..", slider.imageUrl);
                fs.unlink(filePath, (err) => {
                    if (err) console.log("Error deleting file:", err);
                });
            }

            await slider.deleteOne();

            res.status(200).json({
                success: true,
                message: "Hero slider deleted successfully"
            });

        } catch (error) {
            next(error);
        }
    })
);

router.put(
    "/reorder",
    isAuthenticated,
    authorizeRoles("admin"),
    catchAsyncErrors(async (req, res, next) => {
        try {
            const { items } = req.body;

            if (!items || !Array.isArray(items)) {
                return next(new ErrorHandler("Invalid items array", 400));
            }

            // Update each slider's order
            const updatePromises = items.map((item) =>
                HeroSlider.findByIdAndUpdate(
                    item.id,
                    { order: item.order },
                    { new: true }
                )
            );

            await Promise.all(updatePromises);

            res.status(200).json({
                success: true,
                message: "Hero sliders reordered successfully"
            });

        } catch (error) {
            next(error);
        }
    })
);

module.exports = router;