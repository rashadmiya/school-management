// features/apis/studentApi.js - UPDATED VERSION
import { userLoggedIn } from "../slices/authSlice";
import { api } from "./api";

export const studentApi = api.injectEndpoints({
  endpoints: (builder) => ({

    loginStudent: builder.mutation({
      query: ({ rollNumber, password }) => ({
        url: "/students/login",
        method: "POST",
        body: { rollNumber, password },
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          console.warn("login data :", data)
          dispatch(userLoggedIn({
            token: data.token,
            user: data.user,
            role: data.user.role?.name || "student", // Updated for safety
            isStudent: true
          }));
        } catch (err) {
          console.error("Login failed:", err);
        }
      },
    }),

    // ✅ Get student profile - UPDATED to include new fields
    getStudentProfile: builder.query({
      query: () => "/students/me",
      transformResponse: (response) => {
        // Transform the response to include all new fields
        return {
          ...response,
          user: {
            ...response.user,
            // Ensure backward compatibility
            contact: response.user.guardianContact || response.user.contact,
            // Add any other transformations if needed
          }
        };
      },
      providesTags: ["StudentProfile"],
    }),

    // ✅ Get students with advanced search - UPDATED
    getStudents: builder.query({
      query: ({
        page = 1,
        limit = 20,
        search = "",
        session,
        religion,
        classId,
        isPhysicallyDisabled,
        gender,
        hasPhoto // true/false
      } = {}) => {
        const params = new URLSearchParams();

        if (search) params.append('search', search);
        if (session) params.append('session', session);
        if (religion) params.append('religion', religion);
        if (classId) params.append('classId', classId);
        if (isPhysicallyDisabled !== undefined) params.append('isPhysicallyDisabled', isPhysicallyDisabled);
        if (gender) params.append('gender', gender);
        if (hasPhoto !== undefined) params.append('hasPhoto', hasPhoto);
        params.append('page', page);
        params.append('limit', limit);

        return `/students/all?${params.toString()}`;
      },
      providesTags: (result) =>
        result ? [
          ...result.docs.map(({ _id }) => ({ type: "Students", id: _id })),
          { type: "Students", id: "LIST" }
        ] : [{ type: "Students", id: "LIST" }]
    }),

    // ✅ Update student (without photo)
    updateStudent: builder.mutation({
      query: ({ id, ...studentData }) => ({
        url: `/students/update/${id}`,
        method: "PUT",
        body: studentData
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Students", id },
        { type: "Students", id: "LIST" },
        { type: "StudentProfile" }
      ]
    }),

    uploadStudentPhoto: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/students/${id}/photo`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Students", id },
        { type: "Students", id: "LIST" },
        { type: "StudentProfile" }
      ]
    }),
    // ✅ Search students by religion - NEW ENDPOINT
    searchStudentsByReligion: builder.query({
      query: ({ religion, session, page = 1, limit = 20 }) =>
        `/students/search/religion?religion=${religion}&session=${session || ''}&page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result ? [
          ...result.students.map(({ _id }) => ({ type: "StudentsByReligion", id: _id })),
          { type: "StudentsByReligion", id: "LIST" }
        ] : [{ type: "StudentsByReligion", id: "LIST" }]
    }),

    // ✅ Advanced student search - NEW ENDPOINT
    advancedStudentSearch: builder.query({
      query: (searchParams) => {
        const params = new URLSearchParams();
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value);
          }
        });
        return `/students/search/advanced?${params.toString()}`;
      },
      providesTags: (result) =>
        result ? [
          ...result.students.map(({ _id }) => ({ type: "AdvancedStudents", id: _id })),
          { type: "AdvancedStudents", id: "LIST" }
        ] : [{ type: "AdvancedStudents", id: "LIST" }]
    }),

    getStudentsByClass: builder.query({
      query: (classId) => `/students/by-class/${classId}`,
      providesTags: ["Students"]
    }),

    getStudentsById: builder.query({
      query: (id) => `/students/${id}`,
      providesTags: ["Students"]
    }),


    // ✅ Update student profile (for student self-update) - UPDATED
    updateStudentProfile: builder.mutation({
      query: (data) => ({
        url: "/students/profile/update",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["StudentProfile"],
    }),

    // ✅ Get students by session - NEW ENDPOINT
    getStudentsBySession: builder.query({
      query: ({ session, classId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        params.append('session', session);
        if (classId) params.append('classId', classId);
        params.append('page', page);
        params.append('limit', limit);

        return `/students/by-session/${session}?${params.toString()}`;
      },
      providesTags: (result) =>
        result ? [
          ...result.students.map(({ _id }) => ({ type: "StudentsBySession", id: _id })),
          { type: "StudentsBySession", id: "LIST" }
        ] : [{ type: "StudentsBySession", id: "LIST" }]
    }),

    deleteStudent: builder.mutation({
      query: (id) => ({
        url: `/students/delete/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: [
        { type: "Students", id: "LIST" },
        { type: "AdvancedStudents", id: "LIST" },
        { type: "StudentsByReligion", id: "LIST" },
        { type: "StudentsBySession", id: "LIST" }
      ]
    }),

    // Assignment endpoints (keep as is)
    submitAssignment: builder.mutation({
      query: ({ assignmentId, data }) => {
        const formData = new FormData();
        formData.append('content', data.content);
        data.files.forEach(file => {
          formData.append('files', file);
        });
        return {
          url: `/students/assignments/${assignmentId}/submit`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['StudentAssignments'],
    }),

    getAssignmentWithSubmission: builder.query({
      query: (assignmentId) => `/students/assignments/${assignmentId}/submission`,
      providesTags: (result, error, assignmentId) => [
        { type: 'AssignmentSubmission', id: assignmentId }
      ],
    }),

    getStudentAssignments: builder.query({
      query: () => "/students/my/assignments",
      providesTags: ["StudentAssignments"],
    }),

    getStudentExams: builder.query({
      query: () => "/students/my/exams",
      providesTags: ["StudentExams"],
    }),

    getStudentResults: builder.query({
      query: ({ term, year }) => `/students/my/results?term=${term}&year=${year}`,
      providesTags: ["StudentResults"],
    }),

    getStudentRoutines: builder.query({
      query: () => "/students/my/routines",
      providesTags: ["StudentRoutines"],
    }),

    getTodayRoutines: builder.query({
      query: () => "/students/my/routines/today",
      providesTags: ["StudentRoutines"],
    }),

    getStudentClass: builder.query({
      query: () => "/students/my/class",
      providesTags: ["StudentClass"],
    }),

    // Student payment endpoints (keep as is)
    getStudentPayments: builder.query({
      query: ({ academicYear, page = 1, limit = 10 } = {}) => ({
        url: `/students/my/payments`,
        params: { academicYear, page, limit }
      }),
      providesTags: ['StudentPayments']
    }),

    getStudentPaymentSummary: builder.query({
      query: ({ academicYear } = {}) => ({
        url: `/students/my/payments/summary`,
        params: { academicYear }
      }),
      providesTags: ['StudentPaymentSummary']
    }),

    getStudentPaymentReceipt: builder.query({
      query: (paymentId) => `/students/my/payments/${paymentId}/receipt`,
      providesTags: ['StudentPaymentReceipt']
    }),

    getStudentDashboard: builder.query({
      query: () => `/students/my/dashboard`,
      providesTags: ['StudentDashboard']
    }),

    // Student Financial Summary
    getStudentFinancialSummary: builder.query({
      query: (studentId) => `/students/${studentId}/financial-summary`,
      providesTags: ['Student'],
    }),

    // Update Student Fee Category
    updateStudentFeeCategory: builder.mutation({
      query: ({ id, feeCategory }) => ({
        url: `/students/${id}/fee-category`,
        method: 'PUT',
        body: { feeCategory },
      }),
      invalidatesTags: ['Student'],
    }),

    // Bulk Student Operations
    updateBulkStudentFees: builder.mutation({
      query: (data) => ({
        url: '/students/bulk-fees',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Student', 'FeeInstance'],
    }),

    searchStudents: builder.query({
      query: ({ search = '', limit = 10, fields = 'name,rollNumber,class' }) => ({
        url: '/students/search',
        params: { search, limit, fields }
      }),
    }),

    searchStudentsLazy: builder.query({
      query: (params) => ({
        url: '/students/search',
        params,
      }),
    }),


  }),
});

export const {
  useLoginStudentMutation,
  useGetStudentProfileQuery,
  useGetStudentsQuery,
  useSearchStudentsByReligionQuery,
  useAdvancedStudentSearchQuery,
  useGetStudentsByClassQuery,
  useGetStudentsByIdQuery,
  useDeleteStudentMutation,
  useSubmitAssignmentMutation,
  useGetAssignmentWithSubmissionQuery,
  useGetStudentAssignmentsQuery,
  useGetStudentExamsQuery,
  useGetStudentResultsQuery,
  useGetStudentRoutinesQuery,
  useGetStudentClassQuery,
  useUpdateStudentProfileMutation,
  useUpdateStudentMutation,
  useUploadStudentPhotoMutation,
  useGetStudentsBySessionQuery,
  //
  useGetTodayRoutinesQuery,
  //
  useGetStudentPaymentsQuery,
  useGetStudentPaymentSummaryQuery,
  useGetStudentPaymentReceiptQuery,
  useGetStudentDashboardQuery,
  // Financial Summary
  useGetStudentFinancialSummaryQuery,
  useUpdateStudentFeeCategoryMutation,
  useUpdateBulkStudentFeesMutation,
  useSearchStudentsQuery,
  useLazySearchStudentsLazyQuery,
} = studentApi;