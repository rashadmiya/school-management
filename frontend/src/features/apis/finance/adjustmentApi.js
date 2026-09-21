// src/features/apis/finance/adjustmentApi.js
import { api } from '../api';

export const adjustmentApi = api.injectEndpoints({
    endpoints: (builder) => ({
        requestAdjustment: builder.mutation({
            query: (data) => ({
                url: '/adjustments',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Adjustment'],
        }),

        approveAdjustment: builder.mutation({
            query: ({ id, remarks }) => ({
                url: `/adjustments/${id}/approve`,
                method: 'POST',
                body: { remarks },
            }),
            invalidatesTags: ['Adjustment'],
        }),

        rejectAdjustment: builder.mutation({
            query: ({ id, reason }) => ({
                url: `/adjustments/${id}/reject`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: ['Adjustment'],
        }),

        applyAdjustment: builder.mutation({
            query: (id) => ({
                url: `/adjustments/${id}/apply`,
                method: 'POST',
            }),
            invalidatesTags: [
                'Adjustment', 'FeeInstance', 'Ledger',
                'Bill', 'Statement', 'Student',
            ],
        }),

        listAdjustments: builder.query({
            query: ({ studentId, status, category, limit = 50, page = 1 } = {}) => ({
                url: '/adjustments',
                params: { studentId, status, category, limit, page },
            }),
            providesTags: ['Adjustment'],
        }),
    }),
});

export const {
    useRequestAdjustmentMutation,
    useApproveAdjustmentMutation,
    useRejectAdjustmentMutation,
    useApplyAdjustmentMutation,
    useListAdjustmentsQuery,
} = adjustmentApi;

// // src/api/adjustmentApi.js
// import { api } from "../api";

// export const adjustmentApi = api.injectEndpoints({
//     endpoints: (builder) => ({
//         requestAdjustment: builder.mutation({
//             query: (data) => ({
//                 url: '/adjustments',
//                 method: 'POST',
//                 body: data,
//             }),
//             invalidatesTags: ['Adjustment'],
//         }),

//         approveAdjustment: builder.mutation({
//             query: ({ id, remarks }) => ({
//                 url: `/adjustments/${id}/approve`,
//                 method: 'POST',
//                 body: { remarks },
//             }),
//             invalidatesTags: ['Adjustment'],
//         }),

//         rejectAdjustment: builder.mutation({
//             query: ({ id, reason }) => ({
//                 url: `/adjustments/${id}/reject`,
//                 method: 'POST',
//                 body: { reason },
//             }),
//             invalidatesTags: ['Adjustment'],
//         }),

//         applyAdjustment: builder.mutation({
//             query: (id) => ({
//                 url: `/adjustments/${id}/apply`,
//                 method: 'POST',
//             }),
//             invalidatesTags: ['Adjustment', 'FeeInstance', 'Ledger', 'Bill', 'Student'],
//         }),

//         listAdjustments: builder.query({
//             query: ({ studentId, status, category, limit = 50 } = {}) => ({
//                 url: '/adjustments',
//                 params: { studentId, status, category, limit },
//             }),
//             providesTags: ['Adjustment'],
//         }),
//     }),
// });

// export const {
//     useRequestAdjustmentMutation,
//     useApproveAdjustmentMutation,
//     useRejectAdjustmentMutation,
//     useApplyAdjustmentMutation,
//     useListAdjustmentsQuery,
// } = adjustmentApi;