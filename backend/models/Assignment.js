const mongoose = require("mongoose");
const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Assignment title is required"],
    },
    description: {
      type: String,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    mark:{
      type:String,
    },
  },
  { timestamps: true }
);

// Add these indexes to Assignment model
assignmentSchema.index({ class: 1, dueDate: -1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ class: 1, subject: 1 });

// For archive/performance - consider archiving old assignments
assignmentSchema.index({
  class: 1,
  dueDate: 1,
  archived: 1
});

module.exports = mongoose.model("Assignment", assignmentSchema);
