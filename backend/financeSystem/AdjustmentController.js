// controllers/AdjustmentController.js
const AdjustmentService = require('./services/AdjustmentService');

class AdjustmentController {
    static async request(req, res) {
        const adjustment = await AdjustmentService.request(req.body, req.user._id);
        res.status(201).json({ success: true, data: adjustment });
    }
    static async approve(req, res) {
        const adjustment = await AdjustmentService.approve(req.params.id, req.user._id, req.body.remarks);
        res.json({ success: true, data: adjustment });
    }
    static async reject(req, res) {
        const adjustment = await AdjustmentService.reject(req.params.id, req.user._id, req.body.reason);
        res.json({ success: true, data: adjustment });
    }
    static async apply(req, res) {
        const adjustment = await AdjustmentService.apply(req.params.id, req.user._id);
        res.json({ success: true, data: adjustment });
    }
    static async list(req, res) {
        const { studentId, status, category, limit = 50 } = req.query;
        const query = {};
        if (studentId) query.student = studentId;
        if (status) query.status = status;
        if (category) query.category = category;
        const list = await AdjustmentService.list(query, parseInt(limit, 10));
        res.json({ success: true, data: list });
    }
}

module.exports = AdjustmentController;