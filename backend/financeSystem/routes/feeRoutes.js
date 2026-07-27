
const express = require('express');
const router = express.Router();
const FeeController = require('../FeeController');
const { body, param } = require('express-validator');
const { isAuthenticated, authorizeRoles, isStudentAuthenticated } = require('../../middleware/auth');
const { isAnyAuthenticated } = require('../../middleware/anyAuth');

// Fee Templates
router.post('/templates',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    [
        body('title').notEmpty().trim(),
        body('amount').isFloat({ min: 0 }),
        body('appliesTo.scope').isIn(['all', 'class', 'section', 'individual']),
        body('session').optional().isString()
    ],
    FeeController.createTemplate
);

router.get('/templates',
    isAuthenticated,
    FeeController.getFeeTemplates
);

router.post('/templates/:id/apply',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    param('id').isMongoId(),
    FeeController.applyFee
);

// Student Fees
router.get('/student/:studentId',
    isAnyAuthenticated,
    param('studentId').isMongoId(),
    FeeController.getStudentFees
);

router.get('/student/:studentId/summary',
    isAnyAuthenticated,
    param('studentId').isMongoId(),
    FeeController.getFeeSummary
);

// Fee Instances
router.put('/instances/:id',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    param('id').isMongoId(),
    FeeController.updateFeeInstance
);

// Add to routes:
// Add these routes before module.exports
router.get('/templates/:id/eligible-students',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    param('id').isMongoId(),
    FeeController.getEligibleStudents
);

router.get('/current-session',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    FeeController.getCurrentSession
);

router.post('/set-session',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    [
        body('session').matches(/^\d{4}-\d{4}$/).withMessage('Invalid session format')
    ],
    FeeController.setCurrentSession
);

module.exports = router;