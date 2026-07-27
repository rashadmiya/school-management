import { api } from "./api";


export const teachersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Get teachers with photo filter
    getTeachers: builder.query({
      query: ({
        page = 1,
        limit = 20,
        search = "",
        designation,
        religion,
        hasPhoto // true/false
      } = {}) => {
        const params = new URLSearchParams();

        if (search) params.append('search', search);
        if (designation) params.append('designation', designation);
        if (religion) params.append('religion', religion);
        if (hasPhoto !== undefined) params.append('hasPhoto', hasPhoto);
        params.append('page', page);
        params.append('limit', limit);

        return `/teachers?${params.toString()}`;
      },
      providesTags: (result) =>
        result ? [
          ...result.docs.map(({ _id }) => ({ type: "Teachers", id: _id })),
          { type: "Teachers", id: "LIST" }
        ] : [{ type: "Teachers", id: "LIST" }]
    }),


    getTeacher: builder.query({
      query: (id) => `/teachers/${id}`,
      providesTags: (result, error, id) => [{ type: "Teachers", id }],
    }),

    // Update teacher (without photo)
    updateTeacher: builder.mutation({
      query: ({ id, ...teacherData }) => ({
        url: `/teachers/update/${id}`,
        method: "PUT",
        body: teacherData
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Teachers", id },
        { type: "Teachers", id: "LIST" }
      ]
    }),


    deleteTeacher: builder.mutation({
      query: (id) => ({ url: `/teachers/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Teachers", id: "LIST" }],
    }),

    // Teacher-specific endpoints
    getTeacherClasses: builder.query({
      query: () => "/teachers/my-classes",
      providesTags: ["Teacher"],
    }),

    getTeacherRoutines: builder.query({
      query: () => "/teachers/my-routines",
      providesTags: ["Teacher"],
    }),

    getTeacherAssignments: builder.query({
      query: () => "/teachers/my-assignments",
      providesTags: ["Teacher"],
    }),

    getTeacherExams: builder.query({
      query: () => "/teachers/my-exams",
      providesTags: ["Teacher"],
    }),

    // Get submissions for an assignment
    getSubmittedAssignment: builder.query({
      query: (assignmentId) => `/teachers/assignments/${assignmentId}/submissions`,
      providesTags: ['Submissions', "Teacher"],
    }),

    // Get assignment statistics
    getAssignmentStatistics: builder.query({
      query: (assignmentId) => `/teachers/assignments/${assignmentId}/statistics`,
    }),

    // Grade submission
    gradeSubmission: builder.mutation({
      query: ({ submissionId, ...gradeData }) => ({
        url: `/teachers/assignments/submissions/${submissionId}/grade`,
        method: 'PUT',
        body: gradeData,
      }),
      invalidatesTags: ['Submissions', 'TeacherAssignments'],
    }),
  }),
});

export const {
  useGetTeachersQuery,
  useGetTeacherQuery,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
  useGetTeacherClassesQuery,
  useGetTeacherRoutinesQuery,
  useGetTeacherAssignmentsQuery,
  useGetTeacherExamsQuery,
  useGetSubmittedAssignmentQuery,
  useGetAssignmentStatisticsQuery,
  useGradeSubmissionMutation,
} = teachersApi;
