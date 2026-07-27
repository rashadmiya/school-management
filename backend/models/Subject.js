//Subject.js
const mongoose = require('mongoose');
const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    code: String,
    description: String,
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }] // Added: reference to classes
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);

// const mongoose = require('mongoose');

// const subjectSchema = new mongoose.Schema({
//   name: { type: String, required: true, unique: true },
//   code: String,
//   description: String
// }, { timestamps: true });

// module.exports = mongoose.model('Subject', subjectSchema);

