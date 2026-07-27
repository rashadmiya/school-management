// features/apis/classesApi.js
import { api } from "./api";

export const classesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getClasses: builder.query({
      query: (params = {}) => {
        const { page = 1, limit = 20, search = "", academicYear, section, supervisor } = params;
        const queryParams = new URLSearchParams();
        
        if (page) queryParams.append('page', page);
        if (limit) queryParams.append('limit', limit);
        if (search) queryParams.append('search', search);
        if (academicYear) queryParams.append('academicYear', academicYear);
        if (section) queryParams.append('section', section);
        if (supervisor) queryParams.append('supervisor', supervisor);
        
        return `/classes/all?${queryParams.toString()}`;
      },
      providesTags: ["Class"],
    }),

    getClass: builder.query({
      query: (id) => `/classes/single/${id}`,
      providesTags: (result, error, id) => [{ type: "Class", id }],
    }),

    createClass: builder.mutation({
      query: (classData) => ({
        url: "/classes/create",
        method: "POST",
        body: classData,
      }),
      invalidatesTags: ["Class"],
    }),

    updateClass: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/classes/update/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Class", id },
        "Class",
      ],
    }),

    deleteClass: builder.mutation({
      query: (id) => ({
        url: `/classes/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Class"],
    }),

    addStudentToClass: builder.mutation({
      query: ({ id, studentId }) => ({
        url: `/classes/${id}/students`,
        method: "POST",
        body: { studentId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Class", id },
        "Class",
      ],
    }),

    removeStudentFromClass: builder.mutation({
      query: ({ id, studentId }) => ({
        url: `/classes/${id}/students/${studentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Class", id },
        "Class",
      ],
    }),

    addSubjectToClass: builder.mutation({
      query: ({ id, subjectId }) => ({
        url: `/classes/${id}/subjects`,
        method: "POST",
        body: { subjectId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Class", id },
        "Class",
      ],
    }),

    removeSubjectFromClass: builder.mutation({
      query: ({ id, subjectId }) => ({
        url: `/classes/${id}/subjects/${subjectId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Class", id },
        "Class",
      ],
    }),

    getClassStats: builder.query({
      query: (id) => `/classes/${id}/stats`,
      providesTags: (result, error, id) => [{ type: "Class", id }],
    }),

    getClassesByAcademicYear: builder.query({
      query: ({ academicYear, section }) => {
        const params = new URLSearchParams();
        if (section) params.append('section', section);
        return `/classes/by-year/${academicYear}?${params.toString()}`;
      },
      providesTags: ['Class'],
    }),

    getClassesWithoutSupervisor: builder.query({
      query: () => '/classes/without-supervisor',
      providesTags: ['Class'],
    }),

    getClassSubjects: builder.query({
      query: (id) => `/classes/${id}/subjects`,
      providesTags: (result, error, id) => [{ type: 'Class', id }],
    }),
  }),
});

export const {
  useGetClassesQuery,
  useLazyGetClassesQuery,
  useGetClassQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useAddStudentToClassMutation,
  useRemoveStudentFromClassMutation,
  useAddSubjectToClassMutation,
  useRemoveSubjectFromClassMutation,
  useGetClassStatsQuery,
  useGetClassesByAcademicYearQuery,
  useGetClassesWithoutSupervisorQuery,
  useGetClassSubjectsQuery,
} = classesApi;

// // features/apis/classesApi.js
// import { api } from "./api";

// export const classesApi = api.injectEndpoints({
//   endpoints: (builder) => ({
//     getClasses: builder.query({
//       query: () => "/classes/all",
//       providesTags: ["Class"],
//     }),

//     getClass: builder.query({
//       query: (id) => `/classes/single/${id}`,
//       providesTags: (result, error, id) => [{ type: "Class", id }],
//     }),

//     createClass: builder.mutation({
//       query: (classData) => ({
//         url: "/classes/create",
//         method: "POST",
//         body: classData,
//       }),
//       invalidatesTags: ["Class"],
//     }),

//     updateClass: builder.mutation({
//       query: ({ id, ...updates }) => ({
//         url: `/classes/update/${id}`,
//         method: "PUT",
//         body: updates,
//       }),
//       invalidatesTags: (result, error, { id }) => [
//         { type: "Class", id },
//         "Class",
//       ],
//     }),

//     deleteClass: builder.mutation({
//       query: (id) => ({
//         url: `/classes/delete/${id}`,
//         method: "DELETE",
//       }),
//       invalidatesTags: ["Class"],
//     }),

//     addStudentToClass: builder.mutation({
//       query: ({ id, studentId }) => ({
//         url: `/classes/${id}/students`,
//         method: "POST",
//         body: { studentId },
//       }),
//       invalidatesTags: (result, error, { id }) => [
//         { type: "Class", id },
//         "Class",
//       ],
//     }),

//     removeStudentFromClass: builder.mutation({
//       query: ({ id, studentId }) => ({
//         url: `/classes/${id}/students/${studentId}`,
//         method: "DELETE",
//       }),
//       invalidatesTags: (result, error, { id }) => [
//         { type: "Class", id },
//         "Class",
//       ],
//     }),

//     addSubjectToClass: builder.mutation({
//       query: ({ id, subjectId }) => ({
//         url: `/classes/${id}/subjects`,
//         method: "POST",
//         body: { subjectId },
//       }),
//       invalidatesTags: (result, error, { id }) => [
//         { type: "Class", id },
//         "Class",
//       ],
//     }),

//     getClassStats: builder.query({
//       query: (id) => `/classes/${id}/stats`,
//       providesTags: (result, error, id) => [{ type: "Class", id }],
//     }),

//     // ADD THESE NEW ENDPOINTS:
//     removeSubjectFromClass: builder.mutation({
//       query: ({ id, subjectId }) => ({
//         url: `/classes/${id}/subjects/${subjectId}`,
//         method: 'DELETE',
//       }),
//       invalidatesTags: (result, error, { id }) => [
//         { type: 'Class', id },
//         'Class',
//       ],
//     }),

//     getClassesByAcademicYear: builder.query({
//       query: ({ academicYear, section }) => {
//         const params = new URLSearchParams();
//         if (section) params.append('section', section);
//         return `/classes/by-year/${academicYear}?${params.toString()}`;
//       },
//       providesTags: ['Class'],
//     }),

//     getClassesWithoutSupervisor: builder.query({
//       query: () => '/classes/without-supervisor',
//       providesTags: ['Class'],
//     }),

//     getClassSubjects: builder.query({
//       query: (id) => `/classes/${id}/subjects`,
//       providesTags: (result, error, id) => [{ type: 'Class', id }],
//     }),

//   }),
// });

// export const {
//   useGetClassesQuery,
//   useGetClassQuery,
//   useCreateClassMutation,
//   useUpdateClassMutation,
//   useDeleteClassMutation,
//   useAddStudentToClassMutation,
//   useRemoveStudentFromClassMutation,
//   useAddSubjectToClassMutation,
//   useGetClassStatsQuery,

//    // ... existing exports ...
//   useRemoveSubjectFromClassMutation,
//   useGetClassesByAcademicYearQuery,
//   useGetClassesWithoutSupervisorQuery,
//   useGetClassSubjectsQuery,
// } = classesApi;
