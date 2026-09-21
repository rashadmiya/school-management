// features/apis/parentPortalApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import { parentBaseQuery } from "./baseQueryParent";

export const parentPortalApi = createApi({
    reducerPath: "parentPortalApi",
    baseQuery: parentBaseQuery,
    tagTypes: ["ParentPortal", "ParentDashboard", "ParentChildren", "ChildFinance"],
    endpoints: (builder) => ({
        getMyChildren: builder.query({
            query: () => "/parent/my/children",
            providesTags: ["ParentChildren"],
        }),

        getMyDashboard: builder.query({
            query: ({ session } = {}) => ({
                url: "/parent/my/dashboard",
                params: session ? { session } : {},
            }),
            providesTags: ["ParentDashboard"],
        }),

        getChildFinance: builder.query({
            query: ({ childId, session } = {}) => ({
                url: `/parent/my/children/${childId}/finance`,
                params: session ? { session } : {},
            }),
            providesTags: (result, error, arg) => [
                { type: "ChildFinance", id: arg.childId },
            ],
        }),

        getMyProfile: builder.query({
            query: () => "/parent/my/profile",
            providesTags: ["ParentPortal"],
        }),

        updateMyProfile: builder.mutation({
            query: (data) => ({
                url: "/parent/my/profile",
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["ParentPortal"],
        }),

        getChildrenAttendance: builder.query({
            query: ({ childId, subjectId, startDate, endDate, limit = 500 } = {}) => ({
                url: "/parent/my/children/attendance",
                params: {
                    ...(childId && childId !== "all" && { childId }),
                    ...(subjectId && subjectId !== "all" && { subjectId }),
                    ...(startDate && { startDate }),
                    ...(endDate && { endDate }),
                    limit,
                },
            }),
            providesTags: ["ParentChildren", "ParentAttendance"],
        }),

        getChildrenResults: builder.query({
            query: ({ childId, term, year, limit } = {}) => ({
                url: "/parent/my/children/results",
                params: {
                    ...(childId && { childId }),
                    ...(term && { term }),
                    ...(year && { year }),
                    ...(limit && { limit }),
                },
            }),
            providesTags: ["ParentChildren", "ParentResults"],
        }),

        createChildPaymentIntent: builder.mutation({
            query: ({ childId, ...data }) => ({
                url: `/parent/my/children/${childId}/payment-intents`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["ParentDashboard", "ChildFinance"],
        }),

        getParentPaymentIntent: builder.query({
            query: (intentId) => `/parent/my/payment-intents/${intentId}`,
            providesTags: (result, error, intentId) => [
                { type: "ParentPortal", id: `intent-${intentId}` },
            ],
        }),

        cancelParentPaymentIntent: builder.mutation({
            query: (intentId) => ({
                url: `/parent/my/payment-intents/${intentId}/cancel`,
                method: "POST",
            }),
            invalidatesTags: ["ParentDashboard"],
        }),

    }),
});

export const {
    useGetMyChildrenQuery,
    useGetMyDashboardQuery,
    useGetChildFinanceQuery,
    useGetMyProfileQuery,
    useUpdateMyProfileMutation,
    useGetChildrenAttendanceQuery,
    useGetChildrenResultsQuery,
    useCreateChildPaymentIntentMutation,
    useGetParentPaymentIntentQuery,
    useCancelParentPaymentIntentMutation,
} = parentPortalApi;

// // features/apis/parentPortalApi.js
// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// export const parentPortalApi = createApi({
//     reducerPath: "parentPortalApi",
//     baseQuery: fetchBaseQuery({
//         baseUrl: `${API_URL}/parent`,
//         credentials: "include",
//     }),
//     tagTypes: ["ParentPortal", "ParentDashboard", "ParentChildren", "ChildFinance"],
//     endpoints: (builder) => ({
//         getMyChildren: builder.query({
//             query: () => "/my/children",
//             providesTags: ["ParentChildren"],
//         }),
//         getMyDashboard: builder.query({
//             query: ({ session } = {}) => ({
//                 url: "/my/dashboard",
//                 params: session ? { session } : {},
//             }),
//             providesTags: ["ParentDashboard"],
//         }),
//         getChildFinance: builder.query({
//             query: ({ childId, session } = {}) => ({
//                 url: `/my/children/${childId}/finance`,
//                 params: session ? { session } : {},
//             }),
//             providesTags: (result, error, arg) => [
//                 { type: "ChildFinance", id: arg.childId },
//             ],
//         }),
//         getMyProfile: builder.query({
//             query: () => "/my/profile",
//             providesTags: ["ParentPortal"],
//         }),
//         updateMyProfile: builder.mutation({
//             query: (data) => ({
//                 url: "/my/profile",
//                 method: "PUT",
//                 body: data,
//             }),
//             invalidatesTags: ["ParentPortal"],
//         }),
//     }),
// });

// export const {
//     useGetMyChildrenQuery,
//     useGetMyDashboardQuery,
//     useGetChildFinanceQuery,
//     useGetMyProfileQuery,
//     useUpdateMyProfileMutation,
// } = parentPortalApi;