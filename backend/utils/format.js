// utils/format.js
/**
 * Shared formatting utilities for the finance system.
 * Uses decimal.js for money so nothing is lost to floating point.
 */
const { toDecimal, round, toString } = require('./decimal');

// Default locale & currency — override per call if needed
const DEFAULT_LOCALE = 'en-BD';
const DEFAULT_CURRENCY = 'BDT';

/**
 * Format money. Accepts Decimal128, Decimal, string, or number.
 *
 * @param {any} amount
 * @param {Object} [options]
 * @param {boolean} [options.withSymbol=true] - include currency symbol
 * @param {string}  [options.currency='BDT']  - ISO currency code
 * @param {string}  [options.locale='en-BD']  - locale for grouping
 * @param {number}  [options.minimumFractionDigits=2]
 * @param {number}  [options.maximumFractionDigits=2]
 * @param {boolean} [options.compact=false]   - e.g. "৳12K" for dashboards
 * @returns {string}
 */
function formatCurrency(amount, options = {}) {
    const {
        withSymbol = true,
        currency = DEFAULT_CURRENCY,
        locale = DEFAULT_LOCALE,
        minimumFractionDigits = 2,
        maximumFractionDigits = 2,
        compact = false,
    } = options;

    const value = toDecimal(amount);
    const num = value.toNumber();

    try {
        return new Intl.NumberFormat(locale, {
            style: withSymbol ? 'currency' : 'decimal',
            currency,
            minimumFractionDigits,
            maximumFractionDigits,
            notation: compact ? 'compact' : 'standard',
        }).format(num);
    } catch {
        // Fallback if locale/currency is invalid
        const formatted = value.toFixed(minimumFractionDigits);
        return withSymbol ? `${currency} ${formatted}` : formatted;
    }
}

/**
 * Format money without symbol — just a grouped number.
 * "1234.5" → "1,234.50"
 */
function formatAmount(amount, options = {}) {
    return formatCurrency(amount, { ...options, withSymbol: false });
}

/**
 * Format a decimal into a fixed-precision string.
 * "1234.5" → "1234.50"
 */
function formatDecimal(value, precision = 2) {
    return round(value).toFixed(precision);
}

/**
 * Format a date as "12 Feb 2026".
 */
function formatDate(date, locale = 'en-GB') {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Format date as "12 Feb 2026, 3:45 PM".
 */
function formatDateTime(date, locale = 'en-GB') {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Relative time: "3 days ago", "in 2 hours".
 */
function formatRelativeTime(date, locale = 'en-GB') {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';

    const diffMs = d.getTime() - Date.now();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
    if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
    const diffMonth = Math.round(diffDay / 30);
    if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month');
    const diffYear = Math.round(diffMonth / 12);
    return rtf.format(diffYear, 'year');
}

/**
 * Format a percentage. "12.5" → "12.5%"
 */
function formatPercent(value, fractionDigits = 1) {
    const num = toDecimal(value).toNumber();
    return `${num.toFixed(fractionDigits)}%`;
}

/**
 * Format a phone number for display.
 * Best-effort — pass locale for accuracy.
 */
function formatPhone(phone, countryCode = '+880') {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith(countryCode.replace('+', ''))) {
        return `+${digits}`;
    }
    return `${countryCode}${digits}`;
}

/**
 * Truncate long strings.
 */
function truncate(str, max = 40) {
    if (!str) return '';
    return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

/**
 * Format a human-readable name for a payment method enum.
 * 'mobile_banking' → 'Mobile Banking'
 */
function formatPaymentMethod(method) {
    if (!method) return 'Unknown';
    return String(method)
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

/**
 * Format an enum value into a Title Case label.
 */
function formatEnum(value) {
    if (!value) return '';
    return String(value)
        .split(/[_\s]+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Format a ledger entry type into a user-friendly label.
 */
function formatLedgerType(type) {
    const map = {
        fee: 'Fee Charged',
        payment: 'Payment',
        refund: 'Refund',
        waiver: 'Waiver',
        advance_credit: 'Advance Credit',
        advance_debit: 'Advance Used',
        adjustment: 'Adjustment',
        late_fee: 'Late Fee',
    };
    return map[type] || formatEnum(type);
}

/**
 * Format a fee instance status.
 */
function formatFeeStatus(status) {
    const map = {
        pending: 'Pending',
        unpaid: 'Unpaid',
        partial: 'Partially Paid',
        paid: 'Paid',
        waived: 'Waived',
        cancelled: 'Cancelled',
        overdue: 'Overdue',
    };
    return map[status] || formatEnum(status);
}

/**
 * Format a student balance status flag.
 */
function formatBalanceStatus(status) {
    const map = {
        clear: 'Clear',
        due: 'Due',
        overdue: 'Overdue',
        advanced: 'Advance Available',
    };
    return map[status] || formatEnum(status);
}

/**
 * Format a large number of bytes into "1.5 MB", "800 KB" etc.
 */
function formatBytes(bytes, decimals = 2) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Safe string coercion for things like rollNumber, receiptNumber.
 */
function formatRef(value) {
    if (value === null || value === undefined) return '';
    return String(value);
}

module.exports = {
    formatCurrency,
    formatAmount,
    formatDecimal,
    formatDate,
    formatDateTime,
    formatRelativeTime,
    formatPercent,
    formatPhone,
    truncate,
    formatPaymentMethod,
    formatEnum,
    formatLedgerType,
    formatFeeStatus,
    formatBalanceStatus,
    formatBytes,
    formatRef,
};