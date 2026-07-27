import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date) {
  if (!date) return 'N/A';

  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date) {
  if (!date) return 'N/A';

  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    partial: 'bg-blue-100 text-blue-800',
    waived: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPaymentMethodIcon(method) {
  const icons = {
    cash: '💰',
    bank_transfer: '🏦',
    cheque: '📄',
    card: '💳',
    mobile_banking: '📱',
    online: '🌐',
  };

  return icons[method] || '💵';
}

export function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

export function debounce(func, wait) {
  let timeout;

  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

export function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength) + '...';
}

export function generateReceiptNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');

  return `REC-${year}${month}-${random}`;
}
