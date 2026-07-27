// routes/waiverRoutes.js
const express = require('express');
const router = express.Router();
const WaiverController = require('../WaiverController');
const { body, param, query } = require('express-validator');
const { isAuthenticated, authorizeRoles, isStudentAuthenticated } = require('../../middleware/auth');

// Waiver Requests
router.post('/request',
    isAuthenticated,
    [
        body('feeInstanceId').isMongoId(),
        body('type').isIn(['full', 'partial', 'scholarship', 'staff_discount', 'sibling_discount']),
        body('reason').notEmpty().trim(),
        body('amount').optional().isFloat({ min: 0 }),
        body('percentage').optional().isFloat({ min: 0, max: 100 })
    ],
    WaiverController.requestWaiver
);

router.get('/',
    isAuthenticated,
    WaiverController.getWaiverRequests
);

router.get('/eligible/:feeInstanceId',
    isAuthenticated,
    param('feeInstanceId').isMongoId(),
    WaiverController.getEligibleWaiver
);

// Waiver Approval/Rejection (Admin only)
router.post('/:id/approve',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    param('id').isMongoId(),
    WaiverController.approveWaiver
);

router.post('/:id/reject',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    param('id').isMongoId(),
    [
        body('reason').notEmpty().trim()
    ],
    WaiverController.rejectWaiver
);

router.post('/:id/revoke',
    isAuthenticated,
    authorizeRoles('admin', 'accountant'),
    param('id').isMongoId(),
    [
        body('reason').notEmpty().trim()
    ],
    WaiverController.revokeWaiver
);

module.exports = router;