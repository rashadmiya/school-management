// models/NotificationPreference.js
const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    // Channel toggles
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: true },
    inAppEnabled: { type: Boolean, default: true },

    // Per-type toggles
    // preferences: {
    //     payment_received: { email: Boolean, sms: Boolean, in_app: Boolean },
    //     fee_created: { email: Boolean, sms: Boolean, in_app: Boolean },
    //     fee_due_soon: { email: Boolean, sms: Boolean, in_app: Boolean },
    //     fee_overdue: { email: Boolean, sms: Boolean, in_app: Boolean },
    //     waiver_requested: { email: Boolean, sms: Boolean, in_app: Boolean },
    //     waiver_approved: { email: Boolean, sms: Boolean, in_app: Boolean },
    //     refund_processed: { email: Boolean, sms: Boolean, in_app: Boolean },
    //     daily_summary: { email: Boolean, sms: Boolean, in_app: Boolean },
    // },

    preferences: {
    payment_received: { email: Boolean, sms: Boolean, in_app: Boolean },
    fee_created:      { email: Boolean, sms: Boolean, in_app: Boolean },
    fee_due_soon:     { email: Boolean, sms: Boolean, in_app: Boolean },
    fee_overdue:      { email: Boolean, sms: Boolean, in_app: Boolean },
    waiver_requested: { email: Boolean, sms: Boolean, in_app: Boolean },
    waiver_approved:  { email: Boolean, sms: Boolean, in_app: Boolean },
    waiver_rejected:  { email: Boolean, sms: Boolean, in_app: Boolean },  // ← add
    refund_processed: { email: Boolean, sms: Boolean, in_app: Boolean },
    advance_credited: { email: Boolean, sms: Boolean, in_app: Boolean },  // ← add
    daily_summary:    { email: Boolean, sms: Boolean, in_app: Boolean },
},

    quietHoursStart: { type: String, default: '21:00' }, // no SMS after this
    quietHoursEnd: { type: String, default: '07:00' },
}, { timestamps: true });

module.exports = mongoose.model('NotificationPreference', preferenceSchema);