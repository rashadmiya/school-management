// // services/gateways/SSLCommerzGateway.js
// const PaymentGateway = require('./PaymentGateway');
// const axios = require('axios');
// const config = require('../../config/sslcommerz');
// const logger = require('../../utils/logger');
// const { toDecimal, toString } = require('../../utils/decimal');

// class SSLCommerzGateway extends PaymentGateway {
//     get name() { return 'sslcommerz'; }

//     get baseUrl() {
//         return config.sandbox
//             ? 'https://sandbox.sslcommerz.com'
//             : 'https://securepay.sslcommerz.com';
//     }

//     async initiate({ intent, student, returnUrl, cancelUrl, webhookUrl }) {
//         const payload = {
//             store_id: config.storeId,
//             store_passwd: config.storePassword,
//             total_amount: toString(intent.amount),
//             currency: intent.currency || 'BDT',
//             tran_id: intent._id.toString(),      // our reference
//             success_url: returnUrl,
//             fail_url: cancelUrl,
//             cancel_url: cancelUrl,
//             ipn_url: webhookUrl,
//             cus_name: student.name,
//             cus_email: student.user?.email || 'noreply@example.com',
//             cus_add1: student.address || 'N/A',
//             cus_city: 'Dhaka',
//             cus_country: 'Bangladesh',
//             cus_phone: student.guardianContact || 'N/A',
//             shipping_method: 'NO',
//             product_name: 'School Fee',
//             product_category: 'Education',
//             product_profile: 'non-physical-goods',
//         };

//         const { data } = await axios.post(
//             `${this.baseUrl}/gwprocess/v4/api.php`,
//             new URLSearchParams(payload).toString(),
//             { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
//         );

//         if (data.status !== 'SUCCESS') {
//             logger.error('SSLCommerz initiate failed', data);
//             throw new Error(data.failedreason || 'SSLCommerz initiate failed');
//         }

//         return {
//             gatewayReference: data.sessionkey,
//             redirectUrl: data.GatewayPageURL,
//             extra: {
//                 sessionkey: data.sessionkey,
//                 tran_id: payload.tran_id,
//             },
//         };
//     }

//     async verifyWebhook(req) {
//         // SSLCommerz IPN sends POST with val_id, tran_id, status, amount, verify_sign, verify_key
//         const body = req.body || {};
//         const { tran_id, val_id, status, amount, verify_sign, verify_key } = body;

//         if (!val_id || !tran_id) {
//             return { valid: false, reason: 'Missing val_id or tran_id' };
//         }

//         // Verify with SSLCommerz validation API
//         const verifyUrl = `${this.baseUrl}/validator/api/validationserverAPI.php`;
//         const { data } = await axios.get(verifyUrl, {
//             params: {
//                 val_id,
//                 store_id: config.storeId,
//                 store_passwd: config.storePassword,
//                 format: 'json',
//             },
//         });

//         if (data.status !== 'VALID' && data.status !== 'VALIDATED') {
//             return { valid: false, reason: `SSLCommerz says ${data.status}` };
//         }

//         // Confirm amount matches
//         const verifiedAmount = toDecimal(data.amount || '0');
//         const intentAmount = toDecimal(req.intent?.amount || '0');
//         if (intentAmount.gt(0) && verifiedAmount.lt(intentAmount)) {
//             return {
//                 valid: false,
//                 reason: `Amount mismatch: expected ${intentAmount.toString()}, got ${verifiedAmount.toString()}`,
//             };
//         }

//         const succeeded = status === 'VALID' || status === 'VALIDATED';

//         return {
//             valid: true,
//             gatewayReference: val_id,
//             status: succeeded ? 'succeeded' : 'failed',
//             amount: verifiedAmount,
//             rawPayload: data,
//         };
//     }

//     async refund({ gatewayReference, amount, reason }) {
//         // SSLCommerz refund API
//         const url = `${this.baseUrl}/validator/api/merchantTransIDvalidationAPI.php`;
//         const { data } = await axios.get(url, {
//             params: {
//                 bank_tran_id: gatewayReference,
//                 refund_amount: toString(amount),
//                 refund_remarks: reason,
//                 store_id: config.storeId,
//                 store_passwd: config.storePassword,
//                 format: 'json',
//             },
//         });

//         return {
//             success: data.status === 'success',
//             reference: data.refund_ref_id,
//             raw: data,
//         };
//     }
// }

// module.exports = SSLCommerzGateway;