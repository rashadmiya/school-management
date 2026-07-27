// features/apis/resultSheetsApi.js
import { api } from "./api";

export const resultSheetsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    generateResultSheet: builder.mutation({
      query: (data) => ({
        url: "/result-sheets/generate",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ResultSheet"],
    }),

    generateClassResultSheets: builder.mutation({
      query: (data) => ({
        url: "/result-sheets/generate-class",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ResultSheet"],
    }),

    getResultSheets: builder.query({
      query: (params = {}) => ({
        url: "/result-sheets",
        method: "GET",
        params,
      }),
      providesTags: ["ResultSheet"],
    }),

    getResultSheet: builder.query({
      query: (id) => `/result-sheets/${id}`,
      providesTags: (result, error, id) => [{ type: "ResultSheet", id }],
    }),

    publishResultSheets: builder.mutation({
      query: (data) => ({
        url: "/result-sheets/publish",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["ResultSheet"],
    }),

    unpublishResultSheets: builder.mutation({
      query: (data) => ({
        url: "/result-sheets/unpublish",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["ResultSheet"],
    }),

    updateResultSheet: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/result-sheets/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ResultSheet", id },
        "ResultSheet",
      ],
    }),

    deleteResultSheet: builder.mutation({
      query: (id) => ({
        url: `/result-sheets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ResultSheet"],
    }),

    getStudentResultSheets: builder.query({
      query: (studentId) => `/result-sheets/student/${studentId}`,
      providesTags: ["ResultSheet"],
    }),

    getClassResultSheets: builder.query({
      query: ({ classId, term, year }) => 
        `/result-sheets/class/${classId}/term/${term}/year/${year}`,
      providesTags: ["ResultSheet"],
    }),
  }),
});

export const {
  useGenerateResultSheetMutation,
  useGenerateClassResultSheetsMutation,
  useGetResultSheetsQuery,
  useGetResultSheetQuery,
  usePublishResultSheetsMutation,
  useUnpublishResultSheetsMutation,
  useUpdateResultSheetMutation,
  useDeleteResultSheetMutation,
  useGetStudentResultSheetsQuery,
  useGetClassResultSheetsQuery,
} = resultSheetsApi;