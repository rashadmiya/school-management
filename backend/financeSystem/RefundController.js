// controllers/RefundController.js - UPDATED
const RefundService = require('../services/RefundService');
const { validationResult } = require('express-validator');

class RefundController {
    // POST /api/refunds
    static async processRefund(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }
            
            const result = await RefundService.processRefund(req.body, req.user._id);
            
            res.status(201).json({
                success: true,
                message: 'Refund processed successfully',
                data: result
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // GET /api/refunds/student/:studentId
    static async getRefundHistory(req, res) {
        try {
            const { session = PaymentService.getCurrentSession(), limit = 20 } = req.query;
            const refunds = await RefundService.getRefundHistory(
                req.params.studentId,
                session,
                parseInt(limit)
            );
            
            res.json({
                success: true,
                data: refunds
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // GET /api/refunds/validate/:paymentId
    static async validateRefund(req, res) {
        try {
            const { amount } = req.query;
            
            const validation = await RefundService.validateRefund(
                req.params.paymentId,
                parseFloat(amount)
            );
            
            res.json({
                success: true,
                data: validation
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
}

module.exports = RefundController;

// const RefundService = require("../services/RefundService");

// class RefundController {

//   // POST /api/refunds
//   static async refundPayment(req, res) {
//     try {
//       const refund = await RefundService.refund(
//         req.body,
//         req.user
//       );

//       res.status(201).json({
//         success: true,
//         message: "Refund processed",
//         data: refund
//       });
//     } catch (err) {
//       res.status(400).json({
//         success: false,
//         message: err.message
//       });
//     }
//   }
// }

// module.exports = RefundController;
