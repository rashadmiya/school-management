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

// // workers/notificationWorker.js
// // run guide
// // node workers/notificationWorker.js

// // "scripts": {
// //   "worker": "node workers/notificationWorker.js"
// // }

// require('dotenv').config();
// const { Worker } = require('bullmq');
// const fs = require('fs');
// const path = require('path');
// const Handlebars = require('handlebars');
// const { connection } = require('../../config/queue');
// const transporter = require('../../config/mail');
// const sms = require('../../config/sms');
// const Notification = require('../models/Notification');
// const logger = require('../../utils/logger');

// // Precompile templates
// const TEMPLATE_DIR = path.join(__dirname, '..', 'templates');
// function renderTemplate(name, context) {
//     const filePath = path.join(TEMPLATE_DIR, `${name}.hbs`);
//     const source = fs.readFileSync(filePath, 'utf8');
//     const template = Handlebars.compile(source);
//     return template(context);
// }

// const worker = new Worker('notifications', async (job) => {
//     const { name, data } = job;
//     const notification = await Notification.findById(data.notificationId);
//     if (!notification) return;

//     notification.status = 'sending';
//     notification.attempts += 1;
//     await notification.save();

//     try {
//         if (name === 'email') {
//             const html = renderTemplate(data.template, data.context);
//             await transporter.sendMail({
//                 from: process.env.SMTP_FROM || 'no-reply@school.example',
//                 to: data.to,
//                 subject: data.subject,
//                 html,
//             });
//         } else if (name === 'sms') {
//             if (sms.client) {
//                 await sms.client.messages.create({
//                     from: sms.from,
//                     to: data.to,
//                     body: data.body,
//                 });
//             } else {
//                 logger.warn(`SMS not configured, skipping to ${data.to}`);
//             }
//         }

//         notification.status = 'sent';
//         notification.sentAt = new Date();
//         await notification.save();
//     } catch (err) {
//         notification.status = 'failed';
//         notification.lastError = err.message;
//         await notification.save();
//         throw err; // let BullMQ retry
//     }
// }, {
//     connection,
//     concurrency: 5,
// });

// worker.on('failed', (job, err) => {
//     logger.error(`Notification job ${job.id} failed:`, err.message);
// });

// logger.info('Notification worker started');