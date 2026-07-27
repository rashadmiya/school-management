//Stuff.js:
const mongoose = require('mongoose');

const stuffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    designation: { type: String, required: true },
    session: { type: String, required: true },
    dateOfBirth: Date,
    nationalIdNo: { type: String, unique: true },
    lastQualification: {
        name: String,
        major: String,
        institute: String
    },
    phoneNumber: { type: String, required: true },
    address: String,
    religion: String,
    photo: String,
    joiningDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Stuff', stuffSchema);
// const mongoose = require('mongoose');
// const stuffSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     designation: { type: String, required: true },
//     session: { type: String, required: true }, // e.g., "2023-2024"
//     dateOfBirth: Date,
//     nationalIdNo: String,
//     lastQualification: {
//         name: String,
//         major: String,
//         institute: String
//     },
//     phoneNumber: String,
//     address: String,
//     religion: String,
//     photo: String // URL or path to photo
// }, { timestamps: true });

// module.exports = mongoose.model('Stuff', stuffSchema);