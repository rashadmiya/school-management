// Expense Schema

const mongoose = require('mongoose');
const expenseSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ['salary', 'utilities', 'maintenance', 'academic', 'transport', 'food', 'other'],
        required: true
    },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'online', 'cheque', 'card'],
        required: true
    },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receipt: String, // file path or URL
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);