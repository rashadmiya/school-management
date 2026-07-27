//Role.js
const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true, // avoids accidental spaces
    },
    description: {
      type: String,
      default: "",
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
