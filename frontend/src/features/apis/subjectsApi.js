// features/apis/subjectsApi.js
import { api } from "./api";

export const subjectsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all subjects with filtering
    getSubjects: builder.query({
      query: (params = {}) => {
        const { 
          page = 1, 
          limit = 20, 
          search = "", 
          classId, 
          hasClasses 
        } = params;
        
        const queryParams = new URLSearchParams();
        
        if (page) queryParams.append('page', page);
        if (limit) queryParams.append('limit', limit);
        if (search) queryParams.append('search', search);
        if (classId) queryParams.append('classId', classId);
        if (hasClasses !== undefined) queryParams.append('hasClasses', hasClasses);
        
        return `/subjects?${queryParams.toString()}`;
      },
      providesTags: ["Subject"],
    }),

    // Get subject by ID
    getSubject: builder.query({
      query: (id) => `/subjects/${id}`,
      providesTags: (result, error, id) => [{ type: "Subject", id }],
    }),

    // Create subject
    createSubject: builder.mutation({
      query: (subjectData) => ({
        url: "/subjects",
        method: "POST",
        body: subjectData,
      }),
      invalidatesTags: ["Subject"],
    }),

    // Update subject
    updateSubject: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/subjects/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Subject", id },
        "Subject",
      ],
    }),

    // Delete subject
    deleteSubject: builder.mutation({
      query: (id) => ({
        url: `/subjects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Subject"],
    }),

    // Add subject to class
    addSubjectToClass: builder.mutation({
      query: ({ id, classId }) => ({
        url: `/subjects/${id}/classes/${classId}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Subject", id },
        "Subject",
      ],
    }),

    // Remove subject from class
    removeSubjectFromClass: builder.mutation({
      query: ({ id, classId }) => ({
        url: `/subjects/${id}/classes/${classId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Subject", id },
        "Subject",
      ],
    }),

    // Search subjects
    searchSubjects: builder.query({
      query: ({ query, classId }) => {
        const params = new URLSearchParams();
        if (classId) params.append('classId', classId);
        return `/subjects/search/${query}?${params.toString()}`;
      },
    }),

    // Get subjects by class
    getSubjectsByClass: builder.query({
      query: (classId) => `/subjects/by-class/${classId}`,
      providesTags: ["Subject"],
    }),

    // Get subjects statistics
    getSubjectsStats: builder.query({
      query: () => "/subjects/stats/count",
      providesTags: ["Subject"],
    }),

    // Get subjects without classes
    getSubjectsWithoutClasses: builder.query({
      query: () => "/subjects/without-classes",
      providesTags: ["Subject"],
    }),
  }),
});

export const {
  useGetSubjectsQuery,
  useLazyGetSubjectsQuery,
  useGetSubjectQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useAddSubjectToClassMutation,
  useRemoveSubjectFromClassMutation,
  useSearchSubjectsQuery,
  useLazySearchSubjectsQuery,
  useGetSubjectsByClassQuery,
  useGetSubjectsStatsQuery,
  useGetSubjectsWithoutClassesQuery,
} = subjectsApi;

// // features/apis/subjectsApi.js
// import { api } from "./api";

// export const subjectsApi = api.injectEndpoints({
//   endpoints: (builder) => ({
//     getSubjects: builder.query({
//       query: () => "/subjects",
//       providesTags: ["Subject"],
//     }),

//     getSubject: builder.query({
//       query: (id) => `/subjects/${id}`,
//       providesTags: (result, error, id) => [{ type: "Subject", id }],
//     }),

//     createSubject: builder.mutation({
//       query: (subjectData) => ({
//         url: "/subjects",
//         method: "POST",
//         body: subjectData,
//       }),
//       invalidatesTags: ["Subject"],
//     }),

//     updateSubject: builder.mutation({
//       query: ({ id, ...updates }) => ({
//         url: `/subjects/${id}`,
//         method: "PUT",
//         body: updates,
//       }),
//       invalidatesTags: (result, error, { id }) => [
//         { type: "Subject", id },
//         "Subject",
//       ],
//     }),

//     deleteSubject: builder.mutation({
//       query: (id) => ({
//         url: `/subjects/${id}`,
//         method: "DELETE",
//       }),
//       invalidatesTags: ["Subject"],
//     }),

//     searchSubjects: builder.query({
//       query: (query) => `/subjects/search/${query}`,
//       providesTags: ["Subject"],
//     }),

//     getSubjectsStats: builder.query({
//       query: () => "/subjects/stats/count",
//       providesTags: ["Subject"],
//     }),
//   }),
// });

// export const {
//   useGetSubjectsQuery,
//   useGetSubjectQuery,
//   useCreateSubjectMutation,
//   useUpdateSubjectMutation,
//   useDeleteSubjectMutation,
//   useSearchSubjectsQuery,
//   useGetSubjectsStatsQuery,
// } = subjectsApi;