// utils/logger.js
/**
 * Minimal structured logger.
 * - Console output with timestamp and level.
 * - Optional file output (rotating not included — use a proper logger later if needed).
 *
 * In production (Ubuntu), pipe stdout to journald or PM2 logs.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';         // debug | info | warn | error
const LOG_TO_FILE = process.env.LOG_TO_FILE === 'true';    // set to true to also write to file
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');
const LOG_FILE = process.env.LOG_FILE || path.join(LOG_DIR, 'app.log');

const LEVELS = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

// Ensure log directory exists if writing to file
if (LOG_TO_FILE && !fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

function shouldLog(level) {
    return LEVELS[level] >= LEVELS[LOG_LEVEL];
}

function formatLine(level, message, meta) {
    const ts = new Date().toISOString();
    const metaStr = meta && Object.keys(meta).length ? ' ' + safeStringify(meta) : '';
    return `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

function safeStringify(obj) {
    try {
        return util.inspect(obj, { depth: 4, breakLength: Infinity });
    } catch {
        return '[unserializable]';
    }
}

function write(level, message, meta) {
    if (!shouldLog(level)) return;

    const line = formatLine(level, message, meta);

    if (level === 'error') {
        console.error(line);
    } else if (level === 'warn') {
        console.warn(line);
    } else {
        console.log(line);
    }

    if (LOG_TO_FILE) {
        try {
            fs.appendFile(LOG_FILE, line + '\n', () => {});
        } catch (err) {
            // Last resort — do nothing
        }
    }
}

const logger = {
    debug: (message, meta) => write('debug', message, meta),
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, errOrMeta) => {
        if (errOrMeta instanceof Error) {
            write('error', message, { message: errOrMeta.message, stack: errOrMeta.stack });
        } else {
            write('error', message, errOrMeta);
        }
    },
};

module.exports = logger;