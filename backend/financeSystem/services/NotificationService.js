// services/NotificationService.js
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const queueConfig = require('../../config/queue');
const transporter = require('../../config/mail');
const sms = require('../../config/sms');
const logger = require('../../utils/logger');

// Cache compiled templates
const TEMPLATE_DIR = path.join(__dirname, '..', 'templates');

const templateCache = new Map();

// function renderTemplate(name, context) {
//     if (templateCache.has(name)) {
//         return templateCache.get(name)(context);
//     }
//     const filePath = path.join(TEMPLATE_DIR, `${name}.hbs`);
//     const source = fs.readFileSync(filePath, 'utf8');
//     const compiled = Handlebars.compile(source);
//     templateCache.set(name, compiled);
//     return compiled(context);
// }

function renderTemplate(name, context) {
    if (templateCache.has(name)) {
        return templateCache.get(name)(context);
    }
    try {
        const filePath = path.join(TEMPLATE_DIR, `${name}.hbs`);
        const source = fs.readFileSync(filePath, 'utf8');
        const compiled = Handlebars.compile(source);
        templateCache.set(name, compiled);
        return compiled(context);
    } catch (err) {
        logger.warn(`[notification] template "${name}" missing — using plain fallback`, {
            templateDir: TEMPLATE_DIR,
            error: err.message,
        });
        // Plaintext fallback keeps the notification from failing entirely
        return `<p>${context.body || context.message || 'You have a new notification.'}</p>`;
    }
}

class NotificationService {
    /**
     * Send email now (used by worker and by inline fallback).
     */
    static async sendEmail({ notificationId, to, subject, template, context }) {
        const notification = await Notification.findById(notificationId);
        if (!notification) return;

        notification.status = 'sending';
        notification.attempts += 1;
        await notification.save();

        try {
            const html = renderTemplate(template, context);
            await transporter.sendMail({
                from: process.env.SMTP_FROM || 'no-reply@school.example',
                to,
                subject,
                html,
            });
            notification.status = 'sent';
            notification.sentAt = new Date();
            await notification.save();
        } catch (err) {
            notification.status = 'failed';
            notification.lastError = err.message;
            await notification.save();
            throw err;
        }
    }

    /**
     * Send SMS now (used by worker and by inline fallback).
     */
    static async sendSms({ notificationId, to, body }) {
        const notification = await Notification.findById(notificationId);
        if (!notification) return;

        notification.status = 'sending';
        notification.attempts += 1;
        await notification.save();

        try {
            if (sms.client) {
                await sms.client.messages.create({
                    from: sms.from,
                    to,
                    body,
                });
            } else {
                logger.warn('[notification] SMS not configured, skipping', { to });
            }
            notification.status = 'sent';
            notification.sentAt = new Date();
            await notification.save();
        } catch (err) {
            notification.status = 'failed';
            notification.lastError = err.message;
            await notification.save();
            throw err;
        }
    }

    /**
     * Enqueue or run a job. If queue is unavailable, run inline.
     */
    static async dispatch(jobName, payload, options = {}) {
        if (queueConfig.isQueueEnabled()) {
            try {
                await queueConfig.notificationsQueue.add(jobName, payload, options);
                return;
            } catch (err) {
                logger.warn('[notification] enqueue failed, falling back to inline', { error: err.message });
            }
        }

        // Inline fallback
        try {
            if (jobName === 'email') {
                await this.sendEmail(payload);
            } else if (jobName === 'sms') {
                await this.sendSms(payload);
            }
        } catch (err) {
            logger.error('[notification] inline send failed', err);
        }
    }

    // ---------- Queue helpers ----------

    static async queueEmail({ to, subject, template, context, user, student, ref }) {
        if (!(await this.shouldSend(user, context.type, 'email'))) return null;

        const notification = await Notification.create({
            user,
            student,
            type: context.type,
            channel: 'email',
            recipient: to,
            subject,
            status: 'queued',
            refModel: ref?.model,
            refId: ref?.id,
            metadata: { template, context },
        });

        await this.dispatch('email', {
            notificationId: notification._id.toString(),
            to,
            subject,
            template,
            context,
        });

        return notification;
    }

    static async queueSms({ to, body, user, student, type, ref }) {
        if (!(await this.shouldSend(user, type, 'sms'))) return null;

        const notification = await Notification.create({
            user,
            student,
            type,
            channel: 'sms',
            recipient: to,
            body,
            status: 'queued',
            refModel: ref?.model,
            refId: ref?.id,
        });

        await this.dispatch('sms', {
            notificationId: notification._id.toString(),
            to,
            body,
        });

        return notification;
    }

    static async inApp({ user, student, type, body, ref }) {
        if (!(await this.shouldSend(user, type, 'in_app'))) return null;

        return Notification.create({
            user,
            student,
            parent,
            type,
            channel: 'in_app',
            body,
            status: 'sent',
            sentAt: new Date(),
            refModel: ref?.model,
            refId: ref?.id,
        });
    }

    // ---------- High-level helpers ----------

    static async notifyPaymentReceived({ payment, summary, receiptUrl }) {
        const context = buildPaymentContext(payment, summary, receiptUrl);

        const tasks = [];

        tasks.push(this.inApp({
            user: payment.receivedBy,
            student: payment.student,
            type: 'payment_received',
            body: `Payment of ${context.amountFormatted} received from ${context.studentName}.`,
            ref: { model: 'Payment', id: payment._id },
        }));

        if (context.parentEmail) {
            tasks.push(this.queueEmail({
                to: context.parentEmail,
                subject: `Payment received - ${context.receiptNumber}`,
                template: 'payment_received',
                context,
                user: null,
                student: payment.student,
                ref: { model: 'Payment', id: payment._id },
            }));
        }

        if (context.parentPhone) {
            const smsBody =
                `Payment of ${context.currency} ${context.amount} received for ` +
                `${context.studentName}. Receipt: ${context.receiptNumber}. ` +
                `Due: ${context.currency} ${context.due}.`;
            tasks.push(this.queueSms({
                to: context.parentPhone,
                body: smsBody,
                user: null,
                student: payment.student,
                type: 'payment_received',
                ref: { model: 'Payment', id: payment._id },
            }));
        }

        await Promise.allSettled(tasks);
    }

    static async notifyFeeDueSoon({ feeInstance, student, parent, daysLeft }) {
        const context = buildFeeContext(feeInstance, student, parent, daysLeft);

        const tasks = [];

        if (context.parentEmail) {
            tasks.push(this.queueEmail({
                to: context.parentEmail,
                subject: `Fee due in ${daysLeft} day(s) - ${context.title}`,
                template: 'fee_due_soon',
                context,
                student: student._id,
                ref: { model: 'FeeInstance', id: feeInstance._id },
            }));
        }

        if (context.parentPhone) {
            tasks.push(this.queueSms({
                to: context.parentPhone,
                body: `${context.currency} ${context.due} for "${context.title}" is due on ${context.dueDate} (${daysLeft} day(s) left).`,
                student: student._id,
                type: 'fee_due_soon',
                ref: { model: 'FeeInstance', id: feeInstance._id },
            }));
        }

        await Promise.allSettled(tasks);
    }

    static async notifyWaiverApproved({ waiver, student, parent, feeInstance }) {
        const type = 'waiver_approved';
        const amount = waiver.amount?.toString?.() ?? String(waiver.amount || 0);
        const feeTitle = feeInstance?.title || 'fee';
        const body = `Waiver of ৳${amount} approved for ${student?.name || 'your child'}'s ${feeTitle}.`;

        const tasks = [];

        // Parent in-app — only if we have a parent record
        if (parent?._id) {
            tasks.push(this.inApp({
                parent: parent._id,
                student: student?._id,
                type,
                body,
                ref: { model: 'FeeWaiver', id: waiver._id },
            }));
        }

        // Parent email
        if (parent?.email) {
            tasks.push(this.queueEmail({
                to: parent.email,
                subject: `Waiver approved — ${feeTitle}`,
                template: 'waiver_approved',
                context: {
                    type,
                    studentName: student?.name,
                    parentName: parent?.name,
                    feeTitle,
                    amount,
                    reason: waiver.reason,
                    approvedDate: waiver.approvedDate,
                    body,
                },
                user: null,
                student: student?._id,
                ref: { model: 'FeeWaiver', id: waiver._id },
            }));
        }

        // Parent SMS
        if (parent?.phone) {
            tasks.push(this.queueSms({
                to: parent.phone,
                body: `Waiver of BDT ${amount} approved for ${student?.name}'s ${feeTitle}.`,
                user: null,
                student: student?._id,
                type,
                ref: { model: 'FeeWaiver', id: waiver._id },
            }));
        }

        await Promise.allSettled(tasks);
    }

    static async notifyWaiverRejected({ waiver, student, parent, reason }) {
        const type = 'waiver_rejected';
        const body = `Waiver request for ${student?.name || 'your child'} was rejected.`;

        const tasks = [];

        if (parent?._id) {
            tasks.push(this.inApp({
                parent: parent._id,
                student: student?._id,
                type,
                body,
                ref: { model: 'FeeWaiver', id: waiver._id },
            }));
        }

        if (parent?.phone) {
            tasks.push(this.queueSms({
                to: parent.phone,
                body: `${body} Reason: ${reason || 'Not provided'}.`,
                user: null,
                student: student?._id,
                type,
                ref: { model: 'FeeWaiver', id: waiver._id },
            }));
        }

        await Promise.allSettled(tasks);
    }

    static async notifyRefundProcessed({ refund, student, parent, payment }) {
        const type = 'refund_processed';
        const amount = refund.amount?.toString?.() ?? String(refund.amount || 0);
        const body = `Refund of ৳${amount} processed for ${student?.name || 'your child'}.`;

        const tasks = [];

        if (parent?._id) {
            tasks.push(this.inApp({
                parent: parent._id,
                student: student?._id,
                type,
                body,
                ref: { model: 'Refund', id: refund._id },
            }));
        }

        if (parent?.email) {
            tasks.push(this.queueEmail({
                to: parent.email,
                subject: `Refund processed — ${refund.refundNumber || ''}`,
                template: 'refund_processed',
                context: {
                    type,
                    studentName: student?.name,
                    parentName: parent?.name,
                    refundNumber: refund.refundNumber,
                    amount,
                    method: refund.method,
                    reason: refund.reason,
                    processedAt: refund.processedAt,
                    body,
                },
                user: null,
                student: student?._id,
                ref: { model: 'Refund', id: refund._id },
            }));
        }

        if (parent?.phone) {
            tasks.push(this.queueSms({
                to: parent.phone,
                body: `Refund of BDT ${amount} processed for ${student?.name}.`,
                user: null,
                student: student?._id,
                type,
                ref: { model: 'Refund', id: refund._id },
            }));
        }

        await Promise.allSettled(tasks);
    }

    static async notifyFeeCreated({ feeInstance, student, parent }) {
        const type = 'fee_created';
        const body = `New fee: ${feeInstance.title} — ৳${feeInstance.totalAmount} due ${new Date(feeInstance.dueDate).toLocaleDateString('en-GB')}.`;

        const tasks = [];

        if (parent?._id) {
            tasks.push(this.inApp({
                parent: parent._id,
                student: student?._id,
                type,
                body,
                ref: { model: 'FeeInstance', id: feeInstance._id },
            }));
        }

        // SMS only for large or urgent fees — email covers the rest
        if (parent?.email) {
            tasks.push(this.queueEmail({
                to: parent.email,
                subject: `New fee: ${feeInstance.title}`,
                template: 'fee_created',
                context: {
                    type,
                    studentName: student?.name,
                    parentName: parent?.name,
                    title: feeInstance.title,
                    amount: feeInstance.totalAmount?.toString?.() ?? String(feeInstance.totalAmount),
                    dueDate: feeInstance.dueDate,
                    body,
                },
                user: null,
                student: student?._id,
                ref: { model: 'FeeInstance', id: feeInstance._id },
            }));
        }

        await Promise.allSettled(tasks);
    }


    static async shouldSend(userId, type, channel) {
        if (!userId) return true;

        const pref = await NotificationPreference.findOne({ user: userId }).lean();
        if (!pref) return true;

        if (channel === 'email' && !pref.emailEnabled) return false;
        if (channel === 'sms' && !pref.smsEnabled && this._inQuietHours(pref)) return false;
        if (channel === 'in_app' && !pref.inAppEnabled) return false;

        const perType = pref.preferences?.[type];
        if (perType && perType[channel] === false) return false;

        return true;
    }

    static _inQuietHours(pref) {
        if (!pref?.quietHoursStart || !pref?.quietHoursEnd) return false;
        const now = new Date();
        const [sh, sm] = pref.quietHoursStart.split(':').map(Number);
        const [eh, em] = pref.quietHoursEnd.split(':').map(Number);
        const mins = now.getHours() * 60 + now.getMinutes();
        const start = sh * 60 + sm;
        const end = eh * 60 + em;
        // overnight window (e.g., 21:00 → 07:00)
        if (start > end) return mins >= start || mins < end;
        return mins >= start && mins < end;
    }
}

// ---------- Context builders ----------

function buildPaymentContext(payment, summary, receiptUrl) {
    const { formatCurrency } = require('../utils/format');
    return {
        type: 'payment_received',
        receiptNumber: payment.receiptNumber,
        amount: payment.amount.toString(),
        amountFormatted: formatCurrency(payment.amount),
        currency: payment.currency || 'BDT',
        method: payment.method,
        dateFormatted: new Date(payment.createdAt).toDateString(),
        studentName: summary?.studentName || 'Student',
        parentName: summary?.parentName || 'Parent',
        parentEmail: summary?.parentEmail,
        parentPhone: summary?.parentPhone,
        due: summary?.dueBalance?.toString() || '0',
        dueFormatted: formatCurrency(summary?.dueBalance || 0),
        receiptUrl,
    };
}

function buildFeeContext(feeInstance, student, parent, daysLeft) {
    const { formatCurrency } = require('../utils/format');
    return {
        type: 'fee_due_soon',
        title: feeInstance.title,
        amount: feeInstance.totalAmount.toString(),
        due: feeInstance.dueAmount.toString(),
        dueFormatted: formatCurrency(feeInstance.dueAmount),
        currency: 'BDT',
        dueDate: feeInstance.dueDate.toDateString(),
        daysLeft,
        studentName: student.name,
        parentName: parent?.name,
        parentEmail: parent?.email,
        parentPhone: parent?.phone,
    };
}

module.exports = NotificationService;

// // services/NotificationService.js
// const Notification = require('../models/Notification');
// const NotificationPreference = require('../models/NotificationPreference');
// const { notificationsQueue } = require('../../config/queue');

// class NotificationService {
//     /**
//      * Queue an email.
//      */
//     static async queueEmail({ to, subject, template, context, user, student, ref }) {
//         if (!(await this.shouldSend(user, context.type, 'email'))) return null;
//         const notification = await Notification.create({
//             user, student,
//             type: context.type,
//             channel: 'email',
//             recipient: to,
//             subject,
//             status: 'queued',
//             refModel: ref?.model,
//             refId: ref?.id,
//             metadata: { template, context },
//         });

//         await notificationsQueue.add('email', {
//             notificationId: notification._id.toString(),
//             to, subject, template, context,
//         }, {
//             attempts: 3,
//             backoff: { type: 'exponential', delay: 5000 },
//             removeOnComplete: 100,
//             removeOnFail: 1000,
//         });

//         return notification;
//     }

//     /**
//      * Queue an SMS.
//      */
//     static async queueSms({ to, body, user, student, type, ref }) {
//         if (!(await this.shouldSend(user, type, 'sms'))) return null;
//         const notification = await Notification.create({
//             user, student,
//             type,
//             channel: 'sms',
//             recipient: to,
//             body,
//             status: 'queued',
//             refModel: ref?.model,
//             refId: ref?.id,
//         });

//         await notificationsQueue.add('sms', {
//             notificationId: notification._id.toString(),
//             to, body,
//         }, {
//             attempts: 3,
//             backoff: { type: 'exponential', delay: 5000 },
//         });

//         return notification;
//     }

//     /**
//      * In-app notification.
//      */
//     static async inApp({ user, student, type, body, ref }) {
//         if (!(await this.shouldSend(user, type, 'in_app'))) return null;
//         return Notification.create({
//             user, student, type,
//             channel: 'in_app',
//             body,
//             status: 'sent',
//             sentAt: new Date(),
//             refModel: ref?.model,
//             refId: ref?.id,
//         });
//     }

//     /**
//      * Fire-and-forget helper: try email + sms + in-app in one call.
//      */
//     static async notifyPaymentReceived({ payment, summary, receiptUrl }) {
//         const context = buildPaymentContext(payment, summary, receiptUrl);

//         const tasks = [];

//         // In-app for the accountant
//         tasks.push(this.inApp({
//             user: payment.receivedBy,
//             student: payment.student,
//             type: 'payment_received',
//             body: `Payment of ${context.amountFormatted} received from ${context.studentName}.`,
//             ref: { model: 'Payment', id: payment._id },
//         }));

//         // Email to parent
//         if (context.parentEmail) {
//             tasks.push(this.queueEmail({
//                 to: context.parentEmail,
//                 subject: `Payment received - ${context.receiptNumber}`,
//                 template: 'payment_received',
//                 context,
//                 user: null,
//                 student: payment.student,
//                 ref: { model: 'Payment', id: payment._id },
//             }));
//         }

//         // SMS to parent
//         if (context.parentPhone) {
//             const smsBody =
//                 `Payment of ${context.currency} ${context.amount} received for ` +
//                 `${context.studentName}. Receipt: ${context.receiptNumber}. ` +
//                 `Due: ${context.currency} ${context.due}.`;
//             tasks.push(this.queueSms({
//                 to: context.parentPhone,
//                 body: smsBody,
//                 user: null,
//                 student: payment.student,
//                 type: 'payment_received',
//                 ref: { model: 'Payment', id: payment._id },
//             }));
//         }

//         await Promise.allSettled(tasks);
//     }

//     static async notifyFeeDueSoon({ feeInstance, student, parent, daysLeft }) {
//         const context = buildFeeContext(feeInstance, student, parent, daysLeft);

//         const tasks = [];

//         if (context.parentEmail) {
//             tasks.push(this.queueEmail({
//                 to: context.parentEmail,
//                 subject: `Fee due in ${daysLeft} day(s) - ${context.title}`,
//                 template: 'fee_due_soon',
//                 context,
//                 student: student._id,
//                 ref: { model: 'FeeInstance', id: feeInstance._id },
//             }));
//         }

//         if (context.parentPhone) {
//             tasks.push(this.queueSms({
//                 to: context.parentPhone,
//                 body: `${context.currency} ${context.due} for "${context.title}" is due on ${context.dueDate} (${daysLeft} day(s) left).`,
//                 student: student._id,
//                 type: 'fee_due_soon',
//                 ref: { model: 'FeeInstance', id: feeInstance._id },
//             }));
//         }

//         await Promise.allSettled(tasks);
//     }

//     static async notifyWaiverApproved({ waiver, student, parent }) {
//         // ...
//     }

//     static async notifyRefundProcessed({ refund, student, parent }) {
//         // ...
//     }

//     static async shouldSend(userId, type, channel) {
//         if (!userId) return true; // fall back to sending

//         const pref = await NotificationPreference.findOne({ user: userId }).lean();
//         if (!pref) return true;

//         // Global toggle
//         if (channel === 'email' && !pref.emailEnabled) return false;
//         if (channel === 'sms' && !pref.smsEnabled) return false;
//         if (channel === 'in_app' && !pref.inAppEnabled) return false;

//         // Per-type toggle (default = true if unset)
//         const perType = pref.preferences?.[type];
//         if (perType && perType[channel] === false) return false;

//         return true;
//     }
// }

// // ---- Context builders ----

// function buildPaymentContext(payment, summary, receiptUrl) {
//     const { formatCurrency } = require('../utils/format');
//     return {
//         type: 'payment_received',
//         receiptNumber: payment.receiptNumber,
//         amount: payment.amount.toString(),
//         amountFormatted: formatCurrency(payment.amount),
//         currency: payment.currency || 'BDT',
//         method: payment.method,
//         dateFormatted: new Date(payment.createdAt).toDateString(),
//         studentName: summary?.studentName || 'Student',
//         parentName: summary?.parentName || 'Parent',
//         parentEmail: summary?.parentEmail,
//         parentPhone: summary?.parentPhone,
//         due: summary?.dueBalance?.toString() || '0',
//         dueFormatted: formatCurrency(summary?.dueBalance || 0),
//         receiptUrl,
//     };
// }

// function buildFeeContext(feeInstance, student, parent, daysLeft) {
//     const { formatCurrency } = require('../utils/format');
//     return {
//         type: 'fee_due_soon',
//         title: feeInstance.title,
//         amount: feeInstance.totalAmount.toString(),
//         due: feeInstance.dueAmount.toString(),
//         dueFormatted: formatCurrency(feeInstance.dueAmount),
//         currency: 'BDT',
//         dueDate: feeInstance.dueDate.toDateString(),
//         daysLeft,
//         studentName: student.name,
//         parentName: parent?.name,
//         parentEmail: parent?.email,
//         parentPhone: parent?.phone,
//     };
// }

// module.exports = NotificationService;