// StudentLedger.js
const mongoose = require('mongoose');

const studentLedgerSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    session: {
        type: String,
        required: true
    },
    transactionType: {
        type: String,
        enum: ['fee_charge', 'payment', 'adjustment', 'discount', 'waiver'],
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    referenceModel: {
        type: String,
        enum: ['Fee', 'Payment', 'FeeStructure'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    debit: {
        type: Number,
        default: 0,
        min: 0
    },
    credit: {
        type: Number,
        default: 0,
        min: 0
    },
    balance: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    remarks: String,
    status: {
        type: String,
        enum: ['active', 'cancelled'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Indexes
studentLedgerSchema.index({ student: 1, session: 1, date: 1 });
studentLedgerSchema.index({ class: 1, session: 1 });
studentLedgerSchema.index({ transactionType: 1, date: 1 });
studentLedgerSchema.index({ referenceId: 1, referenceModel: 1 });

module.exports = mongoose.model('StudentLedger', studentLedgerSchema);

// const mongoose = require('mongoose');
// const studentLedgerSchema = new mongoose.Schema({
//     student: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Student',
//         required: true
//     },
//     class: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Class',
//         required: true
//     },
//     academicYear: {
//         type: String,
//         required: true
//     },
//     session: {
//         type: String,
//         required: true
//     },
//     transactionType: {
//         type: String,
//         enum: ['fee_charged', 'payment', 'adjustment', 'discount', 'waiver'],
//         required: true
//     },
//     fee: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Fee'
//     },
//     payment: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Payment'
//     },
//     description: {
//         type: String,
//         required: true
//     },
//     debit: {
//         type: Number,
//         default: 0
//     },
//     credit: {
//         type: Number,
//         default: 0
//     },
//     balance: {
//         type: Number,
//         default: 0
//     },
//     date: {
//         type: Date,
//         default: Date.now
//     },
//     createdBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User'
//     },
//     remarks: String
// }, {
//     timestamps: true
// });

// // Pre-save middleware to calculate balance
// studentLedgerSchema.pre('save', async function(next) {
//     try {
//         // Get last balance for this student in this academic year
//         const lastEntry = await this.constructor.findOne(
//             {
//                 student: this.student,
//                 academicYear: this.academicYear
//             },
//             {},
//             { sort: { date: -1, createdAt: -1 } }
//         );
        
//         const lastBalance = lastEntry ? lastEntry.balance : 0;
//         this.balance = lastBalance + this.debit - this.credit;
//         next();
//     } catch (error) {
//         next(error);
//     }
// });

// // Indexes for better query performance
// studentLedgerSchema.index({ student: 1, academicYear: 1, date: 1 });
// studentLedgerSchema.index({ class: 1, academicYear: 1 });
// studentLedgerSchema.index({ transactionType: 1 });
// studentLedgerSchema.index({ fee: 1 });
// studentLedgerSchema.index({ payment: 1 });

// module.exports = mongoose.model('StudentLedger', studentLedgerSchema);