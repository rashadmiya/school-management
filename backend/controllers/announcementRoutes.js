// routes/announcementRoutes.js
const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// 🎯 Public: Get active announcements
router.get("/public-announcements", catchAsyncErrors(async (req, res, next) => {
    try {
        const { category, limit = 10, page = 1, audience = 'all' } = req.query;
        const today = new Date();

        let filter = {
            isPublished: true,
            startDate: { $lte: today },
            $or: [
                { endDate: { $gte: today } },
                { endDate: null }
            ]
        };

        if (category && category !== 'all') {
            filter.category = category;
        }

        // Filter by audience
        if (audience && audience !== 'all') {
            filter.targetAudience = { $in: [audience, 'all'] };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const announcements = await Announcement.find(filter)
            .populate('createdBy', 'name')
            .select('-content') // Don't send full content in list
            .sort({ isPinned: -1, startDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));


        const total = await Announcement.countDocuments(filter);

        res.status(200).json({
            success: true,
            announcements,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Public: Get announcement by ID
router.get("/public-announcement/:id", catchAsyncErrors(async (req, res, next) => {
    try {
        const announcement = await Announcement.findOne({
            _id: req.params.id,
            isPublished: true
        }).populate('createdBy', 'name email');

        if (!announcement) {
            return next(new ErrorHandler("Announcement not found", 404));
        }

        // Increment views
        announcement.views += 1;
        await announcement.save();

        res.status(200).json({
            success: true,
            announcement
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Public: Get announcement categories
router.get("/public-announcements/categories", catchAsyncErrors(async (req, res, next) => {
    try {
        const categories = await Announcement.distinct('category', {
            isPublished: true
        });

        res.status(200).json({
            success: true,
            categories
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Admin: Get all announcements
router.get("/admin-announcements", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
    try {
        const { status = 'all', category, page = 1, limit = 20 } = req.query;

        let filter = {};

        if (status === 'active') {
            const today = new Date();
            filter = {
                isPublished: true,
                startDate: { $lte: today },
                $or: [
                    { endDate: { $gte: today } },
                    { endDate: null }
                ]
            };
        } else if (status === 'upcoming') {
            filter = {
                isPublished: true,
                startDate: { $gt: new Date() }
            };
        } else if (status === 'expired') {
            filter = {
                isPublished: true,
                endDate: { $lt: new Date() }
            };
        } else if (status === 'draft') {
            filter = { isPublished: false };
        }

        if (category && category !== 'all') {
            filter.category = category;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const announcements = await Announcement.find(filter)
            .populate('createdBy', 'name')
            .sort({ isPinned: -1, startDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Announcement.countDocuments(filter);

        // Statistics
        const today = new Date();
        const stats = {
            total: await Announcement.countDocuments(),
            active: await Announcement.countDocuments({
                isPublished: true,
                startDate: { $lte: today },
                $or: [
                    { endDate: { $gte: today } },
                    { endDate: null }
                ]
            }),
            draft: await Announcement.countDocuments({ isPublished: false }),
            pinned: await Announcement.countDocuments({ isPinned: true, isPublished: true })
        };

        res.status(200).json({
            success: true,
            announcements,
            statistics: stats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Admin: Get announcement by ID
router.get("/admin-announcement/:id", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!announcement) {
            return next(new ErrorHandler("Announcement not found", 404));
        }

        res.status(200).json({
            success: true,
            announcement
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Admin: Create announcement
router.post("/create", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            title,
            content,
            excerpt,
            category,
            priority,
            isPublished,
            isPinned,
            startDate,
            endDate,
            targetAudience,
            attachments
        } = req.body;

        if (!title || !content) {
            return next(new ErrorHandler("Title and content are required", 400));
        }

        // Validate dates
        // Normalize dates (ignore time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const parsedStartDate = new Date(startDate);
        parsedStartDate.setHours(0, 0, 0, 0);

        if (parsedStartDate < today) {
            return next(new ErrorHandler("Start date cannot be in the past", 400));
        }

        if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
            return next(new ErrorHandler("End date cannot be before start date", 400));
        }

        const announcement = await Announcement.create({
            title,
            content,
            excerpt,
            category: category || 'general',
            priority: priority || 'medium',
            isPublished: isPublished !== undefined ? isPublished : false,
            isPinned: isPinned || false,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            targetAudience: targetAudience || ['all'],
            attachments: attachments || [],
            createdBy: req.user._id
        });

        const populatedAnnouncement = await Announcement.findById(announcement._id)
            .populate('createdBy', 'name');

        res.status(201).json({
            success: true,
            message: "Announcement created successfully",
            announcement: populatedAnnouncement
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Admin: Update announcement
router.put("/update/:id", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            title,
            content,
            excerpt,
            category,
            priority,
            isPublished,
            isPinned,
            startDate,
            endDate,
            targetAudience,
            attachments
        } = req.body;

        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return next(new ErrorHandler("Announcement not found", 404));
        }

        // Validate dates
        // Normalize dates (ignore time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const parsedStartDate = new Date(startDate);
        parsedStartDate.setHours(0, 0, 0, 0);

        if (parsedStartDate < today) {
            return next(new ErrorHandler("Start date cannot be in the past", 400));
        }

        if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
            return next(new ErrorHandler("End date cannot be before start date", 400));
        }

        const updatedAnnouncement = await Announcement.findByIdAndUpdate(
            req.params.id,
            {
                title: title || announcement.title,
                content: content || announcement.content,
                excerpt: excerpt !== undefined ? excerpt : announcement.excerpt,
                category: category || announcement.category,
                priority: priority || announcement.priority,
                isPublished: isPublished !== undefined ? isPublished : announcement.isPublished,
                isPinned: isPinned !== undefined ? isPinned : announcement.isPinned,
                startDate: startDate ? new Date(startDate) : announcement.startDate,
                endDate: endDate ? new Date(endDate) : announcement.endDate,
                targetAudience: targetAudience || announcement.targetAudience,
                attachments: attachments !== undefined ? attachments : announcement.attachments
            },
            { new: true, runValidators: true }
        ).populate('createdBy', 'name');

        res.status(200).json({
            success: true,
            message: "Announcement updated successfully",
            announcement: updatedAnnouncement
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Admin: Delete announcement
router.delete("/delete/:id", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return next(new ErrorHandler("Announcement not found", 404));
        }

        await Announcement.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Announcement deleted successfully"
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Admin: Toggle pin status
router.patch("/pin-status/:id/pin", isAuthenticated, authorizeRoles("admin", "teacher"), catchAsyncErrors(async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return next(new ErrorHandler("Announcement not found", 404));
        }

        announcement.isPinned = !announcement.isPinned;
        await announcement.save();

        res.status(200).json({
            success: true,
            message: `Announcement ${announcement.isPinned ? 'pinned' : 'unpinned'}`,
            announcement
        });

    } catch (error) {
        next(error);
    }
}));

// Add to routes/announcementRoutes.js

// 🎯 Download announcement attachment
router.get("/announcement/:announcementId/files/:fileId/download",
    catchAsyncErrors(async (req, res, next) => {
        try {
            const announcement = await Announcement.findOne({
                _id: req.params.announcementId,
                isPublished: true
            });

            if (!announcement) {
                return next(new ErrorHandler("Announcement not found", 404));
            }

            const file = announcement.attachments.id(req.params.fileId);
            if (!file) {
                return next(new ErrorHandler("File not found", 404));
            }

            // Set headers for download
            res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
            res.setHeader('Content-Type', file.mimetype);

            // In a real application, you would stream the file from storage
            // For now, we'll redirect to the file URL (if it's a full URL)
            if (file.url.startsWith('http')) {
                return res.redirect(file.url);
            } else {
                // If it's a local file, you would serve it from your server
                return res.sendFile(path.resolve(file.url));
            }

        } catch (error) {
            next(error);
        }
    })
);
module.exports = router;