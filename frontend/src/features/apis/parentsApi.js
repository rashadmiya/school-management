// features/apis/parentsApi.js — admin-facing only
import { api } from "./api";

export const parentsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getParentsInSearch: builder.query({
            query: ({ search = "", page = 1, limit = 10 } = {}) => {
                const params = new URLSearchParams();
                if (search) params.append("search", search);
                params.append("page", page);
                params.append("limit", limit);
                return { url: `/parents?${params.toString()}` };
            },
            providesTags: (result) =>
                result
                    ? [
                        ...(result.docs || []).map((p) => ({ type: "Parents", id: p._id })),
                        { type: "Parents", id: "LIST" },
                    ]
                    : [{ type: "Parents", id: "LIST" }],
        }),

        getParents: builder.query({
            query: ({ page = 1, limit = 10, search = "" } = {}) =>
                `/parents?page=${page}&limit=${limit}&search=${search}`,
            providesTags: (result) =>
                result
                    ? [
                        ...(result.docs || []).map(({ _id }) => ({ type: "Parents", id: _id })),
                        { type: "Parents", id: "LIST" },
                    ]
                    : [{ type: "Parents", id: "LIST" }],
        }),

        getParentById: builder.query({
            query: (id) => `/parents/${id}`,
            providesTags: (result, error, id) => [{ type: "Parents", id }],
        }),

        deleteParent: builder.mutation({
            query: (id) => ({ url: `/parents/${id}`, method: "DELETE" }),
            invalidatesTags: [{ type: "Parents", id: "LIST" }],
        }),

        resetParentPin: builder.mutation({
            query: (id) => ({ url: `/parents/${id}/reset-pin`, method: "POST" }),
            invalidatesTags: [{ type: "Parents", id: "LIST" }],
        }),

        // 🎯 PARENT PORTAL ENDPOINTS
        getParentChildren: builder.query({
            query: () => "/parent/my/children",
            providesTags: ["ParentChildren"],
        }),

        getChildrenResults: builder.query({
            query: ({ term, year, childId } = {}) => ({
                url: "/parent/my/children/results",
                params: { term, year, childId },
            }),
            providesTags: ["ChildrenResults"],
        }),

        getParentDashboard: builder.query({
            query: () => "/parent/my/dashboard",
            providesTags: ["ParentDashboard"],
        }),

        updateParentProfile: builder.mutation({
            query: (data) => ({
                url: "/parent/my/profile",
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["ParentDashboard", "ParentProfile"],
        }),

        getChildPaymentDetails: builder.query({
            query: ({ childId, academicYear, page = 1, limit = 10 }) => ({
                url: `/parent/my/children/${childId}/finance`,
                params: { academicYear, page, limit }
            }),
            providesTags: ['ChildPayments']
        }),

    }),
});

export const {
    useLazyGetParentsInSearchQuery,
    useGetParentsQuery,
    useGetParentByIdQuery,
    useDeleteParentMutation,
    useResetParentPinMutation,
    useGetParentChildrenQuery,
    useGetChildrenResultsQuery,
    useGetParentDashboardQuery,
    useUpdateParentProfileMutation,
    useGetChildPaymentDetailsQuery,
} = parentsApi;

// // features/apis/parentsApi.js
// import { api } from "./api";

// export const parentsApi = api.injectEndpoints({
//   endpoints: (builder) => ({
//     // Admin endpoints (keep existing)

//     getParentsInSearch: builder.query({
//       // args: { search, page, limit }
//       query: ({ search = '', page = 1, limit = 10 } = {}) => {
//         const params = new URLSearchParams();
//         if (search) params.append('search', search);
//         if (page) params.append('page', page);
//         if (limit) params.append('limit', limit);
//         const qs = params.toString();
//         // return { url: `/?${qs}` };
//         return { url: `/parents?${qs}` }; // ✅ FIXED
//       },
//       providesTags: (result) =>
//         result
//           ? [
//             ...result.docs.map((p) => ({ type: 'Parents', id: p._id })),
//             { type: 'Parents', id: 'LIST' },
//           ]
//           : [{ type: 'Parents', id: 'LIST' }],
//     }),

//     getParents: builder.query({
//       query: ({ page = 1, limit = 10, search = '' } = {}) =>
//         `/parents?page=${page}&limit=${limit}&search=${search}`,
//       providesTags: (result) =>
//         result ? [
//           ...result.docs.map(({ _id }) => ({ type: 'Parents', id: _id })),
//           { type: 'Parents', id: 'LIST' }
//         ] : [{ type: 'Parents', id: 'LIST' }],
//     }),

//     updateParent: builder.mutation({
//       query: ({ id, ...updates }) => ({
//         url: `/parents/${id}`,
//         method: "PUT",
//         body: updates,
//       }),
//       invalidatesTags: ["Parents"],
//     }),

//     deleteParent: builder.mutation({
//       query: (id) => ({ url: `/parents/${id}`, method: "DELETE" }),
//       invalidatesTags: [{ type: "Parents", id: "LIST" }]
//     }),

//     // 🎯 PARENT PORTAL ENDPOINTS
//     getParentChildren: builder.query({
//       query: () => "/parents/my/children",
//       providesTags: ["ParentChildren"],
//     }),

//     getChildrenResults: builder.query({
//       query: ({ term, year, childId } = {}) => ({
//         url: "/parents/my/children/results",
//         params: { term, year, childId },
//       }),
//       providesTags: ["ChildrenResults"],
//     }),

//     updateParentProfile: builder.mutation({
//       query: (data) => ({
//         url: "/parents/my/profile",
//         method: "PUT",
//         body: data,
//       }),
//       invalidatesTags: ["ParentDashboard", "ParentProfile"],
//     }),

//     // Parent payment endpoints
//     getParentChildrenPayments: builder.query({
//       query: ({ academicYear } = {}) => ({
//         url: `/parents/my/children/payments`,
//         params: { academicYear }
//       }),
//       providesTags: ['ParentPayments']
//     }),

//     getChildPaymentDetails: builder.query({
//       query: ({ childId, academicYear, page = 1, limit = 10 }) => ({
//         url: `/parents/my/children/${childId}/payments`,
//         params: { academicYear, page, limit }
//       }),
//       providesTags: ['ChildPayments']
//     }),

//     getPaymentReceipt: builder.query({
//       query: (paymentId) => `/parents/my/payments/${paymentId}/receipt`,
//       providesTags: ['PaymentReceipt']
//     }),

//     getParentDashboard: builder.query({
//       query: () => "/parents/my/dashboard",
//       providesTags: ["ParentDashboard"],
//     }),

//   })
// });

// export const {
//   useLazyGetParentsInSearchQuery,
//   useGetParentsQuery,
//   useUpdateParentMutation,
//   useDeleteParentMutation,
//   useGetParentChildrenQuery,
//   useGetChildrenResultsQuery,
//   useGetParentDashboardQuery,
//   useUpdateParentProfileMutation,
//   //
//   useGetParentChildrenPaymentsQuery,
//   useGetChildPaymentDetailsQuery,
//   useGetPaymentReceiptQuery,
// } = parentsApi;