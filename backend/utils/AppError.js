const { validationResult } = require('express-validator');

// utils/AppError.js
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}


// utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};


// utils/responseHandler.js
const sendSuccess = (res, data, statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        ...data
    });
};

const sendError = (res, error, statusCode = 500) => {
    res.status(statusCode).json({
        success: false,
        error: {
            message: error.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }
    });
};


// middleware/validation.middleware.js

const validateRequest = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    };
};

module.exports = { AppError, sendSuccess, sendError, asyncHandler, validateRequest };
