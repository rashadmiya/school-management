const LedgerEntry = require("../models/LedgerEntry");

async function ledgerReport(studentId, { startDate, endDate }) {
  const filter = { student: studentId };

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const entries = await LedgerEntry.find(filter).sort({ createdAt: 1 });

  return entries;
}

module.exports = ledgerReport;
