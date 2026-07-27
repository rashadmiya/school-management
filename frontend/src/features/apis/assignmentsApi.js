import { api } from "./api";

export const assignmentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAssignments: builder.query({
      query: (params = {}) => ({
        url: "/assignments",
        method: "GET",
        params,
      }),
      providesTags: ["Assignment"],
    }),

    getAssignment: builder.query({
      query: (id) => `/assignments/${id}`,
      providesTags: (result, error, id) => [{ type: "Assignment", id }],
    }),

    createAssignment: builder.mutation({
      query: (assignmentData) => ({
        url: "/assignments",
        method: "POST",
        body: assignmentData,
      }),
      invalidatesTags: ["Assignment"],
    }),

    updateAssignment: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/assignments/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Assignment", id },
        "Assignment",
      ],
    }),

    deleteAssignment: builder.mutation({
      query: (id) => ({
        url: `/assignments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Assignment"],
    }),

    getClassAssignments: builder.query({
      query: ({ classId, status }) => ({
        url: `/assignments/class/${classId}`,
        params: { status },
      }),
      providesTags: ["Assignment"],
    }),

    getTeacherAssignments: builder.query({
      query: () => "/assignments/teacher/my-assignments",
      providesTags: ["Assignment"],
    }),

    getUpcomingAssignments: builder.query({
      query: () => "/assignments/student/upcoming",
      providesTags: ["Assignment"],
    }),

    // 🆕 SUBMISSION ENDPOINTS
    // Get student's submission for an assignment
    getMySubmission: builder.query({
      query: (assignmentId) => `/assignments/${assignmentId}/my-submission`,
      providesTags: ["Submission"],
    }),

    // Submit assignment
    submitAssignment: builder.mutation({
      query: ({ assignmentId, formData }) => ({
        url: `/assignments/${assignmentId}/submit`,
        method: "POST",
        body: formData,
        // Let browser set Content-Type for FormData
        headers: {
          // Don't set Content-Type - browser will set it with boundary
        },
      }),
      invalidatesTags: ["Assignment", "Submission"],
    }),

    // 🆕 FILE HANDLING ENDPOINTS
    // Download file
    // downloadSubmissionFile: builder.mutation({
    //   query: ({ submissionId, fileId }) => ({
    //     url: `/assignments/submissions/${submissionId}/files/${fileId}/download`,
    //     method: 'GET',
    //     responseHandler: async (response) => {
    //       const blob = await response.blob();
    //       const contentDisposition = response.headers.get('Content-Disposition');
    //       const filename = contentDisposition
    //         ? contentDisposition.split('filename=')[1].replace(/"/g, '')
    //         : 'download';

    //       return { blob, filename };
    //     },
    //     cache: 'no-cache',
    //   }),
    // }),

    downloadSubmissionFile: builder.mutation({
      query: ({ submissionId, fileId }) => ({
        url: `/assignments/submissions/${submissionId}/files/${fileId}/download`,
        method: "GET",
        responseHandler: async (response) => {
          const blob = await response.blob();

          // Extract filename from Content-Disposition header
          const disposition = response.headers.get("Content-Disposition");
          let filename = "download";

          if (disposition && disposition.includes("filename=")) {
            const match = disposition.match(/filename="?([^"]+)"?/);
            if (match && match[1]) {
              filename = match[1];
            }
          }

          return { blob, filename };
        },
      }),
    }),


    // Get file info
    getFileInfo: builder.query({
      query: ({ submissionId, fileId }) =>
        `/assignments/submissions/${submissionId}/files/${fileId}`,
      providesTags: ["File"],
    }),

    // 🆕 TEACHER SPECIFIC ENDPOINTS
    // Get assignment submissions (for teachers)
    getAssignmentSubmissions: builder.query({
      query: (assignmentId) => `/assignments/${assignmentId}/submissions`,
      providesTags: ["Submission"],
    }),

    // Grade submission
    gradeSubmission: builder.mutation({
      query: ({ submissionId, ...gradeData }) => ({
        url: `/assignments/submissions/${submissionId}/grade`,
        method: 'PUT',
        body: gradeData,
      }),
      invalidatesTags: ["Submission", "Assignment"],
    }),

    // Get assignment statistics
    getAssignmentStatistics: builder.query({
      query: (assignmentId) => `/assignments/${assignmentId}/statistics`,
    }),


    // 🆕 Preview file (uses same auth as RTK Query)
    previewSubmissionFile: builder.mutation({
      query: ({ submissionId, fileId }) => ({
        url: `/assignments/submissions/${submissionId}/files/${fileId}/view`, // 👈 use view endpoint
        method: 'GET',
        responseHandler: async (response) => {
          const blob = await response.blob();
          return { blob };
        },
        cache: 'no-cache',
      }),
    }),


  }),
});

// 🆕 Helper function for file preview URL (not a hook, just a utility function)
export const getFilePreviewUrl = (submissionId, fileId) => {
  return `/api/assignments/submissions/${submissionId}/files/${fileId}/view`;
};

export const {
  useGetAssignmentsQuery,
  useGetAssignmentQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
  useGetClassAssignmentsQuery,
  useGetTeacherAssignmentsQuery,
  useGetUpcomingAssignmentsQuery,

  // 🆕 Submission hooks
  useGetMySubmissionQuery,
  useSubmitAssignmentMutation,

  // 🆕 File handling hooks
  useDownloadSubmissionFileMutation,
  useGetFileInfoQuery,
  usePreviewSubmissionFileMutation,

  // 🆕 Teacher hooks
  // useGetAssignmentSubmissionsQuery,
  // useGradeSubmissionMutation,
  // useGetAssignmentStatisticsQuery,
} = assignmentsApi;

// import { api } from "./api";

// export const assignmentsApi = api.injectEndpoints({
//   endpoints: (builder) => ({
//     getAssignments: builder.query({
//       query: (params = {}) => ({
//         url: "/assignments",
//         method: "GET",
//         params,
//       }),
//       providesTags: ["Assignment"],
//     }),

//     getAssignment: builder.query({
//       query: (id) => `/assignments/${id}`,
//       providesTags: (result, error, id) => [{ type: "Assignment", id }],
//     }),

//     createAssignment: builder.mutation({
//       query: (assignmentData) => ({
//         url: "/assignments",
//         method: "POST",
//         body: assignmentData,
//       }),
//       invalidatesTags: ["Assignment"],
//     }),

//     updateAssignment: builder.mutation({
//       query: ({ id, ...updates }) => ({
//         url: `/assignments/${id}`,
//         method: "PUT",
//         body: updates,
//       }),
//       invalidatesTags: (result, error, { id }) => [
//         { type: "Assignment", id },
//         "Assignment",
//       ],
//     }),

//     deleteAssignment: builder.mutation({
//       query: (id) => ({
//         url: `/assignments/${id}`,
//         method: "DELETE",
//       }),
//       invalidatesTags: ["Assignment"],
//     }),

//     getClassAssignments: builder.query({
//       query: ({ classId, status }) => ({
//         url: `/assignments/class/${classId}`,
//         params: { status },
//       }),
//       providesTags: ["Assignment"],
//     }),

//     getTeacherAssignments: builder.query({
//       query: () => "/assignments/teacher/my-assignments",
//       providesTags: ["Assignment"],
//     }),

//     getUpcomingAssignments: builder.query({
//       query: () => "/assignments/student/upcoming",
//       providesTags: ["Assignment"],
//     }),


//     // Download file
//     downloadSubmissionFile: builder.mutation({
//       query: ({ submissionId, fileId }) => ({
//         url: `/assignments/submissions/${submissionId}/files/${fileId}/download`,
//         method: 'GET',
//         responseHandler: async (response) => {
//           const blob = await response.blob();
//           const contentDisposition = response.headers.get('Content-Disposition');
//           const filename = contentDisposition
//             ? contentDisposition.split('filename=')[1].replace(/"/g, '')
//             : 'download';

//           return { blob, filename };
//         },
//         cache: 'no-cache',
//       }),
//     }),

//     // Get file URL for preview
//     getFilePreviewUrl: (submissionId, fileId) =>
//       `${baseUrl}/api/assignments/submissions/${submissionId}/files/${fileId}/view`,

//     // Get file info
//     getFileInfo: builder.query({
//       query: ({ submissionId, fileId }) =>
//         `/assignments/submissions/${submissionId}/files/${fileId}`,
//     }),

//   }),
// });

// export const {
//   useGetAssignmentsQuery,
//   useGetAssignmentQuery,
//   useCreateAssignmentMutation,
//   useUpdateAssignmentMutation,
//   useDeleteAssignmentMutation,
//   useGetClassAssignmentsQuery,
//   useGetTeacherAssignmentsQuery,
//   useGetUpcomingAssignmentsQuery,
//   useDownloadSubmissionFileMutation,
//   useGetFileInfoQuery,

// } = assignmentsApi;