// src/api/reconciliationApi.js
import { api } from "../api";

export const reconciliationApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getDailyReconciliation: builder.query({
            query: ({ date, session } = {}) => ({
                url: '/reconciliation/daily',
                params: { date, session },
            }),
            providesTags: ['Reconciliation'],
        }),

        getRangeReconciliation: builder.query({
            query: ({ startDate, endDate, session }) => ({
                url: '/reconciliation/range',
                params: { startDate, endDate, session },
            }),
            providesTags: ['Reconciliation'],
        }),

        getAgingReport: builder.query({
            query: ({ session, classId, asOfDate } = {}) => ({
                url: '/reconciliation/aging',
                params: { session, classId, asOfDate },
            }),
            providesTags: ['Reconciliation'],
        }),
    }),
});

export const {
    useGetDailyReconciliationQuery,
    useLazyGetDailyReconciliationQuery,
    useGetRangeReconciliationQuery,
    useGetAgingReportQuery,
} = reconciliationApi;