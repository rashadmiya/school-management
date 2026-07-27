//Teacher.js
const mongoose = require('mongoose');
const teacherSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    designation: { type: String, required: true }, // Added
    joiningDate: { type: Date, required: true }, // Added
    dateOfBirth: { type: Date }, // Added
    nationalIdNo: { type: String, unique: true }, // Added
    lastQualification: { // Added
        name: String,
        major: String,
        institute: String
    },
    phoneNumber: { type: String, required: true }, // Added
    address: { type: String }, // Added
    religion: { type: String }, // Added
    photo: { type: String }, // Added
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
}, { timestamps: true });

teacherSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('Teacher', teacherSchema);

// const mongoose = require('mongoose');

// const teacherSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   phone: String,
//   subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
//   classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
//   // sections: [{ type: String }] // ['Science', 'Arts', 'A', 'B']
// }, { timestamps: true });

// // In teacherSchema - add reference to user
// teacherSchema.index({ user: 1 }, { unique: true });

// module.exports = mongoose.model('Teacher', teacherSchema);
