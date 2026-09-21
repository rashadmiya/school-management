// controllers/parentAuthRoutes.js
const express = require('express');
const router = express.Router();
// const ctrl = require('../controllers/parentAuthController');
const { isParentAuthenticated } = require('../middleware/parentAuth');
const Parent = require('../models/Parent');
const sendParentToken = require('../utils/parentJwtToken');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');

router.post('/login', catchAsyncErrors(async (req, res, next) => {
    const { phone, pin } = req.body;
    if (!phone || !pin) return next(new ErrorHandler('Phone and PIN are required', 400));

    const parent = await Parent.findByPhone(phone).select('+pin');
    if (!parent || !parent.isActive) {
        return next(new ErrorHandler('Invalid credentials', 401));
    }
    if (!parent.pin) {
        return next(new ErrorHandler('Account not activated. Contact the school office.', 401));
    }

    const ok = await parent.comparePin(pin);
    if (!ok) return next(new ErrorHandler('Invalid credentials', 401));

    parent.lastLogin = new Date();
    await parent.save();

    return sendParentToken(parent, 200, res, {
        mustChangePin: parent.pinIsTemp,
    });
}));


router.post('/change-pin', isParentAuthenticated, catchAsyncErrors(async (req, res, next) => {
    const { currentPin, newPin } = req.body;
    if (!currentPin || !newPin) {
        return next(new ErrorHandler('currentPin and newPin are required', 400));
    }
    if (!/^\d{4,6}$/.test(String(newPin))) {
        return next(new ErrorHandler('PIN must be 4–6 digits', 400));
    }

    const parent = await Parent.findById(req.parent._id).select('+pin');
    if (!parent) return next(new ErrorHandler('Parent not found', 404));

    const ok = await parent.comparePin(currentPin);
    if (!ok) return next(new ErrorHandler('Current PIN is incorrect', 401));

    await parent.setPin(newPin);
    await parent.save();

    res.json({ success: true, message: 'PIN updated' });
}));

router.get('/me', isParentAuthenticated, catchAsyncErrors(async (req, res) => {
    const parent = await Parent.findById(req.parent._id)
        .select('-pin -otpHash')
        .populate({
            path: 'children',
            select: 'name rollNumber class gender photo',
            populate: { path: 'class', select: 'name section' },
        })
        .lean();
    res.json({ success: true, parent });
}));

router.post('/logout', catchAsyncErrors(async (req, res) => {
    res
        .cookie('parent_token', '', { expires: new Date(0), httpOnly: true })
        .json({ success: true, message: 'Logged out' });
}));

module.exports = router;