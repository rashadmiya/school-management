// routes/ledgerRoutes.js
const express = require('express');
const router = express.Router();
const LedgerController = require('../LedgerController');
const { isAuthenticated, authorizeRoles, isStudentAuthenticated } = require('../../middleware/auth');
const { param } = require('express-validator');
const { isAnyAuthenticated } = require('../../middleware/anyAuth');

// Student Ledger
router.get('/:studentId',
    isAnyAuthenticated,
    param('studentId').isMongoId(),
    LedgerController.getStudentLedger
);

router.get('/:studentId/validate',
    isAnyAuthenticated,
    param('studentId').isMongoId(),
    LedgerController.validateLedger
);

router.get('/:studentId/balance',
    isAnyAuthenticated,
    param('studentId').isMongoId(),
    LedgerController.getCurrentBalance
);

module.exports = router;