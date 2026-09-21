// utils/receiptToken.js
const jwt = require('jsonwebtoken');

function signReceiptToken(paymentId) {
    return jwt.sign(
        { pid: paymentId },
        process.env.RECEIPT_SECRET || 'change-me',
        { expiresIn: '365d' }
    );
}

function verifyReceiptToken(token) {
    return jwt.verify(token, process.env.RECEIPT_SECRET || 'change-me');
}

module.exports = { signReceiptToken, verifyReceiptToken };