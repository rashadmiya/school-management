// src/features/apis/finance/billApi.js
import { api } from '../api';

export const billApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getMonthlyBills: builder.query({
            query: ({ studentId, session } = {}) => ({
                url: `/bills/student/${studentId}/monthly`,
                params: { session },
            }),
            providesTags: (r, e, { studentId }) => [
                { type: 'Bill', id: studentId },
                'Bill',
            ],
        }),

        getCurrentBill: builder.query({
            query: ({ studentId, session } = {}) => ({
                url: `/bills/student/${studentId}/current`,
                params: { session },
            }),
            providesTags: (r, e, { studentId }) => [
                { type: 'Bill', id: studentId },
                'Bill',
            ],
        }),

        getStudentStatement: builder.query({
            query: ({ studentId, session } = {}) => ({
                url: `/bills/student/${studentId}/statement`,
                params: { session },
            }),
            providesTags: (r, e, { studentId }) => [
                { type: 'Statement', id: studentId },
                'Statement',
                'Bill',
                'FeeInstance',
                'Payment',
            ],
        }),
    }),
});

export const {
    useGetMonthlyBillsQuery,
    useGetCurrentBillQuery,
    useGetStudentStatementQuery,
} = billApi;

// // src/api/billApi.js
// import { api } from "../api";

// export const billApi = api.injectEndpoints({
//     endpoints: (builder) => ({
//         getMonthlyBills: builder.query({
//             query: ({ studentId, session } = {}) => ({
//                 url: `/bills/student/${studentId}/monthly`,
//                 params: { session },
//             }),
//             providesTags: ['Bill'],
//         }),

//         getCurrentBill: builder.query({
//             query: ({ studentId, session } = {}) => ({
//                 url: `/bills/student/${studentId}/current`,
//                 params: { session },
//             }),
//             providesTags: ['Bill'],
//         }),

//         getStudentStatement: builder.query({
//             query: ({ studentId, session } = {}) => ({
//                 url: `/bills/student/${studentId}/statement`,
//                 params: { session },
//             }),
//             providesTags: ['Bill', 'FeeInstance', 'Payment'],
//         }),
//     }),
// });

// export const {
//     useGetMonthlyBillsQuery,
//     useGetCurrentBillQuery,
//     useGetStudentStatementQuery,
// } = billApi;