//Parent.js
const mongoose = require("mongoose");
const parentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  address: { type: String },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
}, { timestamps: true });

// In parentSchema - link to User model
parentSchema.add({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model("Parent", parentSchema);