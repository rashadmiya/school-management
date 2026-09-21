// controllers/PaymentIntentController.js
const PaymentIntentService = require('../services/PaymentIntentService');
const { getGateway } = require('./services/gateways');

class PaymentIntentController {
    static async create(req, res) {
        const intent = await PaymentIntentService.createIntent(req.body, req.user._id);
        res.status(201).json({ success: true, data: intent });
    }

    static async list(req, res) {
        const { studentId, status, limit = 50 } = req.query;
        const query = {};
        if (studentId) query.student = studentId;
        if (status) query.status = status;
        const intents = await PaymentIntentService.listIntents(query, parseInt(limit, 10));
        res.json({ success: true, data: intents });
    }

    static async get(req, res) {
        const intent = await PaymentIntentService.getIntent(req.params.id);
        if (!intent) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: intent });
    }

    static async confirm(req, res) {
        const result = await PaymentIntentService.confirmIntent(
            req.params.id, req.body, req.user._id
        );
        res.status(201).json({ success: true, data: result });
    }

    static async cancel(req, res) {
        const intent = await PaymentIntentService.cancelIntent(req.params.id, req.user._id);
        res.json({ success: true, data: intent });
    }

    static async webhook(req, res) {
        const gatewayName = req.params.gateway;
        const gateway = getGateway(gatewayName);

        // Attach intent if we can find it (used for amount verification)
        const tranId = req.body?.tran_id || req.body?.paymentID || req.body?.reference;
        let intent = null;
        if (tranId && tranId.match(/^[a-f0-9]{24}$/)) {
            intent = await PaymentIntent.findById(tranId);
            req.intent = intent;
        } else if (tranId) {
            intent = await PaymentIntent.findOne({ gatewayReference: tranId });
            req.intent = intent;
        }

        if (!intent) {
            logger.warn(`Webhook for unknown intent: ${tranId}`);
            // Respond 200 to prevent gateway retries
            return res.status(200).json({ received: true, matched: false });
        }

        // Verify with gateway
        const verification = await gateway.verifyWebhook(req);

        if (!verification.valid) {
            logger.warn(`Invalid webhook for intent ${intent._id}: ${verification.reason}`);
            return res.status(200).json({ received: true, verified: false });
        }

        // Idempotency: if already confirmed, do nothing
        if (intent.status === 'succeeded') {
            return res.status(200).json({ received: true, alreadyProcessed: true });
        }

        if (verification.status === 'succeeded') {
            try {
                await PaymentIntentService.confirmIntent(
                    intent._id,
                    {
                        method: intent.method,
                        methodDetails: {
                            gateway: gatewayName,
                            gatewayReference: verification.gatewayReference,
                            raw: verification.rawPayload,
                        },
                        reference: verification.gatewayReference,
                        notes: `Confirmed via ${gatewayName} webhook`,
                    },
                    intent.initiatedBy // user who initiated; OK because system-confirmed
                );
                return res.status(200).json({ received: true, confirmed: true });
            } catch (err) {
                logger.error(`Failed to confirm intent ${intent._id}`, err);
                // Return 200 to avoid gateway retries, but flag for manual review
                await PaymentIntentService.markFailed(intent._id, err.message);
                return res.status(200).json({ received: true, confirmed: false, error: err.message });
            }
        }

        if (verification.status === 'failed') {
            await PaymentIntentService.markFailed(intent._id, verification.reason || 'Gateway reported failure');
            return res.status(200).json({ received: true, failed: true });
        }

        // Pending
        return res.status(200).json({ received: true, status: 'pending' });
    }

    // controllers/PaymentIntentController.js
    static async returnPage(req, res) {
        const { status } = req.query;
        const intent = await PaymentIntentService.getIntent(req.params.id);

        // For SSR-friendly redirect; you can also redirect to a frontend URL
        // return res.redirect(`${process.env.FRONTEND_URL}/payment/result?id=${req.params.id}&status=${status}`);

        res.json({
            success: true,
            data: {
                intentId: req.params.id,
                status,
                intentStatus: intent?.status,
                amount: intent?.amount,
            },
        });
    }
}

module.exports = PaymentIntentController;