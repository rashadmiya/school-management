// models/Announcement.js
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 300
  },
  category: {
    type: String,
    enum: ['general', 'academic', 'event', 'holiday', 'exam', 'sports', 'important'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  targetAudience: [{
    type: String,
    enum: ['students', 'teachers', 'parents', 'all'],
    default: ['all']
  }],
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimetype: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
announcementSchema.index({ isPublished: 1, startDate: -1 });
announcementSchema.index({ category: 1, isPublished: 1 });
announcementSchema.index({ isPinned: 1, startDate: -1 });
announcementSchema.index({ endDate: 1 });
announcementSchema.index({ targetAudience: 1 });

// Virtual for checking if announcement is active
announcementSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.isPublished && 
         this.startDate <= now && 
         (!this.endDate || this.endDate >= now);
});

module.exports = mongoose.model('Announcement', announcementSchema);