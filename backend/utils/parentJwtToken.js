// utils/parentJwtToken.js
const jwt = require('jsonwebtoken');

const PARENT_SECRET = process.env.PARENT_JWT_SECRET;
if (!PARENT_SECRET) {
    throw new Error('PARENT_JWT_SECRET env variable is required');
}

const sendParentToken = (parent, statusCode, res, extra = {}) => {
    const token = jwt.sign(
        { parentId: parent._id, type: 'parent' },
        PARENT_SECRET,
        { expiresIn: process.env.PARENT_JWT_EXPIRES || '30d' }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
    };

    const safe = parent.toObject ? parent.toObject() : parent;
    delete safe.pin;
    delete safe.otpHash;

    res.status(statusCode)
        .cookie('parent_token', token, options)
        .json({ success: true, token, parent: safe, ...extra });
};

module.exports = sendParentToken;