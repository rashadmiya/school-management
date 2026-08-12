export const FEE_SCOPE_OPTIONS = [
  { value: 'all', label: 'All Students' },
  { value: 'class', label: 'Class' },
  // { value: 'section', label: 'Class + Section' },
  { value: 'individual', label: 'Individual Student' },
]

export const FREQUENCY_OPTIONS = [
  { value: 'one_time', label: 'One Time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
]

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'mobile_banking', label: 'Mobile Banking' },
  { value: 'card', label: 'Card' },
  { value: 'online', label: 'Online' },
]

export const MOBILE_OPERATORS = [
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'upay', label: 'Upay' },
  { value: 'tap', label: 'Tap' },
]

export const WAIVER_TYPES = [
  { value: 'full', label: 'Full Waiver' },
  { value: 'partial', label: 'Partial Waiver' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'staff_discount', label: 'Staff Discount' },
  { value: 'sibling_discount', label: 'Sibling Discount' },
]

export const WAIVER_STATUS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'revoked', label: 'Revoked' },
]

export const FEE_STATUS = [
  { value: 'pending', label: 'Pending' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'waived', label: 'Waived' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const PAYMENT_STATUS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'reversed', label: 'Reversed' },
]

export const FEE_STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  unpaid: 'bg-red-100 text-red-800',
  partial: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  waived: 'bg-blue-100 text-blue-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export const PAYMENT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  reversed: 'bg-gray-100 text-gray-800',
}

export const WAIVER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  revoked: 'bg-gray-100 text-gray-800',
}

export const BANK_OPTIONS = [
  { value: 'dhaka_bank', label: 'Dhaka Bank' },
  { value: 'brac_bank', label: 'BRAC Bank' },
  { value: 'city_bank', label: 'City Bank' },
  { value: 'standard_bank', label: 'Standard Bank' },
  { value: 'islami_bank', label: 'Islami Bank' },
  { value: 'sonali_bank', label: 'Sonali Bank' },
  { value: 'janata_bank', label: 'Janata Bank' },
  { value: 'other', label: 'Other' },
]

export const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: `class-${i + 1}`,
  label: `Class ${i + 1}`,
}))

export const SECTION_OPTIONS = [
  { value: 'section-a', label: 'Section A' },
  { value: 'section-b', label: 'Section B' },
  { value: 'section-c', label: 'Section C' },
  { value: 'section-d', label: 'Section D' },
];

// utils/constants.js - Update SESSION_OPTIONS to be dynamic
export const getSessionOptions = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  let baseYear = currentYear;
  if (currentMonth < 5) { // Before June
    baseYear = currentYear - 1;
  }
  
  return [
    { value: `${baseYear - 2}-${baseYear - 1}`, label: `${baseYear - 2}-${baseYear - 1}` },
    { value: `${baseYear - 1}-${baseYear}`, label: `${baseYear - 1}-${baseYear}` },
    { value: `${baseYear}-${baseYear + 1}`, label: `${baseYear}-${baseYear + 1} (Current)` },
    { value: `${baseYear + 1}-${baseYear + 2}`, label: `${baseYear + 1}-${baseYear + 2}` },
  ];
};

// For backward compatibility
export const SESSION_OPTIONS = getSessionOptions();