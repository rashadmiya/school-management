const FeeInstance = require("../models/FeeInstance");

async function outstandingReport({ classId, section }) {
  const filter = {
    status: { $ne: "paid" }
  };

  if (classId) filter.class = classId;
  if (section) filter.section = section;

  const fees = await FeeInstance.find(filter)
    .populate("student", "name rollNumber")
    .populate("feeTemplate", "title");

  const data = fees.map(fee => {
    const due =
      fee.originalAmount - fee.paidAmount - fee.waivedAmount;

    return {
      student: fee.student,
      fee: fee.feeTemplate.title,
      due
    };
  });

  const totalOutstanding = data.reduce((s, f) => s + f.due, 0);

  return { totalOutstanding, records: data };
}

module.exports = outstandingReport;
