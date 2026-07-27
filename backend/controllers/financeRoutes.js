// routes/financeRoutes.js
const express = require('express');
const router = express.Router();

// Mount the sub-routers
router.use('/fee', require('../financeSystem/routes/feeRoutes'));
router.use('/ledger', require('../financeSystem/routes/ledgerRoutes'));
router.use('/payment', require('../financeSystem/routes/paymentRoutes'));
router.use('/refund', require('../financeSystem/routes/refundRoutes'));
router.use('/waiver', require('../financeSystem/routes/waiverRoutes'));

// Optional: Add a simple root endpoint for testing/health check
// router.get('/', (req, res) => res.json({ message: 'Finance module active' }));

module.exports = router;