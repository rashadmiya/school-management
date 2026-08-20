//Club.js:
const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
    clubName: { 
        type: String, 
        required: true, 
        unique: true 
    },
    supervisor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Teacher', 
        required: true 
    },
    session: { 
        type: String, 
        required: true 
    },
    description: String,
    type: {
        type: String,
        enum: ['cultural', 'science', 'language', 'debate', 'sports', 'arts', 'technology', 'others'],
        default: 'others',
        required: true
    },
    members: [{
        student: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Student' 
        },
        role: { 
            type: String, 
            enum: ['president', 'vice_president', 'member'],
            default: 'member'
        },
        joinedDate: { 
            type: Date, 
            default: Date.now 
        }
    }],
    meetingSchedule: {
        day: String,
        time: String,
        venue: String
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

// Add index for better query performance
clubSchema.index({ type: 1, session: 1 });
// clubSchema.index({ clubName: 1 }, { unique: true });

module.exports = mongoose.model('Club', clubSchema);


// const mongoose = require('mongoose');

// const clubSchema = new mongoose.Schema({
//     clubName: { type: String, required: true, unique: true },
//     supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
//     session: { type: String, required: true },
//     description: String,
//     members: [{
//         student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
//         role: { type: String, enum: ['president', 'vice_president', 'member'] },
//         joinedDate: { type: Date, default: Date.now }
//     }],
//     meetingSchedule: {
//         day: String,
//         time: String,
//         venue: String
//     },
//     isActive: { type: Boolean, default: true }
// }, { timestamps: true });

// module.exports = mongoose.model('Club', clubSchema);