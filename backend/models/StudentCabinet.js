//StudentCabinet.js:
const mongoose = require('mongoose');

const studentCabinetSchema = new mongoose.Schema({
    name: { type: String, required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', },
    rollNumber: { type: String, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, // Reference to student
    designation: { 
        type: String, 
        required: true,
        enum: ['president', 'vice_president', 'secretary', 'treasurer', 'member']
    },
    session: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

studentCabinetSchema.index({ session: 1 }, { unique: true });
module.exports = mongoose.model('StudentCabinet', studentCabinetSchema);

// const mongoose = require('mongoose');
// const studentCabinetSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
//     section: { type: String, required: true }, // We can also get the section from the class, but we store it here for quick access
//     rollNumber: { type: String, required: true },
//     designation: { type: String, required: true }, // e.g., "President", "Vice President"
//     session: { type: String, required: true } // e.g., "2023-2024"
// }, { timestamps: true });

// module.exports = mongoose.model('StudentCabinet', studentCabinetSchema);