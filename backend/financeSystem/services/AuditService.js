// services/AuditService.js
const AuditLog = require('../models/AuditLog');

class AuditService {
    /**
     * Append an audit log entry.
     * Call this inside the same transaction as the money operation.
     */
    static async record({
        action,
        actor, actorRole, actorIp, actorUserAgent,
        student, refModel, refId, refNumber,
        before, after, changes,
        reason, notes,
        session, transactionId,
    }, dbSession) {
        const entry = new AuditLog({
            action,
            actor,
            actorRole,
            actorIp,
            actorUserAgent,
            student,
            refModel,
            refId,
            refNumber,
            before,
            after,
            changes,
            reason,
            notes,
            session,
            transactionId,
        });
        await entry.save({ session: dbSession });
        return entry;
    }

    /**
     * Extract actor context from an Express request.
     */
    static contextFromRequest(req) {
        return {
            actor: req.user?._id,
            actorRole: req.user?.role?.name || req.user?.role,
            actorIp: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
            actorUserAgent: req.headers['user-agent'],
        };
    }

    /**
     * Query logs — used by admin UI and reports.
     */
    static async list({ studentId, actor, action, refId, refModel, startDate, endDate, limit = 100 }) {
        const q = {};
        if (studentId) q.student = studentId;
        if (actor) q.actor = actor;
        if (action) q.action = action;
        if (refId) q.refId = refId;
        if (refModel) q.refModel = refModel;
        if (startDate || endDate) {
            q.createdAt = {};
            if (startDate) q.createdAt.$gte = new Date(startDate);
            if (endDate) q.createdAt.$lte = new Date(endDate);
        }
        return AuditLog.find(q)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('actor', 'name email')
            .populate('student', 'name rollNumber')
            .lean();
    }

    static async getForRef(refModel, refId) {
        return AuditLog.find({ refModel, refId })
            .sort({ createdAt: 1 })
            .populate('actor', 'name email')
            .lean();
    }
}

module.exports = AuditService;