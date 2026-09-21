// controllers/parentAdminRoutes.js
const express = require('express');
const router = express.Router();
const ParentService = require('../services/ParentService');
const Parent = require('../models/Parent');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/ErrorHandler');

router.get('/search', isAuthenticated, authorizeRoles('admin', 'accountant', 'teacher'),
    catchAsyncErrors(async (req, res) => {
        const list = await ParentService.search(req.query.q || '', 20);
        res.json({ success: true, data: list });
    }));

router.get('/', isAuthenticated, authorizeRoles('admin', 'accountant', 'teacher'),
    catchAsyncErrors(async (req, res) => {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        const [total, list] = await Promise.all([
            Parent.countDocuments(),
            Parent.find()
                .populate('children', 'name rollNumber class')
                .sort({ createdAt: -1 })
                .skip(skip).limit(Number(limit)).lean(),
        ]);
        res.json({ success: true, data: list, total, page: Number(page),
                   pages: Math.ceil(total / limit) });
    }));

router.get('/:id', isAuthenticated, authorizeRoles('admin', 'accountant', 'teacher'),
    catchAsyncErrors(async (req, res) => {
        const p = await Parent.findById(req.params.id)
            .populate('children', 'name rollNumber class').lean();
        if (!p) throw new ErrorHandler('Parent not found', 404);
        res.json({ success: true, data: p });
    }));

router.delete('/:id', isAuthenticated, authorizeRoles('admin'),
    catchAsyncErrors(async (req, res) => {
        const p = await Parent.findById(req.params.id);
        if (!p) throw new ErrorHandler('Parent not found', 404);
        await require('../models/Student').updateMany(
            { _id: { $in: p.children } }, { $unset: { parent: '' } });
        await p.deleteOne();
        res.json({ success: true, message: 'Parent deleted' });
    }));

/** Admin-only: regenerate a temp PIN (e.g. parent forgot) */
router.post('/:id/reset-pin', isAuthenticated, authorizeRoles('admin'),
    catchAsyncErrors(async (req, res) => {
        const bcrypt = require('bcryptjs');
        const p = await Parent.findById(req.params.id);
        if (!p) throw new ErrorHandler('Parent not found', 404);

        const tempPin = Parent.generateTempPin();
        p.pin = await bcrypt.hash(tempPin, 10);
        p.pinIsTemp = true;
        await p.save();

        res.json({ success: true, tempPin }); // show to admin once
    }));

module.exports = router;