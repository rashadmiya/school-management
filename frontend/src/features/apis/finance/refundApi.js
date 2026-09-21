// src/features/apis/finance/refundApi.js
import { api } from '../api';

export const refundApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // 1. Request
        requestRefund: builder.mutation({
            query: (data) => ({
                url: '/refunds',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Refund', 'Payment'],
        }),

        // 2. Approve
        approveRefund: builder.mutation({
            query: ({ id, remarks }) => ({
                url: `/refunds/${id}/approve`,
                method: 'POST',
                body: { remarks },
            }),
            invalidatesTags: ['Refund'],
        }),

        // 3. Reject
        rejectRefund: builder.mutation({
            query: ({ id, reason }) => ({
                url: `/refunds/${id}/reject`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: ['Refund'],
        }),

        // 4. Process (money out)
        processRefund: builder.mutation({
            query: ({ id, ...methodData }) => ({
                url: `/refunds/${id}/process`,
                method: 'POST',
                body: methodData,
            }),
            invalidatesTags: [
                'Refund', 'Payment', 'FeeInstance', 'Ledger',
                'AdvanceBalance', 'Bill', 'Statement', 'Student',
            ],
        }),

        // Lists
        listRefunds: builder.query({
            query: ({ status, studentId, limit = 50, page = 1 } = {}) => ({
                url: '/refunds',
                params: { status, studentId, limit, page },
            }),
            providesTags: ['Refund'],
        }),

        getRefundHistory: builder.query({
            query: ({ studentId, session, limit = 20 }) => ({
                url: `/refunds/student/${studentId}`,
                params: { session, limit },
            }),
            providesTags: ['Refund'],
        }),
    }),
});

export const {
    useRequestRefundMutation,
    useApproveRefundMutation,
    useRejectRefundMutation,
    useProcessRefundMutation,
    useListRefundsQuery,
    useGetRefundHistoryQuery,
} = refundApi;

// // src/api/refundApi.js
// import { api } from "../api";

// export const refundApi = api.injectEndpoints({
//     endpoints: (builder) => ({
//         requestRefund: builder.mutation({
//             query: (data) => ({
//                 url: '/refunds',
//                 method: 'POST',
//                 body: data,
//             }),
//             invalidatesTags: ['Refund', 'Payment'],
//         }),

//         approveRefund: builder.mutation({
//             query: ({ id, remarks }) => ({
//                 url: `/refunds/${id}/approve`,
//                 method: 'POST',
//                 body: { remarks },
//             }),
//             invalidatesTags: ['Refund'],
//         }),

//         rejectRefund: builder.mutation({
//             query: ({ id, reason }) => ({
//                 url: `/refunds/${id}/reject`,
//                 method: 'POST',
//                 body: { reason },
//             }),
//             invalidatesTags: ['Refund'],
//         }),

//         processRefund: builder.mutation({
//             query: ({ id, ...methodData }) => ({
//                 url: `/refunds/${id}/process`,
//                 method: 'POST',
//                 body: methodData,
//             }),
//             invalidatesTags: ['Refund', 'Payment', 'FeeInstance', 'Ledger', 'AdvanceBalance', 'Bill', 'Student'],
//         }),

//         listRefunds: builder.query({
//             query: ({ status, studentId, limit = 50 } = {}) => ({
//                 url: '/refunds',
//                 params: { status, studentId, limit },
//             }),
//             providesTags: ['Refund'],
//         }),

//         getRefundHistory: builder.query({
//             query: ({ studentId, session, limit = 20 }) => ({
//                 url: `/refunds/student/${studentId}`,
//                 params: { session, limit },
//             }),
//             providesTags: ['Refund'],
//         }),
//     }),
// });

// export const {
//     useRequestRefundMutation,
//     useApproveRefundMutation,
//     useRejectRefundMutation,
//     useProcessRefundMutation,
//     useListRefundsQuery,
//     useGetRefundHistoryQuery,
// } = refundApi;

// // src/api/refundApi.js

// import { api } from "../api"

// export const refundApi = api.injectEndpoints({
//   endpoints: (builder) => ({
//     // Process Refund
//     processRefund: builder.mutation({
//       query: (refundData) => ({
//         url: '/refunds',
//         method: 'POST',
//         body: refundData,
//       }),
//       invalidatesTags: ['Refund', 'Payment', 'FeeInstance', 'Ledger', 'AdvanceBalance'],
//     }),

//     // Get Refunds
//     getRefunds: builder.query({
//       query: ({ page = 1, limit = 20, startDate, endDate, studentId } = {}) => ({
//         url: '/refunds',
//         params: { page, limit, startDate, endDate, studentId },
//       }),
//       providesTags: ['Refund'],
//     }),

//     getRefund: builder.query({
//       query: (id) => `/refunds/${id}`,
//       providesTags: (result, error, id) => [{ type: 'Refund', id }],
//     }),

//     // Refund History
//     getRefundHistory: builder.query({
//       query: ({ studentId, session, limit = 20 }) => ({
//         url: `/refunds/student/${studentId}`,
//         params: { session, limit },
//       }),
//       providesTags: ['Refund'],
//     }),

//     // Validate Refund
//     validateRefund: builder.query({
//       query: ({ paymentId, amount }) => ({
//         url: `/refunds/validate/${paymentId}`,
//         params: { amount },
//       }),
//     }),

//     // Update Refund Status
//     updateRefundStatus: builder.mutation({
//       query: ({ id, status, reason }) => ({
//         url: `/refunds/${id}/status`,
//         method: 'PUT',
//         body: { status, reason },
//       }),
//       invalidatesTags: ['Refund'],
//     }),

//     // Reports
//     getRefundReport: builder.query({
//       query: ({ startDate, endDate, reason }) => ({
//         url: '/refunds/reports',
//         params: { startDate, endDate, reason },
//       }),
//       providesTags: ['Report'],
//     }),
//   }),
// })

// export const {
//   useProcessRefundMutation,
//   useGetRefundsQuery,
//   useGetRefundQuery,
//   useGetRefundHistoryQuery,
//   useValidateRefundQuery,
//   useUpdateRefundStatusMutation,
//   useGetRefundReportQuery,
// } = refundApi