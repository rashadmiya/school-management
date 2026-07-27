const express = require("express");
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");

const collectionReport = require("./collection.report");
const outstandingReport = require("./outstanding.report");
const ledgerReport = require("./ledger.report");

// Collection report
router.get(
  "/collection",
  isAuthenticated,
  authorizeRoles("admin", "accountant"),
  async (req, res) => {
    const data = await collectionReport(req.query);
    res.json({ success: true, data });
  }
);

// Outstanding fees
router.get(
  "/outstanding",
  isAuthenticated,
  authorizeRoles("admin", "accountant"),
  async (req, res) => {
    const data = await outstandingReport(req.query);
    res.json({ success: true, data });
  }
);

// Ledger export
router.get(
  "/ledger/:studentId",
  isAuthenticated,
  authorizeRoles("admin", "accountant", "student"),
  async (req, res) => {
    const studentId =
      req.user.role === "student"
        ? req.user.id
        : req.params.studentId;

    const data = await ledgerReport(studentId, req.query);
    res.json({ success: true, data });
  }
);

module.exports = router;
