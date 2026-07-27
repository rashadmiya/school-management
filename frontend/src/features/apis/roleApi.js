import { api } from "./api"; // your baseApi setup (already used in authApi, etc.)

export const rolesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: () => "/roles",
      providesTags: ["Role"],
    }),
    createRole: builder.mutation({
      query: (data) => ({
        url: "/roles/create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Role"],
    }),
    updateRole: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/roles/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Role"],
    }),

    updateUserRole: builder.mutation({
      query: ({ id, roleId }) => ({
        url: `/roles/users/${id}/role`,
        method: "PUT",
        body: { roleId },
      }),
      invalidatesTags: ["Users"],
    }),


    deleteRole: builder.mutation({
      query: (id) => ({
        url: `/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useUpdateUserRoleMutation,
} = rolesApi;
