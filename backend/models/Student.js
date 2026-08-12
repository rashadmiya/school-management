// models/Student.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rollNumber: { type: String, unique: true, required: true },
    password: { type: String, required: true, select: false },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade' },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Parent", required: false, default: null },
    isStudent: { type: Boolean, default: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    // Fee-related fields
    feeCategory: {
        type: String,
        enum: ['regular', 'scholarship', 'staff_ward'],
        default: 'regular'
    },
    // transportRoute: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute' },
    financialNotes: String,
    // Add payments reference
    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
    // New fields
    session: { type: String, required: true }, // e.g., "2023-2024"
    lastExamResult: {
        examName: String,
        achievedMarks: String,
        totalMarks: String
    },
    birthRegNo: String,
    fathersName: String,
    mothersName: String,
    guardianContact: String,
    religion: String,
    photo: String, // URL or path to photo
    isPhysicallyDisabled: { type: Boolean, default: false },
    disabilityDescription: String, // description if has disability
    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

// Hash password before saving
studentSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password
studentSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// JWT token
studentSchema.methods.getJwtToken = function () {
    return jwt.sign(
        { id: this._id, role: 'student' },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};


studentSchema.index({ class: 1, rollNumber: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);