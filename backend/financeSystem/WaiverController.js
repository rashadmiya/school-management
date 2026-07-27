// controllers/WaiverController.js - NEW
const WaiverService = require('../services/WaiverService');
const { validationResult } = require('express-validator');

class WaiverController {
    // POST /api/waivers/request
    static async requestWaiver(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }
            
            const waiver = await WaiverService.requestWaiver(req.body, req.user._id);
            
            res.status(201).json({
                success: true,
                message: 'Waiver request submitted successfully',
                data: waiver
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // POST /api/waivers/:id/approve
    static async approveWaiver(req, res) {
        try {
            const { remarks } = req.body;
            
            const result = await WaiverService.approveWaiver(
                req.params.id,
                req.user._id,
                remarks
            );
            
            res.json({
                success: true,
                message: 'Waiver approved successfully',
                data: result
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // POST /api/waivers/:id/reject
    static async rejectWaiver(req, res) {
        try {
            const { reason } = req.body;
            
            const waiver = await WaiverService.rejectWaiver(
                req.params.id,
                req.user._id,
                reason
            );
            
            res.json({
                success: true,
                message: 'Waiver rejected successfully',
                data: waiver
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // POST /api/waivers/:id/revoke
    static async revokeWaiver(req, res) {
        try {
            const { reason } = req.body;
            
            const result = await WaiverService.revokeWaiver(
                req.params.id,
                req.user._id,
                reason
            );
            
            res.json({
                success: true,
                message: 'Waiver revoked successfully',
                data: result
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // GET /api/waivers
    static async getWaiverRequests(req, res) {
        try {
            const { studentId, status, limit = 50 } = req.query;
            
            const waivers = await WaiverService.getWaiverRequests(
                studentId,
                status,
                parseInt(limit)
            );
            
            res.json({
                success: true,
                data: waivers
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    // GET /api/waivers/eligible/:feeInstanceId
    static async getEligibleWaiver(req, res) {
        try {
            const eligibility = await WaiverService.calculateEligibleWaiver(req.params.feeInstanceId);
            
            res.json({
                success: true,
                data: eligibility
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
}

module.exports = WaiverController;