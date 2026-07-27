// src/api/ledgerApi.js

import { api } from "../api"

export const ledgerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Student Ledger
    getStudentLedger: builder.query({
      query: ({ studentId, startDate, endDate, limit = 100, page = 1 }) => ({
        url: `/ledger/${studentId}`,
        params: { startDate, endDate, limit, page },
      }),
      providesTags: ['Ledger'],
    }),

    validateLedger: builder.query({
      query: (studentId) => ({
        url: `/ledger/${studentId}/validate`,
      }),
    }),

    getCurrentBalance: builder.query({
      query: (studentId) => ({
        url: `/ledger/${studentId}/balance`,
      }),
      providesTags: ['Ledger'],
    }),

    // Ledger Entries
    getLedgerEntries: builder.query({
      query: ({ startDate, endDate, type, studentId, page = 1, limit = 50 }) => ({
        url: '/ledger/entries',
        params: { startDate, endDate, type, studentId, page, limit },
      }),
      providesTags: ['Ledger'],
    }),

    // Ledger Reports
    getLedgerReport: builder.query({
      query: ({ startDate, endDate, studentId, classId }) => ({
        url: '/ledger/reports',
        params: { startDate, endDate, studentId, classId },
      }),
      providesTags: ['Report'],
    }),

    getLedgerSummary: builder.query({
      query: ({ date, session }) => ({
        url: '/ledger/summary',
        params: { date, session },
      }),
      providesTags: ['Report'],
    }),

    // Ledger Reports
    getDashboardData: builder.query({
      query: ({ session }) => ({
        url: '/reports/dashboard/finance',
        params: { session },
      }),
      providesTags: ['Report'],
    }),

  }),
})

export const {
  useGetStudentLedgerQuery,
  useValidateLedgerQuery,
  useGetCurrentBalanceQuery,
  useGetLedgerEntriesQuery,
  useGetLedgerReportQuery,
  useGetLedgerSummaryQuery,
  useGetDashboardDataQuery,
} = ledgerApi