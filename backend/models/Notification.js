const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "userType", // dynamically refer to Student / Teacher / Parent / User
      required: true,
    },
    userType: {
      type: String,
      enum: ["User", "Teacher", "Student", "Parent"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["assignment", "exam", "result", "attendance", "general"],
      default: "general",
    },
    link: { type: String }, // optional route or resource id
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
