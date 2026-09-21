// cron/paymentIntentCleanup.js
const cron = require('node-cron');
const PaymentIntentService = require('../services/PaymentIntentService');
const logger = require('../utils/logger');

function startPaymentIntentCleanup() {
    // Every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            const result = await PaymentIntentService.expireStaleIntents();
            if (result.modifiedCount > 0) {
                logger.info(`Expired ${result.modifiedCount} stale payment intents`);
            }
        } catch (err) {
            logger.error('Payment intent cleanup failed', err);
        }
    });
}

module.exports = { startPaymentIntentCleanup };

//Call startPaymentIntentCleanup() in your server.js after DB connection.