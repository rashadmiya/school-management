// src/lib/validators.js
import * as z from 'zod'

export const feeTemplateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive').max(1000000, 'Amount too large'),
  currency: z.string().default('BDT'),
  frequency: z.enum(['one_time', 'monthly', 'quarterly', 'yearly', 'custom']),
  appliesTo: z.object({
    scope: z.enum(['all', 'class', 'section', 'individual']),
    class: z.string().optional(),
    section: z.string().optional(),
    individualStudent: z.string().optional(),
    grade: z.string().optional(),
  }),
  dueDay: z.number().min(1).max(31).optional(),
  taxPercentage: z.number().min(0).max(100).default(0),
  lateFee: z.object({
    amount: z.number().min(0).optional(),
    percentage: z.number().min(0).max(100).optional(),
    afterDays: z.number().min(1).optional(),
  }).optional(),
  isActive: z.boolean().default(true),
  session: z.string(),
  installmentPlan: z.string().optional(),
  allowPartialPayments: z.boolean().default(true),
})

// export const paymentSchema = z.object({
//   studentId: z.string().min(1, 'Student is required'),
//   amount: z.number().min(1, 'Amount must be at least 1'),
//   method: z.enum(['cash', 'bank_transfer', 'check', 'mobile_banking', 'card', 'online']),
//   methodDetails: z.object({
//     bankName: z.string().optional(),
//     accountNumber: z.string().optional(),
//     checkNumber: z.string().optional(),
//     transactionId: z.string().optional(),
//     mobileOperator: z.string().optional(),
//     cardLastFour: z.string().optional(),
//   }).optional(),
//   reference: z.string().optional(),
//   notes: z.string().optional(),
//   session: z.string(),
// })

export const paymentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  amount: z.number().min(1, 'Amount must be at least 1'),
  method: z.enum(['cash', 'bank_transfer', 'check', 'mobile_banking', 'card', 'online']),
  methodDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    checkNumber: z.string().optional(),
    transactionId: z.string().optional(),
    mobileOperator: z.string().optional(),
    cardLastFour: z.string().optional(),
  }).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  session: z.string().optional(), // This is optional in backend
});

export const refundSchema = z.object({
  paymentId: z.string().min(1, 'Payment is required'),
  amount: z.number().min(1, 'Amount must be at least 1'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
  description: z.string().optional(),
})

export const waiverSchema = z.object({
  feeInstanceId: z.string().min(1, 'Fee instance is required'),
  type: z.enum(['full', 'partial', 'scholarship', 'staff_discount', 'sibling_discount']),
  amount: z.number().min(0).optional(),
  percentage: z.number().min(0).max(100).optional(),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
  supportingDocuments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    uploadedAt: z.date(),
  })).optional(),
  effectiveFrom: z.date().optional(),
  effectiveUntil: z.date().optional(),
}).refine(data => data.amount || data.percentage, {
  message: 'Either amount or percentage must be provided',
  path: ['amount'],
})

export const feeInstanceUpdateSchema = z.object({
  notes: z.string().optional(),
  dueDate: z.date().optional(),
  status: z.enum(['pending', 'unpaid', 'partial', 'paid', 'waived', 'cancelled', 'overdue']).optional(),
})

export const advanceBalanceSchema = z.object({
  studentId: z.string(),
  feeInstanceId: z.string(),
  amount: z.number().min(1, 'Amount must be at least 1'),
})