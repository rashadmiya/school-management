// models/Parent.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const parentSchema = new mongoose.Schema({
    name:  { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true, index: true },
    altPhone: String,
    email:    { type: String, lowercase: true, trim: true, sparse: true },
    address:  String,

    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],

    // Optional — only set if this parent is also a staff member with a User login
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true },

    // --- Auth (phone + PIN) ---
    pin:        { type: String, select: false },   // bcrypt hash
    pinIsTemp:  { type: Boolean, default: true },  // forces change on first login
    pinSetAt:   Date,
    isVerified: { type: Boolean, default: false },
    lastLogin:  Date,

    // --- Reserved for future OTP ---
    otpHash:      { type: String, select: false },
    otpExpiresAt: { type: Date,   select: false },

    isActive: { type: Boolean, default: true },
}, { timestamps: true });

parentSchema.index({ user: 1 }, { sparse: true });
parentSchema.index({ children: 1 });

/* ---------- phone normalization ---------- */
parentSchema.statics.normalizePhone = function (raw) {
    if (!raw) return null;
    let d = String(raw).replace(/\D/g, '');
    if (!d) return null;
    if (d.startsWith('880')) return '+' + d;                     // 8801XXXXXXXXX
    if (d.startsWith('0') && d.length === 11) return '+880' + d.slice(1); // 01XXXXXXXXX
    if (d.length === 10) return '+880' + d;                      // 1XXXXXXXXX
    return '+' + d;                                              // assume intl
};

parentSchema.statics.findByPhone = function (raw) {
    const phone = this.normalizePhone(raw);
    return phone ? this.findOne({ phone }) : null;
};

parentSchema.statics.generateTempPin = function () {
    return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
};

/* ---------- pin helpers ---------- */
parentSchema.methods.comparePin = function (entered) {
    return bcrypt.compare(String(entered), this.pin);
};

parentSchema.methods.setPin = async function (rawPin) {
    this.pin = await bcrypt.hash(String(rawPin), 10);
    this.pinIsTemp = false;
    this.pinSetAt = new Date();
};

module.exports = mongoose.model('Parent', parentSchema);

// // models/Parent.js
// const mongoose = require('mongoose');

// const parentSchema = new mongoose.Schema({
//     name:    { type: String, required: true, trim: true },
//     phone:   { type: String, required: true, unique: true, trim: true }, // E.164: +8801XXXXXXXXX
//     altPhone:{ type: String },
//     email:   { type: String, lowercase: true, sparse: true },
//     address: String,

//     children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],

//     // Optional: only if this parent is also a staff member with a User login
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true },

//     // --- Auth (lightweight, phone-first) ---
//     pin:          { type: String, select: false },   // hashed, set on first login
//     isVerified:   { type: Boolean, default: false },
//     verifiedAt:   Date,
//     lastLogin:    Date,
//     otpHash:      { type: String, select: false },
//     otpExpiresAt: { type: Date,  select: false },

//     isActive: { type: Boolean, default: true },
// }, { timestamps: true });

// parentSchema.index({ phone: 1 }, { unique: true });
// parentSchema.index({ children: 1 });
// parentSchema.index({ user: 1 }, { sparse: true });

// // Utility: canonicalize phone for lookups
// parentSchema.statics.normalizePhone = function (raw) {
//     if (!raw) return null;
//     let d = String(raw).replace(/\D/g, '');
//     if (d.startsWith('880')) d = '+' + d;
//     else if (d.startsWith('0')) d = '+880' + d.slice(1);
//     else if (d.length === 10)   d = '+880' + d;
//     else d = '+' + d;
//     return d;
// };

// parentSchema.statics.findByPhone = function (raw) {
//     const phone = this.normalizePhone(raw);
//     return phone ? this.findOne({ phone }) : null;
// };

// module.exports = mongoose.model('Parent', parentSchema);

// //Parent.js
// const mongoose = require("mongoose");
// const parentSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   phone: { type: String, required: true },
//   email: String,
//   address: { type: String },
//   children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
// }, { timestamps: true });

// // In parentSchema - link to User model
// parentSchema.add({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
// });

// module.exports = mongoose.model("Parent", parentSchema);