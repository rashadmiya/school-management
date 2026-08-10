// routes/galleryRoutes.js
const express = require("express");
const router = express.Router();
const { isAdmin, isSuperAdmin, isAuthenticated } = require("../middleware/auth");
const { uploadSingleImage } = require("../multer");
const fs = require("fs");
const path = require("path");
const Gallery = require("../models/Gallery");
// const ErrorHandler = require("../utils/errorHandler");
const ErrorHandler = require("../utils/ErrorHandler");

// Public routes
router.get("/", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      isPublished,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};

    if (category && category !== "all") {
      query.category = category;
    }

    // For public access, only show published images
    if (!req.user || req.user.role === "student" || req.user.role === "parent") {
      query.isPublished = true;
    } else if (isPublished !== undefined) {
      query.isPublished = isPublished === "true";
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const [images, total, categories] = await Promise.all([
      Gallery.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("uploadedBy", "name email"),
      Gallery.countDocuments(query),
      Gallery.getCategoryStats(),
    ]);

    res.status(200).json({
      success: true,
      data: images,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
      categories,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/categories", async (req, res, next) => {
  try {
    const categories = await Gallery.getCategoryStats();

    // Add default categories with 0 count if not present
    const defaultCategories = [
      "achievements",
      "campus",
      "students",
      "innovation",
      "events",
      "sports",
      "academic",
      "cultural",
      "others",
    ];

    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat._id] = cat.count;
    });

    const result = defaultCategories.map((name) => ({
      name,
      count: categoryMap[name] || 0,
    }));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const image = await Gallery.findById(req.params.id).populate("uploadedBy", "name email");

    if (!image) {
      return next(new ErrorHandler("Image not found", 404));
    }

    // Only show published images to public
    if (!image.isPublished && (!req.user || req.user.role !== "admin")) {
      return next(new ErrorHandler("Image not available", 404));
    }

    // Increment views
    await Gallery.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.status(200).json({
      success: true,
      data: image,
    });
  } catch (error) {
    next(error);
  }
});

// Admin routes
router.post("/upload", isAuthenticated, uploadSingleImage, async (req, res, next) => {
  console.log("/upload executing :", req?.file, req?.user);

  try {
    if (!req.file) {
      return next(new ErrorHandler("Please upload an image", 400));
    }

    const { title, description, category, tags, isPublished } = req.body;

    if (!title) {
      // Delete uploaded file if validation fails
      if (req.file) {
        fs.unlink(req.file.path, (err) => err && console.log("Error deleting file:", err));
      }
      return next(new ErrorHandler("Title is required", 400));
    }

    // Parse tags if provided as JSON string
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = tags.split(",").map((t) => t.trim());
      }
    }

    // FIXED: Use relative URL path for database
    const imageUrl = `/uploads/gallery/${req.file.filename}`;

    console.log("Saving image with URL:", imageUrl);
    console.log("File path:", req.file.path);

    const galleryImage = await Gallery.create({
      title,
      description: description || "",
      category: category || "others",
      imageUrl,
      imageKey: req.file.filename,
      uploadedBy: req.user._id,
      isPublished: isPublished === "true" || isPublished === true,
      tags: parsedTags,
    });

    console.log("Gallery image created:", galleryImage);

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: galleryImage,
    });
  } catch (error) {
    console.log("Upload error:", error);
    // Clean up uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => err && console.log("Error deleting file:", err));
    }
    next(error);
  }
});

router.put("/:id", isAuthenticated, isAdmin("admin"), async (req, res, next) => {
  try {
    const { title, description, category, tags, isPublished, order } = req.body;

    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return next(new ErrorHandler("Image not found", 404));
    }

    // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (order !== undefined) updateData.order = order;

    if (tags) {
      try {
        updateData.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
      } catch (e) {
        updateData.tags = tags.split(",").map((t) => t.trim());
      }
    }

    const updatedImage = await Gallery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("uploadedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Image updated successfully",
      data: updatedImage,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", isAuthenticated, isAdmin("admin"), async (req, res, next) => {
  try {
    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return next(new ErrorHandler("Image not found", 404));
    }

    // Delete file from server
    if (image.imageUrl) {
      const filePath = path.join(__dirname, "..", image.imageUrl);
      fs.unlink(filePath, (err) => {
        if (err) console.log("Error deleting file:", err);
      });
    }

    await image.deleteOne();

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/bulk", isAuthenticated, isAdmin("admin"), async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return next(new ErrorHandler("No image IDs provided", 400));
    }

    // Get images to delete files
    const images = await Gallery.find({ _id: { $in: ids } });

    // Delete files from server
    images.forEach((image) => {
      if (image.imageUrl) {
        const filePath = path.join(__dirname, "..", image.imageUrl);
        fs.unlink(filePath, (err) => {
          if (err) console.log("Error deleting file:", err);
        });
      }
    });

    // Delete from database
    await Gallery.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${ids.length} images deleted successfully`,
      deletedCount: ids.length,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/toggle-publish", isAuthenticated, isAdmin("admin"), async (req, res, next) => {
  try {
    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return next(new ErrorHandler("Image not found", 404));
    }

    image.isPublished = !image.isPublished;
    await image.save();

    res.status(200).json({
      success: true,
      message: `Image ${image.isPublished ? "published" : "unpublished"} successfully`,
      data: image,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;