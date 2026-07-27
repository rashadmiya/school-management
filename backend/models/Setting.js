// models/Setting.js
const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    uppercase: true
  },
  value: mongoose.Schema.Types.Mixed,
  type: { 
    type: String, 
    enum: ['string', 'number', 'boolean', 'array', 'object', 'file'],
    default: 'string'
  },
  category: { 
    type: String, 
    default: 'general',
    enum: ['general', 'appearance', 'contact', 'social', 'seo', 'academic']
  },
  label: String,
  description: String,
  options: [String], // For select dropdowns
  isPublic: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Index for category-based queries
settingSchema.index({ category: 1, key: 1 });
settingSchema.index({ isPublic: 1 });

module.exports = mongoose.model('Setting', settingSchema);