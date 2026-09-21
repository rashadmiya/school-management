// services/gateways/ManualGateway.js
const PaymentGateway = require('./PaymentGateway');

class ManualGateway extends PaymentGateway {
    get name() { return 'manual'; }

    async initiate({ intent }) {
        return {
            gatewayReference: `manual_${intent._id}`,
            redirectUrl: null,
            extra: {
                message: 'Upload your bank transfer slip. An admin will verify it.',
            },
        };
    }

    async verifyWebhook() {
        // Manual verification is not a webhook; admin confirms via API.
        return { valid: false, reason: 'Manual gateways are verified by an admin' };
    }

    async refund() {
        return { success: true, reference: null };
    }
}

module.exports = ManualGateway;