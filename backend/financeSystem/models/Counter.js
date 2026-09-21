// models/Counter.js
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },  // e.g. "receipt_2025-2026"
    seq: { type: Number, default: 0 },
}, { timestamps: true });

counterSchema.statics.getNext = async function (key, session = null) {
    const opts = {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
    };
    if (session) opts.session = session;

    const doc = await this.findByIdAndUpdate(
        key,
        { $inc: { seq: 1 } },
        opts
    );
    return doc.seq;
};

counterSchema.statics.peek = async function (key) {
    const doc = await this.findById(key);
    return doc ? doc.seq : 0;
};

module.exports = mongoose.model('Counter', counterSchema);