// src/api/waiverApi.js

import { api } from "../api"

export const waiverApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Waiver Requests
    requestWaiver: builder.mutation({
      query: (waiverData) => ({
        url: '/waivers/request',
        method: 'POST',
        body: waiverData,
      }),
      invalidatesTags: ['Waiver'],
    }),

    getWaiverRequests: builder.query({
      query: ({ studentId, status, limit = 50, page = 1 }) => ({
        url: '/waivers',
        params: { studentId, status, limit, page },
      }),
      providesTags: ['Waiver'],
    }),

    getWaiverRequest: builder.query({
      query: (id) => `/waivers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Waiver', id }],
    }),

    getEligibleWaiver: builder.query({
      query: (feeInstanceId) => ({
        url: `/waivers/eligible/${feeInstanceId}`,
      }),
      providesTags: ['Waiver'],
    }),

    // Waiver Approval
    approveWaiver: builder.mutation({
      query: ({ id, remarks }) => ({
        url: `/waivers/${id}/approve`,
        method: 'POST',
        body: { remarks },
      }),
      invalidatesTags: ['Waiver', 'FeeInstance', 'Ledger'],
    }),

    rejectWaiver: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/waivers/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Waiver'],
    }),

    revokeWaiver: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/waivers/${id}/revoke`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Waiver', 'FeeInstance', 'Ledger'],
    }),

    updateWaiver: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/waivers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Waiver'],
    }),

    // Reports
    getWaiverReport: builder.query({
      query: ({ startDate, endDate, type, status }) => ({
        url: '/waivers/reports',
        params: { startDate, endDate, type, status },
      }),
      providesTags: ['Report'],
    }),
  }),
})

export const {
  useRequestWaiverMutation,
  useGetWaiverRequestsQuery,
  useGetWaiverRequestQuery,
  useGetEligibleWaiverQuery,
  useApproveWaiverMutation,
  useRejectWaiverMutation,
  useRevokeWaiverMutation,
  useUpdateWaiverMutation,
  useGetWaiverReportQuery,
} = waiverApi