// utils/academicSession.js

/**
 * Academic year boundary: new academic year begins in June.
 * Returns e.g. "2025-2026" for a date in Jul 2025 or Jan 2026.
 */
function getCurrentSession(offsetYears = 0, refDate = new Date()) {
    const year = refDate.getFullYear();
    const month = refDate.getMonth(); // 0-indexed

    // Before June → belongs to previous academic year
    let startYear = month < 5 ? year - 1 : year;
    startYear += offsetYears;

    return `${startYear}-${startYear + 1}`;
}

/**
 * Parse "2025-2026" → { startYear: 2025, endYear: 2026 }
 */
function parseSession(session) {
    if (typeof session !== 'string') return null;
    const match = /^(\d{4})-(\d{4})$/.exec(session);
    if (!match) return null;
    return {
        startYear: parseInt(match[1], 10),
        endYear: parseInt(match[2], 10),
    };
}

/**
 * Validate a session string like "2025-2026"
 */
function isValidSession(session) {
    const p = parseSession(session);
    if (!p) return false;
    return p.endYear === p.startYear + 1;
}

/**
 * Return the previous session string, e.g. "2024-2025" from "2025-2026"
 */
function previousSession(session) {
    const p = parseSession(session);
    if (!p) return null;
    return `${p.startYear - 1}-${p.startYear}`;
}

/**
 * Return the next session string
 */
function nextSession(session) {
    const p = parseSession(session);
    if (!p) return null;
    return `${p.endYear}-${p.endYear + 1}`;
}

/**
 * List session options around a reference session
 */
function sessionOptions(refSession, before = 2, after = 2) {
    const p = parseSession(refSession);
    if (!p) return [];
    const out = [];
    for (let i = -before; i <= after; i++) {
        const start = p.startYear + i;
        out.push(`${start}-${start + 1}`);
    }
    return out;
}

module.exports = {
    getCurrentSession,
    parseSession,
    isValidSession,
    previousSession,
    nextSession,
    sessionOptions,
};