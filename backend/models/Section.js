//Section.js
// models/Section.js
const mongoose = require('mongoose');
const sectionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    capacity: { type: Number, default: 40 },
    currentStrength: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Section', sectionSchema);

// const mongoose = require('mongoose');
// const sectionSchema = new mongoose.Schema({
//     name: { type: String, required: true }, // "A", "B", etc.
//     class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
//     capacity: { type: Number, default: 40 },
//     currentStrength: { type: Number, default: 0 },
//     isActive: { type: Boolean, default: true }
// }, { timestamps: true });

// // Ensure unique section name per class
// sectionSchema.index({ name: 1, class: 1 }, { unique: true });

// module.exports = mongoose.model('Section', sectionSchema);