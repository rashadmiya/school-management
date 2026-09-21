// services/gateways/BkashGateway.js
const PaymentGateway = require('./PaymentGateway');

class BkashGateway extends PaymentGateway {
    get name() { return 'bkash'; }

    async initiate({ intent, student, returnUrl, cancelUrl, webhookUrl }) {
        // TODO: implement bKash tokenized checkout
        // 1. get token via /tokenized/checkout/token/grant
        // 2. create payment via /tokenized/checkout/create
        // 3. return bkashURL as redirectUrl
        throw new Error('bKash gateway not implemented yet');
    }

    async verifyWebhook(req) {
        // TODO: verify bKash callback signature and status
        throw new Error('bKash webhook not implemented yet');
    }
}

module.exports = BkashGateway;