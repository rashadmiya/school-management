// models/HeroSlider.js
const mongoose = require('mongoose');

const heroSliderSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        maxlength: [100, "Title cannot exceed 100 characters"]
    },
    subtitle: {
        type: String,
        trim: true,
        maxlength: [200, "Subtitle cannot exceed 200 characters"]
    },
    imageUrl: {
        type: String,
        required: [true, "Image URL is required"]
    },
    imageKey: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    link: {
        type: String,
        trim: true
    },
    linkText: {
        type: String,
        trim: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for better query performance
heroSliderSchema.index({ order: 1, isActive: 1 });

module.exports = mongoose.model('HeroSlider', heroSliderSchema);