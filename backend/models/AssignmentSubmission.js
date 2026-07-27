const mongoose = require("mongoose");
const assignmentSubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  files: [{
    filename: String,
    url: String,
    size: Number,
    mimetype: String
  }],
  content: String, // Text submission
  status: {
    type: String,
    enum: ["submitted", "graded", "late", "missing"],
    default: "submitted"
  },
  grade: {
    score: Number,
    maxScore: Number,
    feedback: String,
    gradedAt: Date,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  }
}, { timestamps: true });

// Compound index for performance
assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
assignmentSubmissionSchema.index({ student: 1, submittedAt: -1 });

module.exports = mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);
