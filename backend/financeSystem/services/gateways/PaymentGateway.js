// services/gateways/PaymentGateway.js
/**
 * Abstract base for all payment gateways.
 * Every gateway MUST implement these methods.
 */
class PaymentGateway {
    /**
     * Human-readable name.
     */
    get name() { throw new Error('Not implemented'); }

    /**
     * Create a payment session with the gateway.
     * @param {Object} params
     * @param {PaymentIntent} params.intent
     * @param {Student} params.student
     * @param {string} params.returnUrl      - success redirect
     * @param {string} params.cancelUrl      - cancel redirect
     * @param {string} params.webhookUrl     - gateway -> server callback
     * @returns {Promise<{
     *   gatewayReference: string,
     *   redirectUrl?: string,
     *   extra?: object
     * }>}
     */
    async initiate(params) { throw new Error('Not implemented'); }

    /**
     * Verify that an incoming webhook is genuine.
     * @param {Request} req - Express request
     * @returns {Promise<{
     *   valid: boolean,
     *   gatewayReference: string,
     *   status: 'succeeded' | 'failed' | 'pending',
     *   amount?: number,
     *   rawPayload: object,
     *   reason?: string
     * }>}
     */
    async verifyWebhook(req) { throw new Error('Not implemented'); }

    /**
     * Issue a refund to the gateway (if supported).
     * @param {Object} params
     * @param {string} params.gatewayReference
     * @param {number} params.amount
     * @param {string} params.reason
     * @returns {Promise<{ success: boolean, reference?: string, raw?: object }>}
     */
    async refund(params) { throw new Error('Refund not supported'); }
}

module.exports = PaymentGateway;