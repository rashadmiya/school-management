// SchoolManagementCommittee.js
const mongoose = require('mongoose');
const committeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    designation: {
        type: String,
        required: true,
        enum: ['chairman', 'secretary', 'principal', 'treasurer', 'member',]
    },
    session: { type: String, required: true },
    phoneNumber: String,
    address: String,
    religion: String,
    photo: String,
    quote: { type: String, required: false }, //new added
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Optional: Add this single middleware to clean up quotes for non-allowed roles
// committeeSchema.pre('save', function (next) {
//     const quoteAllowedDesignations = ['chairman', 'secretary', 'principal'];

//     // Automatically clear quote if designation doesn't allow it
//     if (!quoteAllowedDesignations.includes(this.designation)) {
//         this.quote = '';
//     }

//     next();
// });

// committeeSchema.pre('findOneAndUpdate', function (next) {
//     const update = this.getUpdate();
//     const quoteAllowedDesignations = ['chairman', 'secretary', 'principal'];

//     // If designation is being updated to non-quote role, clear quote
//     if (update.designation && !quoteAllowedDesignations.includes(update.designation)) {
//         update.quote = '';
//     }

//     next();
// });

module.exports = mongoose.model('SchoolManagementCommittee', committeeSchema);