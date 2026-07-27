// routes/adminDashboard.js
const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const Payment = require("../financeSystem/models/Payment")
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const Page = require("../models/Page");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Setting = require("../models/Setting");

// Complete Admin Dashboard
router.get("/dashboard", isAuthenticated,
    authorizeRoles("admin", "teacher"),
    async (req, res, next) => {
        try {
            console.log("admin dasboard called")
            // Basic counts
            const totalStudents = await Student.countDocuments();
            const totalTeachers = await Teacher.countDocuments();
            const totalClasses = await Class.countDocuments();
            const totalSubjects = await Subject.countDocuments();

            // Financial metrics
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            const monthlyRevenue = await Payment.aggregate([
                {
                    $match: {
                        status: { $in: ['paid', 'partial'] },
                        paidDate: {
                            $gte: new Date(currentYear, currentMonth - 1, 1),
                            $lt: new Date(currentYear, currentMonth, 1)
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$paidAmount' }
                    }
                }
            ]);

            const pendingFees = await Payment.aggregate([
                {
                    $match: {
                        status: { $in: ['pending', 'overdue'] },
                        dueDate: { $lt: new Date() }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $subtract: ['$amount', '$paidAmount'] } }
                    }
                }
            ]);

            // Today's attendance
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todayAttendance = await Attendance.aggregate([
                {
                    $match: {
                        date: {
                            $gte: today,
                            $lt: tomorrow
                        }
                    }
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Convert to object for easy access
            const todayAttendanceObj = {
                present: 0,
                absent: 0,
                late: 0,
                half_day: 0
            };

            todayAttendance.forEach(item => {
                todayAttendanceObj[item._id] = item.count;
            });

            // Overall attendance rate (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentAttendance = await Attendance.find({
                date: { $gte: thirtyDaysAgo }
            });

            const totalRecords = recentAttendance.length;
            const presentRecords = recentAttendance.filter(a => a.status === 'present').length;
            const lateRecords = recentAttendance.filter(a => a.status === 'late').length;
            const halfDayRecords = recentAttendance.filter(a => a.status === 'half_day').length;

            const weightedPresent = presentRecords + (lateRecords * 0.5) + (halfDayRecords * 0.5);
            const attendanceRate = totalRecords > 0 ? (weightedPresent / totalRecords) * 100 : 0;

            // Low attendance classes (below 75%)
            const classAttendance = await Attendance.aggregate([
                {
                    $match: {
                        date: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: '$class',
                        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
                        half_day: { $sum: { $cond: [{ $eq: ['$status', 'half_day'] }, 1, 0] } },
                        total: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        attendanceRate: {
                            $multiply: [
                                {
                                    $divide: [
                                        { $add: ['$present', { $multiply: ['$late', 0.5] }, { $multiply: ['$half_day', 0.5] }] },
                                        '$total'
                                    ]
                                },
                                100
                            ]
                        }
                    }
                },
                {
                    $match: {
                        attendanceRate: { $lt: 75 }
                    }
                }
            ]);

            // Recent payments for dashboard
            const recentPayments = await Payment.find({
                status: { $in: ['paid', 'partial'] }
            })
                .populate('student', 'name rollNumber')
                .populate('class', 'name')
                .sort({ paidDate: -1 })
                .limit(5);

            res.status(200).json({
                success: true,
                dashboard: {
                    // Basic statistics
                    totalStudents,
                    totalTeachers,
                    totalClasses,
                    totalSubjects,

                    // Financial data
                    financial: {
                        monthlyRevenue: monthlyRevenue[0]?.total || 0,
                        pendingFees: pendingFees[0]?.total || 0
                    },

                    // Attendance data
                    attendanceRate: Math.round(attendanceRate * 100) / 100,
                    todayAttendance: todayAttendanceObj,

                    // Alerts and insights
                    alerts: {
                        lowAttendanceClasses: classAttendance.length,
                        upcomingEvents: 3, // You can integrate with events model later
                        feeCollection: pendingFees[0]?.total > 0
                    },

                    // Recent activity
                    recentPayments
                }
            });

        } catch (error) {
            next(error);
        }
    });

// 🎯 Get all pages (admin)
router.get("/all-pages", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
    try {
        const pages = await Page.find()
            .select('title slug isPublished order createdAt')
            .sort({ order: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            pages,
            count: pages.length
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Get page by ID (admin)
router.get("/page/:id", isAuthenticated, authorizeRoles("admin"),
    catchAsyncErrors(async (req, res, next) => {
        try {
            const page = await Page.findById(req.params.id);

            if (!page) {
                return next(new ErrorHandler("Page not found", 404));
            }

            res.status(200).json({
                success: true,
                page
            });

        } catch (error) {
            next(error);
        }
    }));

// 🎯 Create new page
router.post("/create-page", isAuthenticated, authorizeRoles("admin"),
    catchAsyncErrors(async (req, res, next) => {
        try {
            const { title, slug, content, metaTitle, metaDescription, excerpt, featuredImage, isPublished, order, sections } = req.body;

            if (!title || !slug || !content) {
                return next(new ErrorHandler("Title, slug, and content are required", 400));
            }

            // Check if slug already exists
            const existingPage = await Page.findOne({ slug });
            if (existingPage) {
                return next(new ErrorHandler("Page with this slug already exists", 400));
            }

            const page = await Page.create({
                title,
                slug,
                content,
                metaTitle,
                metaDescription,
                excerpt,
                featuredImage,
                isPublished: isPublished !== undefined ? isPublished : true,
                order: order || 0,
                sections: sections || []
            });

            res.status(201).json({
                success: true,
                message: "Page created successfully",
                page
            });

        } catch (error) {
            next(error);
        }
    }));

// 🎯 Update page
router.put("/update-page/:id", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
    try {
        const { title, slug, content, metaTitle, metaDescription, excerpt, featuredImage, isPublished, order, sections } = req.body;

        const page = await Page.findById(req.params.id);
        if (!page) {
            return next(new ErrorHandler("Page not found", 404));
        }

        // Check if new slug conflicts with other pages
        if (slug && slug !== page.slug) {
            const existingPage = await Page.findOne({ slug, _id: { $ne: req.params.id } });
            if (existingPage) {
                return next(new ErrorHandler("Page with this slug already exists", 400));
            }
        }

        const updatedPage = await Page.findByIdAndUpdate(
            req.params.id,
            {
                title: title || page.title,
                slug: slug || page.slug,
                content: content || page.content,
                metaTitle: metaTitle !== undefined ? metaTitle : page.metaTitle,
                metaDescription: metaDescription !== undefined ? metaDescription : page.metaDescription,
                excerpt: excerpt !== undefined ? excerpt : page.excerpt,
                featuredImage: featuredImage !== undefined ? featuredImage : page.featuredImage,
                isPublished: isPublished !== undefined ? isPublished : page.isPublished,
                order: order !== undefined ? order : page.order,
                sections: sections !== undefined ? sections : page.sections
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Page updated successfully",
            page: updatedPage
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Delete page
router.delete("/delete-page/:id", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
    try {
        const page = await Page.findById(req.params.id);

        if (!page) {
            return next(new ErrorHandler("Page not found", 404));
        }

        // Prevent deletion of essential pages
        const essentialSlugs = ['home', 'about', 'contact'];
        if (essentialSlugs.includes(page.slug)) {
            return next(new ErrorHandler("Cannot delete essential pages", 400));
        }

        await Page.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Page deleted successfully"
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Update page order (bulk)
router.put("/page-order/update", isAuthenticated, authorizeRoles("admin"),
    catchAsyncErrors(async (req, res, next) => {
        try {
            const { pages } = req.body; // Array of { id, order }

            if (!Array.isArray(pages)) {
                return next(new ErrorHandler("Pages array is required", 400));
            }

            const bulkOperations = pages.map(page => ({
                updateOne: {
                    filter: { _id: page.id },
                    update: { order: page.order }
                }
            }));

            await Page.bulkWrite(bulkOperations);

            res.status(200).json({
                success: true,
                message: "Page order updated successfully"
            });

        } catch (error) {
            next(error);
        }
    }));

// 🎯 Get all settings (admin)
router.get("/all-settings", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
    try {
        const { category } = req.query;

        let filter = {};
        if (category) {
            filter.category = category;
        }

        const settings = await Setting.find(filter).sort({ category: 1, key: 1 });

        res.status(200).json({
            success: true,
            settings,
            count: settings.length
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Get setting by key
router.get("/setting/:key", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
    try {
        const setting = await Setting.findOne({ key: req.params.key.toUpperCase() });

        if (!setting) {
            return next(new ErrorHandler("Setting not found", 404));
        }

        res.status(200).json({
            success: true,
            setting
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Create or update setting
router.post("/create-setting", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
    try {
        const { key, value, type, category, label, description, options, isPublic } = req.body;

        if (!key || value === undefined) {
            return next(new ErrorHandler("Key and value are required", 400));
        }

        // Validate type
        const validTypes = ['string', 'number', 'boolean', 'array', 'object', 'file'];
        if (type && !validTypes.includes(type)) {
            return next(new ErrorHandler("Invalid type", 400));
        }

        // Type conversion based on specified type
        let processedValue = value;
        if (type === 'number') {
            processedValue = Number(value);
            if (isNaN(processedValue)) {
                return next(new ErrorHandler("Value must be a valid number", 400));
            }
        } else if (type === 'boolean') {
            processedValue = Boolean(value);
        } else if (type === 'array' && typeof value === 'string') {
            try {
                processedValue = JSON.parse(value);
            } catch (e) {
                processedValue = value.split(',').map(item => item.trim());
            }
        } else if (type === 'object' && typeof value === 'string') {
            try {
                processedValue = JSON.parse(value);
            } catch (e) {
                return next(new ErrorHandler("Invalid JSON for object type", 400));
            }
        }

        const setting = await Setting.findOneAndUpdate(
            { key: key.toUpperCase() },
            {
                key: key.toUpperCase(),
                value: processedValue,
                type: type || 'string',
                category: category || 'general',
                label: label || key,
                description,
                options,
                isPublic: isPublic !== undefined ? isPublic : false
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Setting saved successfully",
            setting
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Update multiple settings (bulk)
router.put("/setting/bulk-update", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
    try {
        const { settings } = req.body; // Array of { key, value }

        if (!Array.isArray(settings)) {
            return next(new ErrorHandler("Settings array is required", 400));
        }

        const bulkOperations = settings.map(setting => ({
            updateOne: {
                filter: { key: setting.key.toUpperCase() },
                update: { value: setting.value },
                upsert: false
            }
        }));

        const result = await Setting.bulkWrite(bulkOperations);

        res.status(200).json({
            success: true,
            message: `${result.modifiedCount} settings updated successfully`,
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Delete setting
router.delete("/delete-setting/:key", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
    try {
        const setting = await Setting.findOne({ key: req.params.key.toUpperCase() });

        if (!setting) {
            return next(new ErrorHandler("Setting not found", 404));
        }

        // Prevent deletion of essential settings
        const essentialSettings = ['SCHOOL_NAME', 'SCHOOL_EMAIL', 'SCHOOL_PHONE'];
        if (essentialSettings.includes(setting.key)) {
            return next(new ErrorHandler("Cannot delete essential settings", 400));
        }

        await Setting.findOneAndDelete({ key: req.params.key.toUpperCase() });

        res.status(200).json({
            success: true,
            message: "Setting deleted successfully"
        });

    } catch (error) {
        next(error);
    }
}));

// 🎯 Get settings by category
router.get("/settings-by-category/:category", isAuthenticated, authorizeRoles("admin"), catchAsyncErrors(async (req, res, next) => {
    try {
        const settings = await Setting.find({ category: req.params.category }).sort({ key: 1 });

        res.status(200).json({
            success: true,
            settings,
            count: settings.length
        });

    } catch (error) {
        next(error);
    }
}));

module.exports = router;