// src/lib/financeUtils.js

// ============================================================
// SCOPE (FeeTemplate.appliesTo.scope)
// ============================================================
export const SCOPE_LABELS = {
    all: 'All Students',
    class: 'Class',
    section: 'Section',
    individual: 'Individual Student',
};

export function getScopeLabel(scope) {
    return SCOPE_LABELS[scope] || scope || '—';
}

// ============================================================
// FREQUENCY (FeeTemplate.frequency)
// ============================================================
export const FREQUENCY_LABELS = {
    one_time: 'One-time',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
    custom: 'Custom',
};

export function getFrequencyLabel(freq) {
    return FREQUENCY_LABELS[freq] || freq || '—';
}

// ============================================================
// PAYMENT METHOD (Payment.method)
// ============================================================
export const PAYMENT_METHOD_LABELS = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    check: 'Check',
    mobile_banking: 'Mobile Banking',
    card: 'Card',
    online: 'Online',
};

export function getPaymentMethodLabel(method) {
    return PAYMENT_METHOD_LABELS[method] || method || '—';
}

// ============================================================
// FEE INSTANCE STATUS
// ============================================================
export const FEE_STATUS_LABELS = {
    pending: 'Pending',
    unpaid: 'Unpaid',
    partial: 'Partial',
    paid: 'Paid',
    waived: 'Waived',
    cancelled: 'Cancelled',
    overdue: 'Overdue',
};

export function getFeeStatusLabel(status) {
    return FEE_STATUS_LABELS[status] || status || '—';
}

// ============================================================
// PAYMENT STATUS
// ============================================================
export const PAYMENT_STATUS_LABELS = {
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    reversed: 'Reversed',
    voided: 'Voided',
};

export function getPaymentStatusLabel(status) {
    return PAYMENT_STATUS_LABELS[status] || status || '—';
}

// ============================================================
// REFUND STATUS
// ============================================================
export const REFUND_STATUS_LABELS = {
    pending: 'Pending',
    approved: 'Approved',
    processed: 'Processed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
};

export function getRefundStatusLabel(status) {
    return REFUND_STATUS_LABELS[status] || status || '—';
}

// ============================================================
// WAIVER STATUS
// ============================================================
export const WAIVER_STATUS_LABELS = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    revoked: 'Revoked',
};

export function getWaiverStatusLabel(status) {
    return WAIVER_STATUS_LABELS[status] || status || '—';
}

// ============================================================
// WAIVER TYPE
// ============================================================
export const WAIVER_TYPE_LABELS = {
    full: 'Full Waiver',
    partial: 'Partial Waiver',
    scholarship: 'Scholarship',
    staff_discount: 'Staff Discount',
    sibling_discount: 'Sibling Discount',
};

export function getWaiverTypeLabel(type) {
    return WAIVER_TYPE_LABELS[type] || type || '—';
}

// ============================================================
// ADJUSTMENT
// ============================================================
export const ADJUSTMENT_TYPE_LABELS = {
    debit: 'Debit (Increase)',
    credit: 'Credit (Decrease)',
};

export const ADJUSTMENT_CATEGORY_LABELS = {
    correction: 'Correction',
    fine: 'Fine',
    write_off: 'Write-off',
    scholarship: 'Scholarship',
    misc: 'Miscellaneous',
    late_fee: 'Late Fee',
};

export const ADJUSTMENT_STATUS_LABELS = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    applied: 'Applied',
};

export function getAdjustmentTypeLabel(type) {
    return ADJUSTMENT_TYPE_LABELS[type] || type || '—';
}
export function getAdjustmentCategoryLabel(cat) {
    return ADJUSTMENT_CATEGORY_LABELS[cat] || cat || '—';
}
export function getAdjustmentStatusLabel(status) {
    return ADJUSTMENT_STATUS_LABELS[status] || status || '—';
}

// ============================================================
// LEDGER ENTRY TYPE
// ============================================================
export const LEDGER_TYPE_LABELS = {
    fee: 'Fee Charged',
    payment: 'Payment',
    refund: 'Refund',
    waiver: 'Waiver',
    advance_credit: 'Advance Credit',
    advance_debit: 'Advance Used',
    adjustment: 'Adjustment',
    late_fee: 'Late Fee',
};

export function getLedgerTypeLabel(type) {
    return LEDGER_TYPE_LABELS[type] || type || '—';
}

// ============================================================
// PAYMENT INTENT STATUS
// ============================================================
export const INTENT_STATUS_LABELS = {
    pending: 'Pending',
    processing: 'Processing',
    succeeded: 'Succeeded',
    failed: 'Failed',
    expired: 'Expired',
    cancelled: 'Cancelled',
};

export function getIntentStatusLabel(status) {
    return INTENT_STATUS_LABELS[status] || status || '—';
}

// ============================================================
// STUDENT FINANCE SUMMARY STATUS
// ============================================================
export const BALANCE_STATUS_LABELS = {
    clear: 'Clear',
    due: 'Due',
    overdue: 'Overdue',
    advanced: 'Advance Available',
};

export function getBalanceStatusLabel(status) {
    return BALANCE_STATUS_LABELS[status] || status || '—';
}

// ============================================================
// BADGE STYLE MAP (used by StatusBadge)
// Each entry: { light, dark } — Tailwind class strings
// ============================================================
export const BADGE_STYLES = {
    // Fee instance
    fee: {
        pending:   { light: 'bg-gray-100 text-gray-700 border-gray-200',       dark: 'bg-gray-800 text-gray-300 border-gray-700' },
        unpaid:    { light: 'bg-red-50 text-red-700 border-red-200',           dark: 'bg-red-500/10 text-red-400 border-red-500/20' },
        partial:   { light: 'bg-yellow-50 text-yellow-700 border-yellow-200',  dark: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
        paid:      { light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dark: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        waived:    { light: 'bg-purple-50 text-purple-700 border-purple-200',  dark: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
        cancelled: { light: 'bg-gray-100 text-gray-500 border-gray-200',       dark: 'bg-gray-800 text-gray-500 border-gray-700' },
        overdue:   { light: 'bg-red-50 text-red-700 border-red-200',           dark: 'bg-red-500/10 text-red-400 border-red-500/20' },
    },
    // Payment
    payment: {
        pending:   { light: 'bg-yellow-50 text-yellow-700 border-yellow-200',  dark: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
        completed: { light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dark: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        failed:    { light: 'bg-red-50 text-red-700 border-red-200',           dark: 'bg-red-500/10 text-red-400 border-red-500/20' },
        reversed:  { light: 'bg-orange-50 text-orange-700 border-orange-200',  dark: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
        voided:    { light: 'bg-gray-100 text-gray-600 border-gray-200',       dark: 'bg-gray-800 text-gray-400 border-gray-700' },
    },
    // Refund
    refund: {
        pending:   { light: 'bg-yellow-50 text-yellow-700 border-yellow-200',  dark: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
        approved:  { light: 'bg-blue-50 text-blue-700 border-blue-200',        dark: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        processed: { light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dark: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        rejected:  { light: 'bg-red-50 text-red-700 border-red-200',           dark: 'bg-red-500/10 text-red-400 border-red-500/20' },
        cancelled: { light: 'bg-gray-100 text-gray-500 border-gray-200',       dark: 'bg-gray-800 text-gray-500 border-gray-700' },
    },
    // Waiver
    waiver: {
        pending:  { light: 'bg-yellow-50 text-yellow-700 border-yellow-200', dark: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
        approved: { light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dark: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        rejected: { light: 'bg-red-50 text-red-700 border-red-200',           dark: 'bg-red-500/10 text-red-400 border-red-500/20' },
        revoked:  { light: 'bg-gray-100 text-gray-600 border-gray-200',       dark: 'bg-gray-800 text-gray-400 border-gray-700' },
    },
    // Adjustment
    adjustment: {
        pending:  { light: 'bg-yellow-50 text-yellow-700 border-yellow-200', dark: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
        approved: { light: 'bg-blue-50 text-blue-700 border-blue-200',       dark: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        rejected: { light: 'bg-red-50 text-red-700 border-red-200',          dark: 'bg-red-500/10 text-red-400 border-red-500/20' },
        applied:  { light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dark: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    },
    // Payment intent
    intent: {
        pending:    { light: 'bg-yellow-50 text-yellow-700 border-yellow-200', dark: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
        processing: { light: 'bg-blue-50 text-blue-700 border-blue-200',       dark: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        succeeded:  { light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dark: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        failed:     { light: 'bg-red-50 text-red-700 border-red-200',          dark: 'bg-red-500/10 text-red-400 border-red-500/20' },
        expired:    { light: 'bg-gray-100 text-gray-500 border-gray-200',      dark: 'bg-gray-800 text-gray-500 border-gray-700' },
        cancelled:  { light: 'bg-gray-100 text-gray-500 border-gray-200',      dark: 'bg-gray-800 text-gray-500 border-gray-700' },
    },
    // Ledger entry type
    ledger: {
        fee:            { light: 'bg-red-50 text-red-700 border-red-200',           dark: 'bg-red-500/10 text-red-400 border-red-500/20' },
        payment:        { light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dark: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        refund:         { light: 'bg-orange-50 text-orange-700 border-orange-200',  dark: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
        waiver:         { light: 'bg-purple-50 text-purple-700 border-purple-200',  dark: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
        advance_credit: { light: 'bg-blue-50 text-blue-700 border-blue-200',        dark: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        advance_debit:  { light: 'bg-cyan-50 text-cyan-700 border-cyan-200',        dark: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
        adjustment:     { light: 'bg-yellow-50 text-yellow-700 border-yellow-200',  dark: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
        late_fee:       { light: 'bg-red-50 text-red-700 border-red-200',           dark: 'bg-red-500/10 text-red-400 border-red-500/20' },
    },
    // Balance summary status
    balance: {
        clear:    { light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dark: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        due:      { light: 'bg-yellow-50 text-yellow-700 border-yellow-200',    dark: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
        overdue:  { light: 'bg-red-50 text-red-700 border-red-200',             dark: 'bg-red-500/10 text-red-400 border-red-500/20' },
        advanced: { light: 'bg-blue-50 text-blue-700 border-blue-200',          dark: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    },
};

/**
 * Get a badge style object for a given domain + status.
 * @param {'fee'|'payment'|'refund'|'waiver'|'adjustment'|'intent'|'ledger'|'balance'} domain
 * @param {string} status
 * @param {boolean} isDarkMode
 * @returns {string} Tailwind class string
 */
export function getBadgeClass(domain, status, isDarkMode) {
    const domainMap = BADGE_STYLES[domain];
    if (!domainMap) return isDarkMode
        ? 'bg-gray-800 text-gray-400 border-gray-700'
        : 'bg-gray-100 text-gray-600 border-gray-200';

    const entry = domainMap[status];
    if (!entry) return isDarkMode
        ? 'bg-gray-800 text-gray-400 border-gray-700'
        : 'bg-gray-100 text-gray-600 border-gray-200';

    return isDarkMode ? entry.dark : entry.light;
}

// ============================================================
// SESSION OPTIONS — used in filters everywhere
// ============================================================
export function getSessionOptions(referenceYear = new Date().getFullYear()) {
    return [
        `${referenceYear - 2}-${referenceYear - 1}`,
        `${referenceYear - 1}-${referenceYear}`,
        `${referenceYear}-${referenceYear + 1}`,
        `${referenceYear + 1}-${referenceYear + 2}`,
    ];
}