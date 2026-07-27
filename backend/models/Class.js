// models/Class.js
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }, // e.g., "10"
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: true
    },
    academicYear: {
        type: String,
        required: true,
        default: () => {
            const currentYear = new Date().getFullYear();
            return `${currentYear}-${currentYear + 1}`;
        }
    }
}, { timestamps: true });

// Unique combination of name, section, and academic year
classSchema.index({
    name: 1,
    section: 1,
    academicYear: 1
}, { unique: true });

module.exports = mongoose.model('Class', classSchema);


