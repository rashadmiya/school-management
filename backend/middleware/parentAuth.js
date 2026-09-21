// middleware/parentAuth.js
const jwt = require('jsonwebtoken');
const Parent = require('../models/Parent');
const ErrorHandler = require('../utils/ErrorHandler');

exports.isParentAuthenticated = async (req, res, next) => {
    const token = req.cookies.parent_token;
    if (!token) return next(new ErrorHandler('Please log in', 401));

    try {
        const decoded = jwt.verify(token, process.env.PARENT_JWT_SECRET);
        if (decoded.type !== 'parent') {
            return next(new ErrorHandler('Invalid session', 401));
        }

        const parent = await Parent.findById(decoded.parentId)
            .populate({
                path: 'children',
                select: 'name rollNumber class gender photo isActive session',
                populate: { path: 'class', select: 'name section' },
            })
            .lean();

        if (!parent || !parent.isActive) {
            return next(new ErrorHandler('Account disabled', 401));
        }

        req.parent = parent;
        req.token = token;
        next();
    } catch (err) {
        return next(new ErrorHandler('Not authorized', 401));
    }
};

/** Guard that blocks any action until the parent has replaced their temp PIN. */
exports.requirePinChanged = (req, res, next) => {
    if (req.parent.pinIsTemp) {
        return next(new ErrorHandler(
            'Please change your temporary PIN before continuing', 403
        ));
    }
    next();
};

// // middleware/parentAuth.js
// const jwt = require('jsonwebtoken');
// const Parent = require('../models/Parent');
// const ErrorHandler = require('../utils/ErrorHandler');

// exports.isParentAuthenticated = async (req, res, next) => {
//     const token = req.cookies.parent_token;
//     if (!token) return next(new ErrorHandler('Please log in', 401));

//     try {
//         const decoded = jwt.verify(token, process.env.PARENT_JWT_SECRET);
//         if (decoded.type !== 'parent') return next(new ErrorHandler('Invalid session', 401));

//         const parent = await Parent.findById(decoded.parentId)
//             .populate({ path: 'children', populate: { path: 'class', select: 'name section' } })
//             .lean();
//         if (!parent || !parent.isActive) return next(new ErrorHandler('Account disabled', 401));

//         req.parent = parent;
//         next();
//     } catch {
//         return next(new ErrorHandler('Not authorized', 401));
//     }
// };