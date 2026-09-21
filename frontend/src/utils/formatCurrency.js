// utils/formatCurrency.js
export const formatBDT = (value) => {
    const n = Number(value || 0);
    return `৳${n.toLocaleString('en-BD', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

export const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';