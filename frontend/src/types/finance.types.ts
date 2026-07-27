// src/types/finance.types.ts
export interface FeeTemplate {
  _id: string;
  title: string;
  code: string;
  description?: string;
  baseAmount: number;
  currency: string;
  taxRate: number;
  applicability: 'all_students' | 'by_class' | 'by_grade' | 'individual';
  applicableClasses?: string[];
  applicableGrades?: string[];
  applicableStudents?: string[];
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  dueDayOfMonth?: number;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  discountRules?: Array<{
    type: string;
    percentage?: number;
    fixedAmount?: number;
    description: string;
    validUntil?: Date;
  }>;
  installmentOptions?: Array<{
    name: string;
    numberOfInstallments: number;
    intervalInMonths: number;
    interestRate: number;
  }>;
  isActive: boolean;
  autoGenerate: boolean;
  priority: number;
  createdBy: User;
  updatedBy?: User;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeInstance {
  _id: string;
  student: Student;
  feeTemplate: FeeTemplate;
  class: Class;
  originalAmount: number;
  applicableDiscount?: {
    type: 'percentage' | 'fixed' | 'waiver';
    value: number;
    reason: string;
    approvedBy?: User;
    approvedDate?: Date;
  };
  netAmount: number;
  paidAmount: number;
  dueAmount: number;
  installmentPlan?: {
    isInstallment: boolean;
    planId?: string;
    currentInstallment: number;
    totalInstallments: number;
    nextDueDate?: Date;
  };
  issueDate: Date;
  dueDate: Date;
  actualPaidDate?: Date;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'waived' | 'cancelled';
  paymentStatus: 'not_due' | 'due_soon' | 'due' | 'overdue';
  payments: Array<{
    payment: Payment;
    amount: number;
    date: Date;
  }>;
  lateFee?: {
    applied: boolean;
    amount: number;
    appliedDate?: Date;
    reason?: string;
  };
  remindersSent?: Array<{
    type: 'email' | 'sms' | 'notification';
    sentDate: Date;
    status: string;
  }>;
  academicYear: string;
  term?: 'term1' | 'term2' | 'term3' | 'annual';
  remarks?: string;
  createdBy?: User;
  updatedBy?: User;
  createdAt: Date;
  updatedAt: Date;
  overdueDays?: number;
  nextPaymentAmount?: number;
}

export interface Payment {
  _id: string;
  receiptNumber: string;
  transactionId?: string;
  externalReference?: string;
  student: Student;
  feeInstances: Array<{
    feeInstance: FeeInstance;
    amount: number;
  }>;
  totalAmount: number;
  amountPaid: number;
  changeGiven: number;
  currency: string;
  paymentMethod: {
    type: 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'mobile_banking' | 'online';
    details?: {
      bankName?: string;
      branchName?: string;
      chequeNumber?: string;
      cardLastFour?: string;
      transactionReference?: string;
      mobileOperator?: string;
    };
  };
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  paymentDate: Date;
  verifiedDate?: Date;
  refundDate?: Date;
  collectedBy: User;
  verifiedBy?: User;
  notes?: string;
  attachments?: Array<{
    name: string;
    url: string;
    uploadedAt: Date;
  }>;
  refundDetails?: {
    amount: number;
    reason: string;
    method: string;
    reference?: string;
    processedBy?: User;
  };
  ipAddress?: string;
  userAgent?: string;
  reconciled: boolean;
  reconciledBy?: User;
  reconciledDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LedgerEntry {
  _id: string;
  entryId: string;
  correlationId: string;
  student: Student;
  academicYear: string;
  transactionType: 'FEE_CHARGE' | 'PAYMENT' | 'DISCOUNT_APPLIED' | 'WAIVER_APPLIED' | 'LATE_FEE_CHARGE' | 'ADJUSTMENT' | 'REFUND' | 'REVERSAL';
  debit: number;
  credit: number;
  runningBalance: number;
  source: {
    documentType: 'FeeInstance' | 'Payment' | 'FeeWaiver' | 'ManualAdjustment';
    documentId: string;
  };
  description: string;
  notes?: string;
  effectiveDate: Date;
  recordedAt: Date;
  createdBy: User;
  ipAddress?: string;
  userAgent?: string;
  isReconciled: boolean;
  reconciliationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentFinanceSummary {
  student: Student;
  summary: {
    academicYear: string;
    currentBalance: number;
    totalPaid: number;
    totalPayments: number;
    lastPaymentDate?: Date;
  };
  details?: {
    feeInstances: FeeInstance[];
    feeSummary: any;
    recentTransactions: LedgerEntry[];
    upcomingDues: Array<{
      title: string;
      dueDate: Date;
      amount: number;
      status: string;
    }>;
  };
}

export interface DashboardData {
  overview: {
    academicYear: string;
    period: string;
    generatedAt: Date;
  };
  metrics: {
    totalCollected: number;
    totalDue: number;
    totalOverdue: number;
    collectionRate: number;
    totalTransactions: number;
    averageTransaction: number;
    todayCollection: number;
    totalStudents: number;
    fullyPaidStudents: number;
    pendingStudents: number;
    totalFees: number;
    totalFeeCount: number;
    paidFeeCount: number;
    pendingFeeCount: number;
  };
  charts: {
    monthlyTrend: Array<{
      month: string;
      amount: number;
      transactions: number;
    }>;
    paymentMethods: Record<string, {
      amount: number;
      count: number;
      percentage: number;
    }>;
    collectionDistribution: {
      paid: number;
      due: number;
      overdue: number;
    };
  };
  highlights: {
    topClasses: Array<{
      className: string;
      section: string;
      amount: number;
      students: number;
      transactions: number;
    }>;
    recentPayments: Array<{
      receiptNumber: string;
      studentName: string;
      rollNumber: string;
      amount: number;
      method: string;
      date: Date;
      collector: string;
    }>;
  };
  quickStats: {
    dailyAverage: number;
    completionRate: number;
    averageDuePerStudent: number;
  };
}

export interface OutstandingReport {
  report: {
    generatedAt: Date;
    filters: any;
    summary: {
      totalRecords: number;
      totalAmount: number;
      statusBreakdown: Record<string, number>;
    };
    data: Array<{
      studentName: string;
      rollNumber: string;
      className: string;
      feeTitle: string;
      netAmount: number;
      paidAmount: number;
      dueAmount: number;
      status: string;
      dueDate: Date;
      overdueDays: number;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface CollectionReport {
  report: {
    period: {
      startDate?: string;
      endDate?: string;
    };
    summary: {
      totalAmount: number;
      paymentCount: number;
      averagePayment: number;
      methodBreakdown: Record<string, number>;
      collectorBreakdown: Record<string, number>;
      dateBreakdown: Record<string, number>;
    };
    payments: Array<{
      receiptNumber: string;
      date: Date;
      studentName: string;
      rollNumber: string;
      amount: number;
      method: string;
      collector: string;
    }>;
  };
}

// Supporting types
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  class?: Class;
  session: string;
  outstandingBalance?: number;
}

interface Class {
  _id: string;
  name: string;
  section?: {
    _id: string;
    name: string;
  };
  supervisor?: User;
  academicYear: string;
}

interface FeeWaiver {
  _id: string;
  student: Student;
  feeInstance: FeeInstance;
  type: 'full' | 'partial' | 'scholarship' | 'staff_discount' | 'sibling_discount';
  amount: number;
  percentage?: number;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  requestDate: Date;
  approvedDate?: Date;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
  reason: string;
  supportingDocuments?: Array<{
    name: string;
    url: string;
    uploadedAt: Date;
  }>;
  requestedBy?: User;
  approvedBy?: User;
  reviewedBy?: User;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InstallmentPlan {
  _id: string;
  name: string;
  code: string;
  totalAmount: number;
  numberOfInstallments: number;
  downPayment: {
    amount: number;
    percentage: number;
  };
  installmentSchedule: Array<{
    installmentNumber: number;
    dueDate: Date;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
  }>;
  interestRate: number;
  latePaymentFee: number;
  eligibleFeeTypes: string[];
  minimumAmount: number;
  maximumAmount: number;
  isActive: boolean;
  autoApprove: boolean;
  createdBy: User;
  updatedBy?: User;
  createdAt: Date;
  updatedAt: Date;
}

// export type ApplyFeePayload =
//   | {
//       applyTo: 'ALL';
//       academicYear: string;
//     }
//   | {
//       applyTo: 'CLASS';
//       academicYear: string;
//       classId: string;
//     }
//   | {
//       applyTo: 'CLASS_SECTION';
//       academicYear: string;
//       classId: string;
//       section: string;
//     }
//   | {
//       applyTo: 'STUDENT';
//       academicYear: string;
//       studentIds: string[];
//     };

export interface ApplyFeeTemplatePayload {
  session: string;              // same as academicYear
  applyTo: 'ALL' | 'CLASS' | 'CLASS_SECTION' | 'STUDENT';

  classId?: string;
  section?: string;
  studentIds?: string[];

  dueDate?: string;
  remarks?: string;
}

