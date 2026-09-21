// controllers/RefundController.js (rewritten)
const RefundService = require('../services/RefundService');

class RefundController {
    static async request(req, res) {
        const refund = await RefundService.requestRefund(
            req.body, req.user._id, req.headers['idempotency-key']
        );
        res.status(201).json({ success: true, data: refund });
    }

    static async approve(req, res) {
        const refund = await RefundService.approveRefund(
            req.params.id, req.user._id, req.body.remarks
        );
        res.json({ success: true, data: refund });
    }

    static async reject(req, res) {
        const refund = await RefundService.rejectRefund(
            req.params.id, req.user._id, req.body.reason
        );
        res.json({ success: true, data: refund });
    }

    static async process(req, res) {
        const result = await RefundService.processRefund(
            req.params.id, req.body, req.user._id
        );
        res.status(200).json({ success: true, message: 'Refund processed', data: result });
    }

    static async list(req, res) {
        const { status, studentId, limit = 50 } = req.query;
        const query = {};
        if (status) query.status = status;
        if (studentId) query.student = studentId;
        const refunds = await RefundService.listRefunds(query, parseInt(limit, 10));
        res.json({ success: true, data: refunds });
    }

    static async history(req, res) {
        const { session, limit = 20 } = req.query;
        const { getCurrentSession } = require('../utils/accademicSession');
        const refunds = await RefundService.getRefundHistory(
            req.params.studentId, session || getCurrentSession(), parseInt(limit, 10)
        );
        res.json({ success: true, data: refunds });
    }
}

module.exports = RefundController;

// // controllers/RefundController.js - UPDATED
// const RefundService = require('../services/RefundService');
// const { validationResult } = require('express-validator');

// class RefundController {
//     // POST /api/refunds
//     static async processRefund(req, res) {
//         try {
//             const errors = validationResult(req);
//             if (!errors.isEmpty()) {
//                 return res.status(400).json({
//                     success: false,
//                     errors: errors.array()
//                 });
//             }
            
//             const result = await RefundService.processRefund(req.body, req.user._id);
            
//             res.status(201).json({
//                 success: true,
//                 message: 'Refund processed successfully',
//                 data: result
//             });
//         } catch (err) {
//             res.status(400).json({
//                 success: false,
//                 message: err.message
//             });
//         }
//     }

//     // GET /api/refunds/student/:studentId
//     static async getRefundHistory(req, res) {
//         try {
//             const { session = PaymentService.getCurrentSession(), limit = 20 } = req.query;
//             const refunds = await RefundService.getRefundHistory(
//                 req.params.studentId,
//                 session,
//                 parseInt(limit)
//             );
            
//             res.json({
//                 success: true,
//                 data: refunds
//             });
//         } catch (err) {
//             res.status(400).json({
//                 success: false,
//                 message: err.message
//             });
//         }
//     }

//     // GET /api/refunds/validate/:paymentId
//     static async validateRefund(req, res) {
//         try {
//             const { amount } = req.query;
            
//             const validation = await RefundService.validateRefund(
//                 req.params.paymentId,
//                 parseFloat(amount)
//             );
            
//             res.json({
//                 success: true,
//                 data: validation
//             });
//         } catch (err) {
//             res.status(400).json({
//                 success: false,
//                 message: err.message
//             });
//         }
//     }
// }

// module.exports = RefundController;