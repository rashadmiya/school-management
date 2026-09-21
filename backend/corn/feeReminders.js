// cron/feeReminders.js
// Call startFeeReminders() in server.js

const cron = require('node-cron');
const FeeInstance = require('../financeSystem/models/FeeInstance');
const Student = require('../models/Student');
const NotificationService = require('../financeSystem/services/NotificationService');
const logger = require('../utils/logger');

function startFeeReminders() {
    // Every day at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        const today = new Date();
        const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

        // Fees due in exactly 3 days
        const upcoming = await FeeInstance.find({
            status: { $in: ['unpaid', 'partial', 'overdue'] },
            dueDate: { $gte: today, $lte: threeDaysFromNow },
            isActive: true,
        }).populate({
            path: 'student',
            populate: { path: 'parent' },
        }).limit(500);

        logger.info(`Sending reminders for ${upcoming.length} fee instances`);

        for (const fee of upcoming) {
            const student = fee.student;
            if (!student) continue;
            const daysLeft = Math.ceil((fee.dueDate - today) / (1000 * 60 * 60 * 24));

            try {
                await NotificationService.notifyFeeDueSoon({
                    feeInstance: fee,
                    student,
                    parent: student.parent,
                    daysLeft,
                });
            } catch (err) {
                logger.error(`Reminder failed for ${fee._id}`, err);
            }
        }
    });
}

module.exports = { startFeeReminders };