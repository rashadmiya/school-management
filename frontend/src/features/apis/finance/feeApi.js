// src/api/feeApi.js

import { api } from "../api"

export const feeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Fee Templates
    // getFeeTemplates: builder.query({
    //   query: ({ isActive, session, page = 1, limit = 20 } = {}) => ({
    //     url: '/fees/templates',
    //     params: { isActive, session, page, limit },
    //   }),
    //   providesTags: ['FeeTemplate'],
    // }),

    getFeeTemplate: builder.query({
      query: (id) => `/fees/templates/${id}`,
      providesTags: (result, error, id) => [{ type: 'FeeTemplate', id }],
    }),

    // createFeeTemplate: builder.mutation({
    //   query: (data) => ({
    //     url: '/fees/templates',
    //     method: 'POST',
    //     body: data,
    //   }),
    //   invalidatesTags: ['FeeTemplate'],
    // }),

    updateFeeTemplate: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/fees/templates/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'FeeTemplate', id }],
    }),

    deleteFeeTemplate: builder.mutation({
      query: (id) => ({
        url: `/fees/templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FeeTemplate'],
    }),

    // applyFeeTemplate: builder.mutation({
    //   query: ({ id, ...options }) => ({
    //     url: `/fees/templates/${id}/apply`,
    //     method: 'POST',
    //     body: options,
    //   }),
    //   invalidatesTags: ['FeeInstance', 'Ledger', 'Student'],
    // }),

    // Student Fees
    getStudentFees: builder.query({
      query: ({ studentId, session, status }) => ({
        url: `/fees/student/${studentId}`,
        params: { session, status },
      }),
      providesTags: ['FeeInstance'],
    }),

    getFeeSummary: builder.query({
      query: ({ studentId, session }) => ({
        url: `/fees/student/${studentId}/summary`,
        params: { session },
      }),
      providesTags: ['FeeInstance'],
    }),

    getStudentFeeDetails: builder.query({
      query: (studentId) => `/fees/student/${studentId}/details`,
      providesTags: ['FeeInstance'],
    }),

    // Fee Instances
    updateFeeInstance: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/fees/instances/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['FeeInstance'],
    }),

    deleteFeeInstance: builder.mutation({
      query: (id) => ({
        url: `/fees/instances/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FeeInstance', 'Ledger'],
    }),

    // Bulk Operations
    generateFeeInstances: builder.mutation({
      query: (data) => ({
        url: '/fees/generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['FeeInstance', 'Ledger'],
    }),

    // Reports
    getFeeCollectionReport: builder.query({
      query: ({ startDate, endDate, classId, session }) => ({
        url: '/reports/collection/fees',
        params: { startDate, endDate, classId, session },
      }),
      providesTags: ['Report'],
    }),

    getOutstandingFeesReport: builder.query({
      query: ({ session, classId, overdueOnly }) => ({
        url: '/fees/reports/outstanding',
        params: { session, classId, overdueOnly },
      }),
      providesTags: ['Report'],
    }),

    // new api endpoints can be added here
    // Fee Templates
    getFeeTemplates: builder.query({
      query: ({ isActive, session } = {}) => ({
        url: '/fees/templates',
        params: { isActive, session },
      }),
      providesTags: ['FeeTemplate'],
    }),

    // Add this new endpoint to get students by template scope
    getStudentsByTemplateScope: builder.query({
      query: ({ templateId, session }) => ({
        url: `/fees/templates/${templateId}/eligible-students`,
        params: { session },
      }),
      providesTags: ['Student'],
    }),

    createFeeTemplate: builder.mutation({
      query: (data) => ({
        url: '/fees/templates',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['FeeTemplate'],
    }),

    applyFeeTemplate: builder.mutation({
      query: ({ id, force = false }) => ({
        url: `/fees/templates/${id}/apply`,
        method: 'POST',
        body: { force }, // Backend expects options object with force property
      }),
      invalidatesTags: ['FeeInstance', 'Ledger', 'Student'],
    }),

    // Add this utility endpoint for session
    getCurrentSession: builder.query({
      query: () => '/fees/current-session',
      providesTags: ['Session'],
    }),

    // Session Management
    setSession: builder.mutation({
      query: (session) => ({
        url: '/fees/set-session',
        method: 'POST',
        body: { session },
      }),
      invalidatesTags: ['Session'],
    }),


  }),
})

export const {
  useGetFeeTemplatesQuery,
  useGetFeeTemplateQuery,
  useCreateFeeTemplateMutation,
  useUpdateFeeTemplateMutation,
  useDeleteFeeTemplateMutation,
  useApplyFeeTemplateMutation,
  useGetStudentFeesQuery,
  useGetFeeSummaryQuery,
  useGetStudentFeeDetailsQuery,
  useUpdateFeeInstanceMutation,
  useDeleteFeeInstanceMutation,
  useGenerateFeeInstancesMutation,
  useGetFeeCollectionReportQuery,
  useGetOutstandingFeesReportQuery,
  // new hooks can be exported here
  useGetStudentsByTemplateScopeQuery,
  useGetCurrentSessionQuery,
  useSetSessionMutation,
} = feeApi