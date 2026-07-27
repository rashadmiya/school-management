const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { isAuthenticated, isStudentAuthenticated } = require("../middleware/auth");

// ✅ Create Notification
router.post("/create", isAuthenticated, async (req, res) => {
  try {
    const { userId, userType, title, message, type, link } = req.body;

    const note = await Notification.create({
      user: userId,
      userType,
      title,
      message,
      type,
      link,
    });

    res.status(201).json({ success: true, message: "Notification created", note });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ success: false, message: "Error creating notification" });
  }
});

// ✅ Fetch notifications (for any user)
router.get("/:userId", async (req, res) => {
  try {
    const notes = await Notification.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ success: true, notes });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Error fetching notifications" });
  }
});

// ✅ Mark as read
router.patch("/:id/read", async (req, res) => {
  try {
    const note = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.status(200).json({ success: true, message: "Notification marked as read", note });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Error updating notification" });
  }
});

// ✅ Delete notification
router.delete("/:id", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ success: false, message: "Error deleting notification" });
  }
});

module.exports = router;
