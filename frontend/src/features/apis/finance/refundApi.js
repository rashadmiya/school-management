// src/api/refundApi.js

import { api } from "../api"

export const refundApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Process Refund
    processRefund: builder.mutation({
      query: (refundData) => ({
        url: '/refunds',
        method: 'POST',
        body: refundData,
      }),
      invalidatesTags: ['Refund', 'Payment', 'FeeInstance', 'Ledger', 'AdvanceBalance'],
    }),

    // Get Refunds
    getRefunds: builder.query({
      query: ({ page = 1, limit = 20, startDate, endDate, studentId } = {}) => ({
        url: '/refunds',
        params: { page, limit, startDate, endDate, studentId },
      }),
      providesTags: ['Refund'],
    }),

    getRefund: builder.query({
      query: (id) => `/refunds/${id}`,
      providesTags: (result, error, id) => [{ type: 'Refund', id }],
    }),

    // Refund History
    getRefundHistory: builder.query({
      query: ({ studentId, session, limit = 20 }) => ({
        url: `/refunds/student/${studentId}`,
        params: { session, limit },
      }),
      providesTags: ['Refund'],
    }),

    // Validate Refund
    validateRefund: builder.query({
      query: ({ paymentId, amount }) => ({
        url: `/refunds/validate/${paymentId}`,
        params: { amount },
      }),
    }),

    // Update Refund Status
    updateRefundStatus: builder.mutation({
      query: ({ id, status, reason }) => ({
        url: `/refunds/${id}/status`,
        method: 'PUT',
        body: { status, reason },
      }),
      invalidatesTags: ['Refund'],
    }),

    // Reports
    getRefundReport: builder.query({
      query: ({ startDate, endDate, reason }) => ({
        url: '/refunds/reports',
        params: { startDate, endDate, reason },
      }),
      providesTags: ['Report'],
    }),
  }),
})

export const {
  useProcessRefundMutation,
  useGetRefundsQuery,
  useGetRefundQuery,
  useGetRefundHistoryQuery,
  useValidateRefundQuery,
  useUpdateRefundStatusMutation,
  useGetRefundReportQuery,
} = refundApi