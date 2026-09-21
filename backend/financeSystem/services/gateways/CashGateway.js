// services/gateways/CashGateway.js
const PaymentGateway = require('./PaymentGateway');

class CashGateway extends PaymentGateway {
    get name() { return 'cash'; }

    async initiate({ intent }) {
        // Cash is synchronous — the caller will call PaymentIntentService.confirmIntent
        // directly, so we return the gateway reference as the intent id.
        return {
            gatewayReference: `cash_${intent._id}`,
            redirectUrl: null,
            extra: { message: 'Cash payments are confirmed immediately.' },
        };
    }

    async verifyWebhook() {
        // Cash has no webhooks
        return { valid: false, reason: 'Cash has no webhooks' };
    }

    async refund() {
        // Cash refunds are manual; processed via refund workflow.
        return { success: true, reference: null };
    }
}

module.exports = CashGateway;