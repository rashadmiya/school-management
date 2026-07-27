// const mongoose = require("mongoose");

// const gradeSchema = new mongoose.Schema({
//   name: { type: String, required: true }, // e.g., "Grade 10"
//   description: String,
// }, { timestamps: true });

// module.exports = mongoose.model("Grade", gradeSchema);

const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    minMarks: {
      type: Number,
      required: true,
    },
    maxMarks: {
      type: Number,
      required: true,
    },
    gradePoint: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Grade", gradeSchema);

