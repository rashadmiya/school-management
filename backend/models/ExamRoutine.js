//ExamRoutine.js
// models/ExamRoutine.js
const mongoose = require('mongoose');

const examRoutineSchema = new mongoose.Schema({
    examType: {
        type: String,
        required: true,
        enum: ['midterm', 'final', 'term', 'weekly', 'monthly', 'others']
    },
    title: { 
        type: String, 
        required: true 
    },
    academicYear: { 
        type: String, 
        required: true 
    },
    examDate: { 
        type: Date, 
        required: true 
    },
    startTime: { 
        type: String, 
        required: true 
    },
    endTime: { 
        type: String, 
        required: true 
    },
    subject: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Subject', 
        required: true 
    },
    class: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class', 
        required: true 
    },
    roomNumber: { 
        type: String, 
        required: true 
    },
    monitoringTeachers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    }],
    totalMarks: { 
        type: Number, 
        required: true 
    },
    passingMarks: { 
        type: Number, 
        required: true 
    },
    instructions: String,
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    isPublished: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

// Indexes for performance
examRoutineSchema.index({ examDate: 1, startTime: 1 });
examRoutineSchema.index({ class: 1, examDate: 1 });
examRoutineSchema.index({ subject: 1 });
examRoutineSchema.index({ monitoringTeachers: 1 });

module.exports = mongoose.model('ExamRoutine', examRoutineSchema);

// const mongoose = require('mongoose');
// const examRoutineSchema = new mongoose.Schema({
//     examType: {
//         type: String,
//         required: true,
//         enum: ['midterm', 'final', 'term', 'weekly', 'monthly']
//     },
//     title: { type: String, required: true },
//     class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
//     section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' }, // Optional: if specific to section
//     academicYear: { type: String, required: true },
//     startDate: { type: Date, required: true },
//     endDate: { type: Date, required: true },
//     subjects: [{
//         subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
//         examDate: { type: Date, required: true },
//         startTime: { type: String, required: true },
//         endTime: { type: String, required: true },
//         roomNumber: String,
//         supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
//         totalMarks: { type: Number, required: true }
//     }],
//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     isPublished: { type: Boolean, default: false }
// }, { timestamps: true });

// examRoutineSchema.index({ class: 1, examType: 1, academicYear: 1 });
// module.exports = mongoose.model('ExamRoutine', examRoutineSchema);