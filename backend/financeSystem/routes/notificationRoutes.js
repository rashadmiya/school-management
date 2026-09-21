// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const { isAuthenticated } = require('../../middleware/auth');
const { isParentAuthenticated } = require('../../middleware/parentAuth');
const catchAsyncErrors = require('../../middleware/catchAsyncErrors');

// Get my preferences
router.get('/preferences', isAuthenticated, catchAsyncErrors(async (req, res) => {
    const pref = await NotificationPreference.findOneAndUpdate(
        { user: req.user._id },
        { $setOnInsert: { user: req.user._id } },
        { upsert: true, new: true }
    );
    res.json({ success: true, data: pref });
}));

// Update my preferences
router.put('/preferences', isAuthenticated, catchAsyncErrors(async (req, res) => {
    const pref = await NotificationPreference.findOneAndUpdate(
        { user: req.user._id },
        { $set: req.body },
        { upsert: true, new: true }
    );
    res.json({ success: true, data: pref });
}));

// In-app notifications
router.get('/', isAuthenticated, catchAsyncErrors(async (req, res) => {
    const { unreadOnly = false, limit = 30 } = req.query;
    const query = { user: req.user._id, channel: 'in_app' };
    if (unreadOnly === 'true') query.readAt = null;
    const list = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .lean();
    res.json({ success: true, data: list });
}));

router.post('/:id/read', isAuthenticated, catchAsyncErrors(async (req, res) => {
    await Notification.updateOne(
        { _id: req.params.id, user: req.user._id },
        { $set: { readAt: new Date() } }
    );
    res.json({ success: true });
}));

/* ---------- Parent notifications ---------- */
router.get('/parent',
    isParentAuthenticated,
    catchAsyncErrors(async (req, res) => {
        const { unreadOnly = false, limit = 30 } = req.query;
        const query = {
            parent: req.parent._id,
            channel: 'in_app',
        };
        if (unreadOnly === 'true') query.readAt = null;

        const list = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit, 10))
            .populate('student', 'name rollNumber')
            .lean();

        res.json({ success: true, data: list });
    })
);

router.post('/parent/:id/read',
    isParentAuthenticated,
    catchAsyncErrors(async (req, res) => {
        await Notification.updateOne(
            { _id: req.params.id, parent: req.parent._id },
            { $set: { readAt: new Date() } }
        );
        res.json({ success: true });
    })
);

module.exports = router;
