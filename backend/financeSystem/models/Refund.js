const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },

  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  reason: {
    type: String,
    required: true
  },

  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Refund", refundSchema);
