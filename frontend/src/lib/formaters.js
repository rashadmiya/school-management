// src/lib/formaters.js

// ============================================================
// Number / Decimal128 coercion
// ============================================================
/**
 * Coerce any money-like value into a plain JS number.
 * Handles:
 *   - Decimal128 as Mongoose document property
 *   - Decimal128 as { $numberDecimal: "..." }
 *   - Decimal128 as string
 *   - number
 *   - null / undefined
 */
export function toMoneyNumber(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
        const n = parseFloat(value);
        return Number.isFinite(n) ? n : 0;
    }
    // Mongoose Decimal128 exposes .toString() → "5000.00"
    if (typeof value === 'object') {
        if (typeof value.toString === 'function') {
            const n = parseFloat(value.toString());
            if (Number.isFinite(n)) return n;
        }
        if ('$numberDecimal' in value) {
            const n = parseFloat(value.$numberDecimal);
            if (Number.isFinite(n)) return n;
        }
    }
    return 0;
}

/**
 * Round to 2 decimals safely.
 */
export function toMoneyNumberRounded(value) {
    return Math.round(toMoneyNumber(value) * 100) / 100;
}

// ============================================================
// Currency
// ============================================================
const DEFAULT_LOCALE = 'en-BD';
const DEFAULT_CURRENCY = 'BDT';

/**
 * Format money into "৳1,234.50".
 * Accepts Decimal128, string, number.
 */
export function formatCurrency(amount, options = {}) {
    const {
        withSymbol = true,
        currency = DEFAULT_CURRENCY,
        locale = DEFAULT_LOCALE,
        minimumFractionDigits = 2,
        maximumFractionDigits = 2,
        compact = false,
    } = options;

    const num = toMoneyNumber(amount);

    try {
        return new Intl.NumberFormat(locale, {
            style: withSymbol ? 'currency' : 'decimal',
            currency,
            minimumFractionDigits,
            maximumFractionDigits,
            notation: compact ? 'compact' : 'standard',
        }).format(num);
    } catch {
        return `${withSymbol ? currency + ' ' : ''}${num.toFixed(minimumFractionDigits)}`;
    }
}

/** Just the grouped number, no symbol. */
export function formatAmount(amount, options = {}) {
    return formatCurrency(amount, { ...options, withSymbol: false });
}

/** "1,234.50" — grouped, fixed 2. */
export function formatDecimal(value) {
    return toMoneyNumberRounded(value).toFixed(2);
}

/** "12.5%" */
export function formatPercent(value, digits = 1) {
    const n = toMoneyNumber(value);
    return `${n.toFixed(digits)}%`;
}

// ============================================================
// Date
// ============================================================
export function formatDate(date, format = 'medium', locale = 'en-GB') {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';

    if (format === 'short') {
        return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: '2-digit' });
    }
    if (format === 'long') {
        return d.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date, locale = 'en-GB') {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(locale, {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export function formatTime(date, locale = 'en-GB') {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Relative: "3 minutes ago", "in 2 days".
 */
export function formatRelativeTime(date, locale = 'en-GB') {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
    const abs = Math.abs(diffSec);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (abs < 60) return rtf.format(diffSec, 'second');
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
    if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), 'day');
    if (abs < 31536000) return rtf.format(Math.round(diffSec / 2592000), 'month');
    return rtf.format(Math.round(diffSec / 31536000), 'year');
}

// ============================================================
// Misc
// ============================================================
export function truncate(str, max = 40) {
    if (!str) return '';
    const s = String(str);
    return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function formatBytes(bytes, decimals = 2) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// // src/lib/formatters.js
// import { format, formatDistanceToNow } from 'date-fns'

// export const formatCurrency = (amount, currency = 'BDT') => {
//   return new Intl.NumberFormat('en-BD', {
//     style: 'currency',
//     currency: currency,
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(amount)
// }

// export const formatDate = (date, formatStr = 'dd MMM yyyy') => {
//   if (!date) return 'N/A'
//   try {
//     return format(new Date(date), formatStr)
//   } catch (error) {
//     return 'Invalid Date'
//   }
// }

// export const formatDateTime = (date) => {
//   return formatDate(date, 'dd MMM yyyy, hh:mm a')
// }

// // export const formatRelativeTime = (date) => {
// //   if (!date) return 'N/A'
// //   try {
// //     return formatDistanceToNow(new Date(date), { addSuffix: true })
// //   } catch (error) {
// //     return 'Invalid Date'
// //   }
// // }

export const getStatusColor = (status, type = 'fee') => {
  const statusColors = {
    fee: {
      unpaid: 'bg-red-100 text-red-800 border-red-200',
      partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      waived: 'bg-blue-100 text-blue-800 border-blue-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    payment: {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      reversed: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    waiver: {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      revoked: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    refund: {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processed: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    },
  }

  return statusColors[type]?.[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

// export const truncateText = (text, maxLength = 50) => {
//   if (!text) return ''
//   if (text.length <= maxLength) return text
//   return text.substring(0, maxLength) + '...'
// }

// export const getInitials = (name) => {
//   if (!name) return '??'
//   return name
//     .split(' ')
//     .map(word => word[0])
//     .join('')
//     .toUpperCase()
//     .substring(0, 2)
// }

export const calculateDueAmount = (fee) => {
  if (!fee) return 0
  const { totalAmount = 0, paidAmount = 0, waivedAmount = 0, advanceUsed = 0 } = fee
  return Math.max(0, totalAmount - paidAmount - waivedAmount - advanceUsed)
}

export const getCurrentSession = () => {
  const currentYear = new Date().getFullYear()
  return `${currentYear}-${currentYear + 1}`
}

export const parseServerError = (error) => {
  if (!error) return 'An unknown error occurred'
  
  if (error.data?.message) {
    return error.data.message
  }
  
  if (error.error) {
    return error.error
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An error occurred. Please try again.'
}

// export function formatRelativeTime(date, locale = 'en-GB') {
//     if (!date) return '';
//     const d = date instanceof Date ? date : new Date(date);
//     const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
//     const abs = Math.abs(diffSec);
//     const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
//     if (abs < 60) return rtf.format(diffSec, 'second');
//     if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
//     if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
//     if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), 'day');
//     if (abs < 31536000) return rtf.format(Math.round(diffSec / 2592000), 'month');
//     return rtf.format(Math.round(diffSec / 31536000), 'year');
// }