// // config/queue.js
// const { Queue, Worker, QueueEvents } = require('bullmq');
// const IORedis = require('ioredis');

// const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
//     maxRetriesPerRequest: null,
// });

// const notificationsQueue = new Queue('notifications', { connection });

// module.exports = { connection, notificationsQueue };

// config/queue.js
/**
 * BullMQ queue with graceful fallback.
 *
 * - If Redis is available and QUEUE_ENABLED !== 'false', we create a BullMQ queue.
 * - If Redis is unavailable (or QUEUE_ENABLED=false), notifications are processed
 *   inline by the same logic the worker uses.
 *
 * This lets development run without Redis while production uses BullMQ.
 */

// config/queue.js
/**
 * BullMQ queue with graceful fallback.
 *
 * Strategy:
 * 1. Probe Redis with a short-timeout TCP connection.
 * 2. If reachable → create BullMQ queue (full background processing).
 * 3. If not reachable → skip Redis entirely, process notifications inline.
 *
 * This avoids ioredis' retry loop and log spam when Redis is down.
 */

const net = require('net');
const logger = require('../utils/logger');

let Queue, IORedis;
try {
    ({ Queue } = require('bullmq'));
    IORedis = require('ioredis');
} catch (err) {
    logger.warn('[queue] bullmq or ioredis missing; running in fallback mode');
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_ENABLED = process.env.QUEUE_ENABLED !== 'false';

let connection = null;
let notificationsQueue = null;
let queueReady = false;

/**
 * Parse redis:// URL into host + port.
 */
function parseRedisUrl(url) {
    try {
        const u = new URL(url);
        return {
            host: u.hostname || 'localhost',
            port: parseInt(u.port || '6379', 10),
        };
    } catch {
        return { host: 'localhost', port: 6379 };
    }
}

/**
 * Quick TCP probe — resolves true if something is listening.
 * Times out after `timeoutMs`.
 */
function probeRedis(host, port, timeoutMs = 1000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let done = false;

        const finish = (ok) => {
            if (done) return;
            done = true;
            socket.destroy();
            resolve(ok);
        };

        socket.setTimeout(timeoutMs);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', () => finish(false));

        socket.connect(port, host);
    });
}

/**
 * Initialize the queue synchronously (called at require-time).
 * The Redis probe is async, so we expose `isQueueEnabled()` which
 * checks the `queueReady` flag set once the probe resolves.
 */
async function initializeQueue() {
    if (!QUEUE_ENABLED || !Queue || !IORedis) {
        logger.info('[queue] queue disabled or dependencies missing — using inline processing');
        return;
    }

    const { host, port } = parseRedisUrl(REDIS_URL);
    const reachable = await probeRedis(host, port, 1000);

    if (!reachable) {
        logger.info(`[queue] Redis not reachable at ${host}:${port} — using inline processing`);
        return;
    }

    try {
        connection = new IORedis(REDIS_URL, {
            maxRetriesPerRequest: null,
            enableOfflineQueue: false,
            retryStrategy: () => null, // do not retry after failure
            reconnectOnError: () => false,
        });

        // Swallow errors quietly — we already probed and it was fine
        connection.on('error', (err) => {
            logger.warn('[queue] Redis error', { error: err.message });
        });

        connection.on('connect', () => {
            logger.info('[queue] Redis connected');
        });

        notificationsQueue = new Queue('notifications', {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: 100,
                removeOnFail: 1000,
            },
        });

        queueReady = true;
        logger.info('[queue] BullMQ notifications queue initialized');
    } catch (err) {
        logger.error('[queue] failed to initialize; using inline mode', err);
        connection = null;
        notificationsQueue = null;
        queueReady = false;
    }
}

// Kick off initialization in the background.
// Until it resolves, isQueueEnabled() returns false and notifications
// will run inline. Once Redis is confirmed, subsequent calls will queue.
initializeQueue();

function isQueueEnabled() {
    return queueReady && notificationsQueue !== null;
}

module.exports = {
    // Export getters so the connection/queue reflect runtime state
    get connection() { return connection; },
    get notificationsQueue() { return notificationsQueue; },
    isQueueEnabled,
};