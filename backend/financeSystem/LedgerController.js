// controllers/LedgerController.js - UPDATED
const LedgerService = require('../services/LedgerService');

class LedgerController {
    // GET /api/ledger/:studentId
    static async getStudentLedger(req, res) {
        try {
            const { startDate, endDate, limit = 100 } = req.query;
            const entries = await LedgerService.getStudentLedger(
                req.params.studentId,
                startDate,
                endDate,
                parseInt(limit)
            );
            
            res.json({
                success: true,
                data: entries
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // GET /api/ledger/:studentId/validate
    static async validateLedger(req, res) {
        try {
            const validation = await LedgerService.validateLedger(req.params.studentId);
            
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

    // GET /api/ledger/:studentId/balance
    static async getCurrentBalance(req, res) {
        try {
            const balance = await LedgerService.getStudentBalance(req.params.studentId);
            
            res.json({
                success: true,
                data: { balance }
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
}

module.exports = LedgerController;

// const LedgerEntry = require("../models/LedgerEntry");

// class LedgerController {

//   // GET /api/ledger/:studentId
//   static async getStudentLedger(req, res) {
//     try {
//       const entries = await LedgerEntry.find({
//         student: req.params.studentId
//       }).sort({ createdAt: 1 });

//       res.json({
//         success: true,
//         data: entries
//       });
//     } catch (err) {
//       res.status(400).json({
//         success: false,
//         message: err.message
//       });
//     }
//   }
// }

// module.exports = LedgerController;
