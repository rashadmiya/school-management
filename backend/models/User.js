//User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  phoneNumber: String,
  addresses: [{ country: String, city: String, address1: String }],
  avatar: String,
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', },
  teacherRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }, // if teacher extra data stored separately
  parentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

// hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// JWT
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.JWT_EXPIRES
  });
};

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Add to userSchema
userSchema.add({
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('User', userSchema);