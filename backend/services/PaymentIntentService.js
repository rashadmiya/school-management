// services/PaymentIntentService.js
const mongoose = require('mongoose');
const PaymentIntent = require('../financeSystem/models/PaymentIntent');
const PaymentService = require('./PaymentService');
const NotificationService = require('../financeSystem/services/NotificationService');
const { toDecimal, toDecimal128 } = require('../utils/decimal');
const { getCurrentSession } = require('../utils/accademicSession');
const { getGateway } = require('../financeSystem/services/gateways');
const { signReceiptToken } = require('../utils/receiptToken');
const AuditService = require('../financeSystem/services/AuditService');

// --- MISSING IMPORTS (bug #1) ---
const Student = require('../models/Student');

// Default lifetime for a pending intent
const INTENT_TTL_MS = 30 * 60 * 1000; // 30 minutes

class PaymentIntentService {
    /**
     * Create a new intent.
     *
     * @param {Object} data
     *   - studentId      : ObjectId (required)
     *   - amount         : string|number (required, > 0)
     *   - purpose        : 'fee_payment' | 'advance_topup' | 'other'
     *   - method         : 'online' | 'cash' | ...
     *   - gateway        : 'sslcommerz' | 'bkash' | 'stripe' | 'cash' | 'manual'
     *   - feeInstances   : ObjectId[]  (optional targeting)
     *   - session        : "YYYY-YYYY"
     *   - idempotencyKey : string (optional; if given, guaranteed unique intent)
     *   - notes          : string
     *   - resultPath     : frontend path to return to after gateway redirect
     *                      e.g. '/student/payments/result' or '/parent/payments/result'
     * @param {ObjectId} userId  Who initiated (User for staff, Parent for parent, Student for student)
     */
    static async createIntent(data, userId) {
        const {
            studentId, amount, purpose = 'fee_payment', method,
            gateway = 'cash', feeInstances = [], session: sessionYear,
            idempotencyKey, notes,
            resultPath,    // bug #3 — both portals pass this
        } = data;

        const payAmount = toDecimal(amount);
        if (payAmount.lte(0)) throw new Error('Amount must be positive');

        const session = sessionYear || getCurrentSession();

        // Idempotency short-circuit
        if (idempotencyKey) {
            const existing = await PaymentIntent.findOne({ idempotencyKey });
            if (existing) return this._serialize(existing);
        }

        // Reuse an active intent for the same student + amount + purpose
        // ONLY if it already has a gateway redirect URL stored. Otherwise
        // create a fresh one (bug #4).
        const active = await PaymentIntent.findOne({
            student: studentId,
            amount: toDecimal128(payAmount),
            purpose,
            status: { $in: ['pending', 'processing'] },
            expiresAt: { $gt: new Date() },
            session,
        });
        if (active && !idempotencyKey) {
            const stored = active.gatewayPayload?.redirectUrl;
            if (stored || active.gateway === 'cash' || active.gateway === 'manual') {
                return this._serialize(active);
            }
            // Otherwise fall through — old intent has no URL, create a new one
        }

        // const [intent] = await PaymentIntent.create([{
        //     student: studentId,
        //     amount: toDecimal128(payAmount),
        //     purpose,
        //     method,
        //     gateway,
        //     feeInstances,
        //     status: 'pending',
        //     expiresAt: new Date(Date.now() + INTENT_TTL_MS),
        //     initiatedBy: userId,
        //     session,
        //     idempotencyKey,
        //     notes,
        // }]);

        const intentDoc = {
            student: studentId,
            amount: toDecimal128(payAmount),
            purpose,
            method,
            gateway,
            feeInstances,
            status: 'pending',
            expiresAt: new Date(Date.now() + INTENT_TTL_MS),
            initiatedBy: userId,
            session,
            notes,
        };
        
        if (idempotencyKey) intentDoc.idempotencyKey = idempotencyKey;

        const [intent] = await PaymentIntent.create([intentDoc]);

        // For non-cash gateways, initiate with the provider
        if (intent.gateway !== 'cash' && intent.gateway !== 'manual') {
            const gw = getGateway(intent.gateway);          // bug #2 — no shadow
            const student = await Student.findById(studentId)
                .populate('parent', 'name email phone')
                .lean();

            const publicUrl =
                process.env.SSLCOMMERZ_PUBLIC_URL ||
                'http://localhost:8000/api/s2';

            // Frontend base — where the browser lands after the gateway redirect.
            const frontendBase =
                process.env.FRONTEND_URL ||
                'http://localhost:5173';

            const path = resultPath || '/student/payments/result';
            const returnUrl = `${frontendBase}${path}?intentId=${intent._id}&status=success`;
            const cancelUrl = `${frontendBase}${path}?intentId=${intent._id}&status=cancel`;
            // bug #5 — webhook hits the API, not the frontend
            const webhookUrl =
                `${publicUrl}/payment-intents/webhook/${intent.gateway}`;

            const result = await gw.initiate({
                intent,
                student,
                returnUrl,
                cancelUrl,
                webhookUrl,
            });

            intent.gatewayReference = result.gatewayReference;
            // bug #4 — persist the redirect URL so reuse can recover it
            intent.gatewayPayload = {
                ...(result.extra || {}),
                redirectUrl: result.redirectUrl,
            };
            await intent.save();

            return this._serialize(intent);
        }

        return this._serialize(intent);
    }

    /** Normalise intent for API responses — always includes redirectUrl. */
    static _serialize(intent) {
        const obj = intent.toObject ? intent.toObject() : { ...intent };
        return {
            ...obj,
            redirectUrl: obj.gatewayPayload?.redirectUrl || null,
        };
    }

    static async getIntent(intentId) {
        return PaymentIntent.findById(intentId)
            .populate('student', 'name rollNumber class')
            .lean();
    }

    static async listIntents(query = {}, limit = 50) {
        return PaymentIntent.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('student', 'name rollNumber')
            .populate('initiatedBy', 'name')
            .lean();
    }

    static async markProcessing(intentId, gatewayReference, gatewayPayload) {
        const intent = await PaymentIntent.findByIdAndUpdate(
            intentId,
            { status: 'processing', gatewayReference, gatewayPayload },
            { new: true }
        );
        if (!intent) throw new Error('Intent not found');
        return intent;
    }

    static async markFailed(intentId, reason) {
        return PaymentIntent.findByIdAndUpdate(
            intentId,
            { status: 'failed', failedAt: new Date(), failureReason: reason },
            { new: true }
        );
    }

    static async cancelIntent(intentId, userId) {
        const intent = await PaymentIntent.findById(intentId);
        if (!intent) throw new Error('Intent not found');
        if (intent.status !== 'pending') {
            throw new Error(`Cannot cancel intent in status ${intent.status}`);
        }
        intent.status = 'cancelled';
        await intent.save();
        return intent;
    }

    static async confirmIntent(intentId, paymentData, userId) {
        const intent = await PaymentIntent.findById(intentId);
        if (!intent) throw new Error('Intent not found');
        if (intent.status === 'succeeded') return { intent, already: true };
        if (intent.status === 'expired' || intent.status === 'cancelled') {
            throw new Error(`Intent is ${intent.status}`);
        }

        // Atomic claim — only one concurrent confirm wins
        const claimed = await PaymentIntent.findOneAndUpdate(
            { _id: intentId, status: { $in: ['pending', 'processing'] } },
            { $set: { status: 'processing' } },
            { new: true }
        );
        if (!claimed) throw new Error('Intent already being processed');

        const idemKey = `${intent._id}_pay`;

        const result = await PaymentService.receivePayment(
            {
                studentId: intent.student,
                amount: toDecimal(intent.amount),
                method: paymentData.method || intent.method,
                methodDetails: paymentData.methodDetails,
                reference: paymentData.reference,
                notes: paymentData.notes || intent.notes,
                session: intent.session,
                idempotencyKey: idemKey,
            },
            userId
        );

        const payment = result.payment;

        await AuditService.record({
            action: 'payment.received',
            actor: userId,
            student: intent.student,
            refModel: 'Payment',
            refId: payment._id,
            refNumber: payment.receiptNumber,
            after: {
                amount: payment.amount.toString(),
                method: payment.method,
                allocated: payment.allocatedAmount.toString(),
                advance: payment.advanceAmount.toString(),
            },
            session: intent.session,
            transactionId: payment.transactionId,
        });

        const student = await Student.findById(intent.student)
            .populate('parent', 'name email phone').lean();
        const summary = await require('./StudentFinanceSummaryService')
            .getSummary(intent.student, intent.session);

        const token = signReceiptToken(payment._id);
        await NotificationService.notifyPaymentReceived({
            payment,
            summary: {
                studentName: student?.name,
                parentName: student?.parent?.name,
                parentEmail: student?.parent?.email,
                parentPhone: student?.parent?.phone,
                dueBalance: summary?.dueBalance,
            },
            receiptUrl: `${process.env.PUBLIC_URL}/api/s2/public/receipts/${token}`,
        });

        intent.status = 'succeeded';
        intent.completedAt = new Date();
        intent.payment = payment._id;
        await intent.save();

        return { intent, payment, allocations: result.allocations };
    }

    static async expireStaleIntents() {
        const now = new Date();
        return PaymentIntent.updateMany(
            { status: { $in: ['pending', 'processing'] }, expiresAt: { $lt: now } },
            { $set: { status: 'expired' } }
        );
    }
}

module.exports = PaymentIntentService;
