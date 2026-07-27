const mongoose = require('mongoose');

const resultSheetSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  grade: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  term: { type: String, required: true, enum: ['Term 1', 'Term 2', 'Final Term', 'Semester 1', 'Semester 2'] },
  year: { type: Number, required: true },
  results: [
    {
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
      totalExamScore: { type: Number, default: 0 },
      totalAssignmentScore: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      grade: String,
      remarks: String
    }
  ],
  overallAverage: { type: Number, default: 0 },
  position: Number,
  isPublished: { type: Boolean, default: false }
}, { timestamps: true });

resultSheetSchema.index({ student: 1, class: 1, year: 1, term: 1 }, { unique: true });

module.exports = mongoose.model('ResultSheet', resultSheetSchema);
