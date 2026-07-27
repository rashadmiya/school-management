const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, default: Date.now },
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  description: String,
}, { timestamps: true });

module.exports = mongoose.model("Lesson", lessonSchema);
