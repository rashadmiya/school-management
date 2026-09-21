// src/api/reportApi.js
import { api } from "../api";

export const reportApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getPaymentCollectionReport: builder.query({
            query: ({ session, startDate, endDate, method, classId } = {}) => ({
                url: '/reports/collection/payments',
                params: { session, startDate, endDate, method, classId },
            }),
            providesTags: ['Report'],
        }),

        getFeeCollectionReport: builder.query({
            query: ({ session, startDate, endDate, classId } = {}) => ({
                url: '/reports/collection/fees',
                params: { session, startDate, endDate, classId },
            }),
            providesTags: ['Report'],
        }),

        getFinanceDashboard: builder.query({
            query: ({ session } = {}) => ({
                url: '/reports/dashboard/finance',
                params: { session },
            }),
            providesTags: ['Report'],
        }),
    }),
});

export const {
    useGetPaymentCollectionReportQuery,
    useGetFeeCollectionReportQuery,
    useGetFinanceDashboardQuery,
} = reportApi;