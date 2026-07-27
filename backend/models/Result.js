//Result.js
const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },

    term: { type: String, enum: ["Term 1", "Term 2", "Final"], required: true },
    year: { type: Number, required: true },
    type: { type: String, enum: ["exam", "assignment"], default: "exam" },
    score: { type: Number, required: true }, // instead of marksObtained if you prefer
  },
  { timestamps: true }
);

// Prevent duplicate result entries for same exam + subject + student
resultSchema.index({ student: 1, exam: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model("Result", resultSchema);
