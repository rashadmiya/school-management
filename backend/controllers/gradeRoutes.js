const express = require("express");
const router = express.Router();
const Grade = require("../models/Grade");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// ✅ Create Grade
router.post("/create", isAuthenticated, isAdmin("admin"), async (req, res) => {
  try {
    const { name, minMarks, maxMarks, gradePoint } = req.body;
    const grade = await Grade.create({ name, minMarks, maxMarks, gradePoint });
    res.status(201).json({ success: true, message: "Grade created", grade });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating grade" });
  }
});

// ✅ Get all grades
router.get("/all", isAuthenticated, async (req, res) => {
  try {
    const grades = await Grade.find().sort({ minMarks: 1 });
    res.status(200).json({ success: true, grades });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching grades" });
  }
});

module.exports = router;
