// models/Page.js
const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  }, // home, about, contact, admissions, etc.
  content: { 
    type: String, 
    required: true 
  },
  excerpt: {
    type: String,
    maxlength: 300
  },
  metaTitle: String,
  metaDescription: String,
  featuredImage: String,
  isPublished: { 
    type: Boolean, 
    default: true 
  },
  order: {
    type: Number,
    default: 0
  },
  sections: [{
    type: { 
      type: String, 
      enum: ['hero', 'features', 'stats', 'testimonials', 'gallery', 'content', 'cta', 'team'],
      required: true
    },
    title: String,
    subtitle: String,
    content: String,
    image: String,
    data: mongoose.Schema.Types.Mixed, // For flexible data (arrays, objects)
    order: { type: Number, default: 0 }
  }]
}, { 
  timestamps: true 
});

// Index for faster queries
pageSchema.index({ slug: 1, isPublished: 1 });
pageSchema.index({ order: 1 });

module.exports = mongoose.model('Page', pageSchema);