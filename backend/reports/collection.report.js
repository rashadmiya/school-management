const Payment = require("../financeSystem/models/Payment")

async function collectionReport({ startDate, endDate, method }) {
  const filter = {};

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (method) filter.method = method;

  const payments = await Payment.find(filter)
    .populate("student", "name rollNumber")
    .populate("receivedBy", "name");

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    totalCollected: total,
    count: payments.length,
    payments
  };
}

module.exports = collectionReport;
