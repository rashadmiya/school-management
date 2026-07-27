// features/apis/resultsApi.js
import { api } from "./api";

export const resultsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    submitResult: builder.mutation({
      query: (resultData) => ({
        url: "/results/submit",
        method: "POST",
        body: resultData,
      }),
      invalidatesTags: ["Result"],
    }),

    bulkSubmitResults: builder.mutation({
      query: (bulkData) => ({
        url: "/results/bulk-submit",
        method: "POST",
        body: bulkData,
      }),
      invalidatesTags: ["Result"],
    }),

    getResults: builder.query({
      query: (params = {}) => ({
        url: "/results",
        method: "GET",
        params,
      }),
      providesTags: ["Result"],
    }),

    getStudentResults: builder.query({
      query: ({ studentId, ...params }) => ({
        url: `/results/student/${studentId}`,
        params,
      }),
      providesTags: ["Result"],
    }),

    getClassExamResults: builder.query({
      query: ({ examId, classId }) => `/results/exam/${examId}/class/${classId}`,
      providesTags: ["Result"],
    }),

    getResult: builder.query({
      query: (id) => `/results/${id}`,
      providesTags: (result, error, id) => [{ type: "Result", id }],
    }),

    updateResult: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/results/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Result", id },
        "Result",
      ],
    }),

    deleteResult: builder.mutation({
      query: (id) => ({
        url: `/results/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Result"],
    }),

    getClassPerformance: builder.query({
      query: ({ classId, ...params }) => ({
        url: `/results/class/${classId}/summary`,
        params,
      }),
      providesTags: ["Result"],
    }),

    getResultsStats: builder.query({
      query: (params = {}) => ({
        url: "/results/stats/overview",
        params,
      }),
      providesTags: ["Result"],
    }),
  }),
});

export const {
  useSubmitResultMutation,
  useBulkSubmitResultsMutation,
  useGetResultsQuery,
  useGetStudentResultsQuery,
  useGetClassExamResultsQuery,
  useGetResultQuery,
  useUpdateResultMutation,
  useDeleteResultMutation,
  useGetClassPerformanceQuery,
  useGetResultsStatsQuery,
} = resultsApi;

// import { api } from "./api";

// export const resultsApi = api.injectEndpoints({
//   endpoints: (builder) => ({
//     createResult: builder.mutation({
//       query: (body) => ({ url: "/results/create", method: "POST", body }),
//       invalidatesTags: [{ type: "Results", id: "LIST" }]
//     }),
//     getResultsByStudent: builder.query({
//       query: ({ studentId, term, year }) => `/results?student=${studentId}&term=${term}&year=${year}`,
//       providesTags: (res) => res ? [{ type: "Results", id: `student-${res.student}` }] : []
//     }),
//     generateResultSheet: builder.mutation({
//       query: (body) => ({ url: "/resultsheets/generate", method: "POST", body }),
//       invalidatesTags: [{ type: "ResultSheets", id: "LIST" }]
//     })
//   })
// });

// export const { useCreateResultMutation, useGetResultsByStudentQuery, useGenerateResultSheetMutation } = resultsApi;
