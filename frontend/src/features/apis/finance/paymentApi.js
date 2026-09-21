// // src/features/apis/finance/paymentApi.js
// import { api } from '../../api';

// export const paymentApi = api.injectEndpoints({
//     endpoints: (builder) => ({
//         // ============ RECEIVE PAYMENT ============
//         receivePayment: builder.mutation({
//             query: (data) => ({
//                 url: '/payments',
//                 method: 'POST',
//                 body: data,
//             }),
//             invalidatesTags: [
//                 'Payment', 'FeeInstance', 'Ledger',
//                 'AdvanceBalance', 'Student', 'Bill', 'Report',
//             ],
//         }),

//         // ============ VOID PAYMENT ============
//         voidPayment: builder.mutation({
//             query: ({ id, reason }) => ({
//                 url: `/payments/${id}/void`,
//                 method: 'POST',
//                 body: { reason },
//             }),
//             invalidatesTags: [
//                 'Payment', 'FeeInstance', 'Ledger',
//                 'AdvanceBalance', 'Student', 'Bill', 'Report',
//             ],
//         }),

//         // ============ SEARCH ============
//         searchPayments: builder.query({
//             query: ({
//                 search = '',
//                 session,
//                 method,
//                 status = 'completed',
//                 startDate,
//                 endDate,
//                 page = 1,
//                 limit = 20,
//             } = {}) => ({
//                 url: '/payments/search',
//                 params: { search, session, method, status, startDate, endDate, page, limit },
//             }),
//             providesTags: ['Payment'],
//         }),

//         // ============ STUDENT HISTORY ============
//         getPaymentHistory: builder.query({
//             query: ({ studentId, session, limit = 50 }) => ({
//                 url: `/payments/student/${studentId}`,
//                 params: { session, limit },
//             }),
//             providesTags: ['Payment'],
//         }),

//         // ============ ALLOCATIONS ============
//         getPaymentAllocations: builder.query({
//             query: (paymentId) => `/payments/${paymentId}/allocations`,
//             providesTags: ['Payment'],
//         }),

//         // ============ ADVANCE BALANCE ============
//         getAdvanceBalance: builder.query({
//             query: (studentId) => `/payments/student/${studentId}/advance`,
//             providesTags: ['AdvanceBalance'],
//         }),

//         useAdvanceBalance: builder.mutation({
//             query: (data) => ({
//                 url: '/payments/use-advance',
//                 method: 'POST',
//                 body: data,
//             }),
//             invalidatesTags: ['FeeInstance', 'AdvanceBalance', 'Ledger', 'Bill'],
//         }),

//         autoApplyAdvance: builder.mutation({
//             query: (data) => ({
//                 url: '/payments/auto-apply-advance',
//                 method: 'POST',
//                 body: data,
//             }),
//             invalidatesTags: ['FeeInstance', 'AdvanceBalance', 'Ledger', 'Bill'],
//         }),
//     }),
// });

// export const {
//     useReceivePaymentMutation,
//     useVoidPaymentMutation,
//     useSearchPaymentsQuery,
//     useLazySearchPaymentsQuery,
//     useGetPaymentHistoryQuery,
//     useLazyGetPaymentHistoryQuery,
//     useGetPaymentAllocationsQuery,
//     useGetAdvanceBalanceQuery,
//     useUseAdvanceBalanceMutation,
//     useAutoApplyAdvanceMutation,
// } = paymentApi;
// src/api/paymentApi.js
import { api } from "../api";

export const paymentApi = api.injectEndpoints({
    endpoints: (builder) => ({
        receivePayment: builder.mutation({
            query: (paymentData) => ({
                url: '/payments',
                method: 'POST',
                body: paymentData,
            }),
            invalidatesTags: ['Payment', 'FeeInstance', 'Ledger', 'AdvanceBalance', 'Student', 'Bill'],
        }),

        voidPayment: builder.mutation({
            query: ({ id, reason }) => ({
                url: `/payments/${id}/void`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: ['Payment', 'FeeInstance', 'Ledger', 'AdvanceBalance', 'Student', 'Bill'],
        }),

        searchPayments: builder.query({
            query: ({ search = '', session, method, status = 'completed', startDate, endDate, page = 1, limit = 20 } = {}) => ({
                url: '/payments/search',
                params: { search, session, method, status, startDate, endDate, page, limit },
            }),
            providesTags: ['Payment'],
        }),

        getPaymentHistory: builder.query({
            query: ({ studentId, session, limit = 50 }) => ({
                url: `/payments/student/${studentId}`,
                params: { session, limit },
            }),
            providesTags: ['Payment'],
        }),

        getPaymentAllocations: builder.query({
            query: (paymentId) => `/payments/${paymentId}/allocations`,
            providesTags: ['Payment'],
        }),

        getAdvanceBalance: builder.query({
            query: (studentId) => `/payments/student/${studentId}/advance`,
            providesTags: ['AdvanceBalance'],
        }),

        useAdvanceBalance: builder.mutation({
            query: (data) => ({
                url: '/payments/use-advance',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['FeeInstance', 'AdvanceBalance', 'Ledger', 'Bill'],
        }),

        autoApplyAdvance: builder.mutation({
            query: (data) => ({
                url: '/payments/auto-apply-advance',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['FeeInstance', 'AdvanceBalance', 'Ledger', 'Bill'],
        }),

        // Reports — these live under /reports
        getPaymentCollectionReport: builder.query({
            query: ({ startDate, endDate, method, classId, session }) => ({
                url: '/reports/collection/payments',
                params: { startDate, endDate, method, classId, session },
            }),
            providesTags: ['Report'],
        }),
    }),
});

export const {
    useReceivePaymentMutation,
    useVoidPaymentMutation,
    useSearchPaymentsQuery,
    useLazySearchPaymentsQuery,
    useGetPaymentHistoryQuery,
    useLazyGetPaymentHistoryQuery,
    useGetPaymentAllocationsQuery,
    useGetAdvanceBalanceQuery,
    useUseAdvanceBalanceMutation,
    useAutoApplyAdvanceMutation,
    useGetPaymentCollectionReportQuery,
} = paymentApi;

// // src/api/paymentApi.js

// import { api } from "../api"

// export const paymentApi = api.injectEndpoints({
//   endpoints: (builder) => ({

//     // Receive Payment - CORRECT
//     receivePayment: builder.mutation({
//       query: (paymentData) => ({
//         url: '/payments',
//         method: 'POST',
//         body: paymentData,
//       }),
//       invalidatesTags: ['Payment', 'FeeInstance', 'Ledger', 'AdvanceBalance', 'Student'],
//     }),

//     // Get Payments
//     getPayments: builder.query({
//       query: ({ page = 1, limit = 20, startDate, endDate, method, studentId } = {}) => ({
//         url: '/payments',
//         params: { page, limit, startDate, endDate, method, studentId },
//       }),
//       providesTags: ['Payment'],
//     }),

//     getPayment: builder.query({
//       query: (id) => `/payments/${id}`,
//       providesTags: (result, error, id) => [{ type: 'Payment', id }],
//     }),

//     // Payment Allocations
//     getPaymentAllocations: builder.query({
//       query: (paymentId) => ({
//         url: `/payments/${paymentId}/allocations`,
//       }),
//       providesTags: ['Payment'],
//     }),

//     // Advance Balance
//     getAdvanceBalance: builder.query({
//       query: (studentId) => ({
//         url: `/payments/student/${studentId}/advance`,
//       }),
//       providesTags: ['AdvanceBalance'],
//     }),

//     useAdvanceBalance: builder.mutation({
//       query: (data) => ({
//         url: '/payments/use-advance',
//         method: 'POST',
//         body: data,
//       }),
//       invalidatesTags: ['FeeInstance', 'AdvanceBalance', 'Ledger'],
//     }),

//     autoApplyAdvance: builder.mutation({
//       query: (data) => ({
//         url: '/payments/auto-apply-advance',
//         method: 'POST',
//         body: data,
//       }),
//       invalidatesTags: ['FeeInstance', 'AdvanceBalance', 'Ledger'],
//     }),

//     // Bulk Payments
//     processBulkPayments: builder.mutation({
//       query: (data) => ({
//         url: '/payments/bulk',
//         method: 'POST',
//         body: data,
//       }),
//       invalidatesTags: ['Payment', 'FeeInstance', 'Ledger', 'AdvanceBalance'],
//     }),

//     // Verify Payment
//     verifyPayment: builder.mutation({
//       query: ({ id, ...data }) => ({
//         url: `/payments/${id}/verify`,
//         method: 'POST',
//         body: data,
//       }),
//       invalidatesTags: ['Payment'],
//     }),

//     // Reports
//     getPaymentCollectionReport: builder.query({
//       query: ({ startDate, endDate, method, classId, session }) => ({
//         url: '/reports/collection/payments',
//         params: { startDate, endDate, method, classId, session },
//       }),
//       providesTags: ['Report'],
//     }),

//     getDailyCollectionReport: builder.query({
//       query: ({ date }) => ({
//         url: '/payments/reports/daily',
//         params: { date },
//       }),
//       providesTags: ['Report'],
//     }),

//     // Get Payment History for Student - UPDATE THIS
//     getPaymentHistory: builder.query({
//       query: ({ studentId, session, limit = 50 }) => ({
//         url: `/payments/student/${studentId}`,
//         params: { session, limit },
//       }),
//       providesTags: (result, error, { studentId }) => [
//         { type: 'Payment', id: studentId }
//       ],
//     }),

//     // Get All Payments (for admin view) - ADD THIS IF NEEDED
//     getAllPayments: builder.query({
//       query: ({ page = 1, limit = 20, startDate, endDate, method } = {}) => ({
//         url: '/payments/all', // You need to create this backend endpoint
//         params: { page, limit, startDate, endDate, method },
//       }),
//       providesTags: ['Payment'],
//     }),

//      // NEW: Search payments with filters
//     searchPayments: builder.query({
//       query: ({ 
//         search = '', 
//         session, 
//         method, 
//         status = 'completed', 
//         startDate, 
//         endDate, 
//         page = 1, 
//         limit = 20 
//       } = {}) => ({
//         url: '/payments/search',
//         params: { 
//           search, 
//           session, 
//           method, 
//           status, 
//           startDate, 
//           endDate, 
//           page, 
//           limit 
//         },
//       }),
//       providesTags: ['Payment'],
//     }),

//     // Use lazy query for manual triggering
//     searchPaymentsLazy: builder.query({
//       query: (params) => ({
//         url: '/payments/search',
//         params,
//       }),
//     }),

//     // Lazy query for student payment history
//     getPaymentHistoryLazy: builder.query({
//       query: ({ studentId, session, limit = 50 }) => ({
//         url: `/payments/student/${studentId}`,
//         params: { session, limit },
//       }),
//     }),

//   }),
// })

// export const {
//   useReceivePaymentMutation,
//   useGetPaymentsQuery,
//   useGetPaymentQuery,
//   useGetPaymentHistoryQuery,
//   useGetPaymentAllocationsQuery,
//   useGetAdvanceBalanceQuery,
//   useUseAdvanceBalanceMutation,
//   useAutoApplyAdvanceMutation,
//   useProcessBulkPaymentsMutation,
//   useVerifyPaymentMutation,
//   useGetPaymentCollectionReportQuery,
//   useGetDailyCollectionReportQuery,
//   useGetAllPaymentsQuery,
//   useSearchPaymentsQuery,
//   useLazySearchPaymentsLazyQuery,
//   useLazyGetPaymentHistoryLazyQuery,

  
// } = paymentApi