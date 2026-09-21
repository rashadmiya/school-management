// services/gateways/index.js
const CashGateway = require('./CashGateway');
const ManualGateway = require('./ManualGateway');
// const SSLCommerzGateway = require('./SSLCommerzGateway');
const BkashGateway = require('./BkashGateway');

const GATEWAYS = {
    cash: CashGateway,
    manual: ManualGateway,
    // sslcommerz: SSLCommerzGateway,
    bkash: BkashGateway,
};

/**
 * Get a gateway instance by name.
 */
function getGateway(name) {
    const GatewayClass = GATEWAYS[name];
    if (!GatewayClass) throw new Error(`Unknown gateway: ${name}`);
    return new GatewayClass();
}

module.exports = { getGateway, GATEWAYS };