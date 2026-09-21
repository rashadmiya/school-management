// cron/expirePaymentIntents.js
const cron = require('node-cron');
const PaymentIntentService = require('../services/PaymentIntentService');
const logger = require('../utils/logger');

/**
 * Runs every 5 minutes. Marks any pending/processing intent whose
 * expiresAt is in the past as 'expired'.
 *
 * This is safe to run against a busy system:
 *   - updateMany is atomic
 *   - only touches non-terminal states
 *   - does not delete — history preserved for audit
 */
function startExpirePaymentIntentsJob() {
    // minute 0,5,10,15,20,...  every hour
    cron.schedule('*/5 * * * *', async () => {
        try {
            const result = await PaymentIntentService.expireStaleIntents();
            if (result.modifiedCount > 0) {
                logger.info(
                    `[cron] expired ${result.modifiedCount} stale payment intent(s)`
                );
            }
        } catch (err) {
            logger.error('[cron] expirePaymentIntents failed', err);
        }
    });

    logger.info('[cron] expirePaymentIntents scheduled (*/5 * * * *)');
}

module.exports = { startExpirePaymentIntentsJob };

// in app.js ...after DB connects and the server starts listening...

// startExpirePaymentIntentsJob();