// config/sms.js
const twilio = require('twilio');

const client = process.env.TWILIO_ACCOUNT_SID
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

module.exports = {
    client,
    from: process.env.TWILIO_FROM || '',
};