// workers/notificationWorker.js
require('dotenv').config();
const { Worker } = require('bullmq');
const queueConfig = require('../../config/queue');
const NotificationService = require('../services/NotificationService');
const logger = require('../../utils/logger');

// Wait a short moment for the probe to finish
setTimeout(() => {
    if (!queueConfig.isQueueEnabled()) {
        logger.warn('[worker] Redis is not available — worker exiting (inline mode will be used by API)');
        process.exit(0);
    }

    const worker = new Worker('notifications', async (job) => {
        const { name, data } = job;
        if (name === 'email') {
            await NotificationService.sendEmail(data);
        } else if (name === 'sms') {
            await NotificationService.sendSms(data);
        } else {
            throw new Error(`Unknown job type: ${name}`);
        }
    }, {
        connection: queueConfig.connection,
        concurrency: 5,
    });

    worker.on('completed', (job) => {
        logger.debug(`[worker] job ${job.id} (${job.name}) completed`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`[worker] job ${job?.id} (${job?.name}) failed`, err);
    });

    logger.info('[worker] Notification worker started');
}, 1500);