import { api } from "./api";

export const gradesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getGrades: builder.query({
      query: () => `/grades`,
      providesTags: (result) => result ? [...result.map(g => ({ type: "Grades", id: g._id })), { type: "Grades", id: "LIST" }] : [{ type: "Grades", id: "LIST" }]
    }),
    createGrade: builder.mutation({
      query: (body) => ({ url: "/grades/create", method: "POST", body }),
      invalidatesTags: [{ type: "Grades", id: "LIST" }]
    }),
    updateGrade: builder.mutation({
      query: ({ id, ...patch }) => ({ url: `/grades/${id}`, method: "PUT", body: patch }),
      invalidatesTags: (r,e,{id}) => [{ type: "Grades", id }, { type: "Grades", id: "LIST" }]
    }),
    deleteGrade: builder.mutation({
      query: (id) => ({ url: `/grades/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Grades", id: "LIST" }]
    }),
  })
});

export const { useGetGradesQuery, useCreateGradeMutation, useUpdateGradeMutation, useDeleteGradeMutation } = gradesApi;
