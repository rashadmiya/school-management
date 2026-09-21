// src/api/auditApi.js
import { api } from "../api";

export const auditApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getAuditLogs: builder.query({
            query: ({ studentId, actor, action, refId, refModel, startDate, endDate, limit = 100 } = {}) => ({
                url: '/audit',
                params: { studentId, actor, action, refId, refModel, startDate, endDate, limit },
            }),
            providesTags: ['Audit'],
        }),

        getAuditLogsForRef: builder.query({
            query: ({ refModel, refId }) => `/audit/ref/${refModel}/${refId}`,
            providesTags: ['Audit'],
        }),
    }),
});

export const {
    useGetAuditLogsQuery,
    useGetAuditLogsForRefQuery,
} = auditApi;