// features/apis/parentsApi.js
import { api } from "./api";

export const parentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Admin endpoints (keep existing)

    getParentsInSearch: builder.query({
      // args: { search, page, limit }
      query: ({ search = '', page = 1, limit = 10 } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (page) params.append('page', page);
        if (limit) params.append('limit', limit);
        const qs = params.toString();
        // return { url: `/?${qs}` };
        return { url: `/parents?${qs}` }; // ✅ FIXED
      },
      providesTags: (result) =>
        result
          ? [
            ...result.docs.map((p) => ({ type: 'Parents', id: p._id })),
            { type: 'Parents', id: 'LIST' },
          ]
          : [{ type: 'Parents', id: 'LIST' }],
    }),

    // getParents: builder.query({
    //   query: ({ page = 1, limit = 50 } = {}) => `/parents?page=${page}&limit=${limit}`,
    //   providesTags: (res) => res ? [...res.docs.map(p => ({ type: "Parents", id: p._id })), { type: "Parents", id: "LIST" }] : [{ type: "Parents", id: "LIST" }]
    // }),

    getParents: builder.query({
      query: ({ page = 1, limit = 10, search = '' } = {}) =>
        `/parents?page=${page}&limit=${limit}&search=${search}`,
      providesTags: (result) =>
        result ? [
          ...result.docs.map(({ _id }) => ({ type: 'Parents', id: _id })),
          { type: 'Parents', id: 'LIST' }
        ] : [{ type: 'Parents', id: 'LIST' }],
    }),

    updateParent: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/parents/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: ["Parents"],
    }),

    deleteParent: builder.mutation({
      query: (id) => ({ url: `/parents/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Parents", id: "LIST" }]
    }),

    // 🎯 PARENT PORTAL ENDPOINTS
    getParentChildren: builder.query({
      query: () => "/parents/my/children",
      providesTags: ["ParentChildren"],
    }),

    getChildrenResults: builder.query({
      query: ({ term, year, childId } = {}) => ({
        url: "/parents/my/children/results",
        params: { term, year, childId },
      }),
      providesTags: ["ChildrenResults"],
    }),

    updateParentProfile: builder.mutation({
      query: (data) => ({
        url: "/parents/my/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["ParentDashboard", "ParentProfile"],
    }),

    // Parent payment endpoints
    getParentChildrenPayments: builder.query({
      query: ({ academicYear } = {}) => ({
        url: `/parents/my/children/payments`,
        params: { academicYear }
      }),
      providesTags: ['ParentPayments']
    }),

    getChildPaymentDetails: builder.query({
      query: ({ childId, academicYear, page = 1, limit = 10 }) => ({
        url: `/parents/my/children/${childId}/payments`,
        params: { academicYear, page, limit }
      }),
      providesTags: ['ChildPayments']
    }),

    getPaymentReceipt: builder.query({
      query: (paymentId) => `/parents/my/payments/${paymentId}/receipt`,
      providesTags: ['PaymentReceipt']
    }),

    getParentDashboard: builder.query({
      query: () => "/parents/my/dashboard",
      providesTags: ["ParentDashboard"],
    }),

  })
});

export const {
  useLazyGetParentsInSearchQuery,
  useGetParentsQuery,
  useUpdateParentMutation,
  useDeleteParentMutation,
  useGetParentChildrenQuery,
  useGetChildrenResultsQuery,
  useGetParentDashboardQuery,
  useUpdateParentProfileMutation,
  //
  useGetParentChildrenPaymentsQuery,
  useGetChildPaymentDetailsQuery,
  useGetPaymentReceiptQuery,
} = parentsApi;