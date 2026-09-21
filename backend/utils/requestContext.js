// utils/requestContext.js
const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

function runWithContext(req, fn) {
    const ctx = {
        actor: req.user?._id,
        actorRole: req.user?.role?.name || req.user?.role,
        actorIp: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        actorUserAgent: req.headers['user-agent'],
    };
    return storage.run(ctx, fn);
}

function getContext() {
    return storage.getStore() || {};
}

module.exports = { runWithContext, getContext };