// reports/payment.reports.js
const Student = require('../models/Student');
const LedgerEntry = require('../models/LedgerEntry');
const FeeInstance = require('../models/FeeInstance');


//GET /api/reports/student-ledger/:studentId?session=2024-2025

async function studentLedgerReport(studentId, session) {
  const entries = await LedgerEntry.find({ student: studentId, session })
    .sort({ createdAt: 1 });

  return {
    openingBalance: entries[0]?.balanceAfter ?? 0,
    closingBalance:
      entries.length > 0
        ? entries[entries.length - 1].balanceAfter
        : 0,
    entries
  };
}

// GET /api/reports/student-fees/:studentId
async function studentFeeSummary(studentId, session) {
  const fees = await FeeInstance.find({ student: studentId, session });

  let total = 0, paid = 0, waived = 0, due = 0;

  fees.forEach(f => {
    total += f.originalAmount;
    paid += f.paidAmount;
    waived += f.waivedAmount;
    due += (f.originalAmount - f.paidAmount - f.waivedAmount);
  });

  const balance = await LedgerEntry.getLastBalance(studentId, session);

  return {
    totalFees: total,
    paid,
    waived,
    due,
    advance: balance < 0 ? Math.abs(balance) : 0
  };
}

// GET /api/reports/class-due/:classId

async function classDueReport(classId, session) {
  const students = await Student.find({ class: classId, session });

  const studentIds = students.map(s => s._id);

  const fees = await FeeInstance.find({
    student: { $in: studentIds },
    session,
    status: { $in: ["unpaid", "partial"] }
  });

  const totalDue = fees.reduce(
    (sum, f) => sum + (f.originalAmount - f.paidAmount - f.waivedAmount),
    0
  );

  return {
    totalStudents: students.length,
    totalDue
  };
}

//GET /api/reports/income?from=2024-01-01&to=2024-12-31
async function incomeReport(from, to) {
  const entries = await LedgerEntry.find({
    type: "payment",
    createdAt: { $gte: from, $lte: to }
  });

  const total = entries.reduce((sum, e) => sum + e.credit, 0);

  return {
    totalCollected: total,
    transactions: entries.length
  };
}

module.exports = {
  studentLedgerReport,
  studentFeeSummary,
  classDueReport,
  incomeReport
};
