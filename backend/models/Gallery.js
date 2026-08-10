// models/Gallery.js
const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "achievements",
        "campus",
        "students",
        "innovation",
        "events",
        "sports",
        "academic",
        "cultural",
        "others",
      ],
      default: "others",
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    imageKey: {
      type: String, // For storing the file name/key if needed
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
gallerySchema.index({ category: 1, createdAt: -1 });
gallerySchema.index({ isPublished: 1 });
gallerySchema.index({ tags: 1 });

// Virtual for formatted date
gallerySchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Static method to get category statistics
gallerySchema.statics.getCategoryStats = async function () {
  return this.aggregate([
    { $match: { isPublished: true } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
  ]);
};

const Gallery = mongoose.model("Gallery", gallerySchema);

module.exports = Gallery;