// features/apis/attendanceApi.js - COMPLETE WITH ALL ENDPOINTS
import { api } from "./api";

export const attendanceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ========== DASHBOARD ENDPOINTS ==========
    getTodaysSchedule: builder.query({
      query: ({ date }) => ({
        url: '/attendance/todays-schedule',
        params: { date }
      }),
      providesTags: ['Attendance', 'TodayAttendance']
    }),

    getAttendanceOverview: builder.query({
      query: ({ date }) => ({
        url: '/attendance/overview',
        params: { date }
      }),
      providesTags: ['Attendance']
    }),

    // ========== MARK ATTENDANCE ENDPOINTS ==========
    getClassRoutine: builder.query({
      query: ({ classId, day }) => ({
        url: `/attendance/routine/${classId}`,
        params: { day }
      }),
      providesTags: ['Attendance', 'Routine']
    }),

    // For MarkAttendance component
    getTodayAttendance: builder.query({
      query: ({ classId, date, period }) => ({
        url: `/attendance/class/${classId}/today`,
        params: { date, period }
      }),
      providesTags: ['Attendance', 'TodayAttendance']
    }),

    // New routine-based attendance marking
    markAttendanceWithRoutine: builder.mutation({
      query: (data) => ({
        url: '/attendance/mark-with-routine',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Attendance', 'TodayAttendance']
    }),

    // Original attendance marking (keep for backward compatibility)
    markAttendance: builder.mutation({
      query: (attendanceData) => ({
        url: "/attendance/mark",
        method: "POST",
        body: attendanceData,
      }),
      invalidatesTags: ["Attendance", "TodayAttendance"],
    }),

    // ========== ATTENDANCE QUERIES (EXISTING) ==========
    getClassAttendance: builder.query({
      query: ({ classId, subjectId, date, period }) => {
        const params = {};
        if (period) params.period = period;

        return {
          url: `/attendance/class/${classId}/subject/${subjectId}/date/${date}`,
          params,
        };
      },
      providesTags: ["Attendance"],
    }),

    getStudentAttendance: builder.query({
      query: ({ studentId, month, year, subjectId }) => ({
        url: `/attendance/student/${studentId}`,
        params: { month, year, subjectId },
      }),
      providesTags: ["Attendance"],
    }),

    // ========== REPORT ENDPOINTS ==========
    getClassAttendanceSummary: builder.query({
      query: ({ classId, month, year, subjectId }) => ({
        url: `/attendance/class/${classId}/summary`,
        params: { month, year, subjectId }
      }),
      providesTags: ['Attendance', 'Reports']
    }),

    getAttendanceAnalytics: builder.query({
      query: ({ classId, month, year }) => ({
        url: `/attendance/analytics/class/${classId}`,
        params: { month, year }
      }),
      providesTags: ['Attendance', 'Analytics']
    }),

    // ========== UPDATE/DELETE OPERATIONS ==========
    updateAttendanceRecord: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/attendance/update/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Attendance', 'TodayAttendance']
    }),

    // Alias for backward compatibility
    updateAttendance: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/attendance/update/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: ["Attendance", "TodayAttendance"],
    }),

    deleteAttendance: builder.mutation({
      query: (id) => ({
        url: `/attendance/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Attendance", "TodayAttendance"],
    }),

    // ========== STUDENT ENDPOINTS ==========
    getMyAttendance: builder.query({
      query: ({ month, year, subjectId }) => ({
        url: '/attendance/my/attendance',
        params: { month, year, subjectId }
      }),
      providesTags: ['Attendance', 'Student']
    }),

    // ========== BULK OPERATIONS ==========
    bulkMarkAttendance: builder.mutation({
      query: (data) => ({
        url: '/attendance/bulk-mark',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Attendance', 'TodayAttendance']
    }),

    // ========== TEACHER ENDPOINTS ==========
    getTeacherSubjectsAttendance: builder.query({
      query: ({ month, year }) => ({
        url: '/attendance/teacher/my-subjects',
        params: { month, year }
      }),
      providesTags: ['Attendance', 'Teacher']
    }),

    // ========== PARENT ENDPOINTS ==========
    getChildrenAttendance: builder.query({
      query: ({ month, year, childId, subjectId }) => ({
        url: '/attendance/my/children/attendance',
        params: { month, year, childId, subjectId }
      }),
      providesTags: ['Attendance', 'Parent']
    }),

    // ========== OTHER ENDPOINTS ==========
    getAttendanceByDatePeriod: builder.query({
      query: ({ date, period, classId, subjectId }) => ({
        url: `/attendance/date/${date}/period/${period}`,
        params: { classId, subjectId }
      }),
      providesTags: ['Attendance']
    }),
  }),
});

export const {
  // Dashboard hooks
  useGetTodaysScheduleQuery,
  useGetAttendanceOverviewQuery,
  
  // Routine-based attendance hooks
  useGetClassRoutineQuery,
  useGetTodayAttendanceQuery,
  useMarkAttendanceWithRoutineMutation,
  
  // Original attendance hooks (keep for backward compatibility)
  useMarkAttendanceMutation,
  useGetClassAttendanceQuery,
  useGetStudentAttendanceQuery,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
  
  // Report hooks
  useGetClassAttendanceSummaryQuery,
  useGetAttendanceAnalyticsQuery,
  
  // Student/Teacher/Parent hooks
  useGetMyAttendanceQuery,
  useGetTeacherSubjectsAttendanceQuery,
  useGetChildrenAttendanceQuery,
  
  // Bulk operations
  useBulkMarkAttendanceMutation,
  
  // Other hooks
  useGetAttendanceByDatePeriodQuery,
  useUpdateAttendanceRecordMutation, // Alias for updateAttendance
} = attendanceApi;

// // features/apis/attendanceApi.js
// import { api } from "./api";

// export const attendanceApi = api.injectEndpoints({
//   endpoints: (builder) => ({
//     // 🎯 Mark attendance (subject-based)
//     markAttendance: builder.mutation({
//       query: (attendanceData) => ({
//         url: "/attendance/mark",
//         method: "POST",
//         body: attendanceData,
//       }),
//       invalidatesTags: ["Attendance", "TodayAttendance"],
//     }),

//     // 🎯 Get class attendance by subject and date
//     getClassAttendance: builder.query({
//       query: ({ classId, subjectId, date, period }) => {
//         const params = {};
//         if (period) params.period = period;

//         return {
//           url: `/attendance/class/${classId}/subject/${subjectId}/date/${date}`,
//           params,
//         };
//       },
//       providesTags: ["Attendance"],
//     }),

//     // 🎯 Get student attendance history
//     getStudentAttendance: builder.query({
//       query: ({ studentId, month, year, subjectId }) => ({
//         url: `/attendance/student/${studentId}`,
//         params: { month, year, subjectId },
//       }),
//       providesTags: ["Attendance"],
//     }),

//     // Report needs:
//     getClassAttendanceSummary: builder.query({ // ✅ AVAILABLE: GET /class/:classId/summary
//       query: ({ classId, month, year, subjectId }) =>
//         `/attendance/class/${classId}/summary?month=${month}&year=${year}&subjectId=${subjectId}`,
//     }),
//     getAttendanceAnalytics: builder.query({ // ✅ AVAILABLE: GET /analytics/class/:classId
//       query: ({ classId, month, year }) =>
//         `/attendance/analytics/class/${classId}?month=${month}&year=${year}`,
//     }),


//     // 🎯 Update single attendance record
//     updateAttendance: builder.mutation({
//       query: ({ id, ...updates }) => ({
//         url: `/attendance/update/${id}`,
//         method: "PUT",
//         body: updates,
//       }),
//       invalidatesTags: ["Attendance", "TodayAttendance"],
//     }),

//     // 🎯 Delete attendance record
//     deleteAttendance: builder.mutation({
//       query: (id) => ({
//         url: `/attendance/delete/${id}`,
//         method: "DELETE",
//       }),
//       invalidatesTags: ["Attendance", "TodayAttendance"],
//     }),


//     getTodayAttendance: builder.query({ // ✅ AVAILABLE: GET /class/:classId/today
//       query: ({ classId, date, period }) => `/attendance/class/${classId}/today?date=${date}&period=${period}`,
//     }),
//     // 🎯 Get teacher's subjects attendance
//     getTeacherSubjectsAttendance: builder.query({
//       query: ({ month, year }) => ({
//         url: "/attendance/teacher/my-subjects",
//         params: { month, year },
//       }),
//       providesTags: ["Attendance"],
//     }),

//     // 🎯 Student: Get my attendance
//     getMyAttendance: builder.query({
//       query: ({ month, year, subjectId }) => ({
//         url: "/attendance/my/attendance",
//         params: { month, year, subjectId },
//       }),
//       providesTags: ["Attendance"],
//     }),

//     // 🎯 Parent: Get children's attendance
//     getChildrenAttendance: builder.query({
//       query: ({ month, year, childId, subjectId }) => ({
//         url: "/attendance/my/children/attendance",
//         params: { month, year, childId, subjectId },
//       }),
//       providesTags: ["Attendance"],
//     }),

//     // Add to your attendanceApi.js
//     getClassRoutine: builder.query({
//       query: ({ classId, day }) => `/attendance/routine/${classId}?day=${day}`,
//     }),

//     getTodaysSchedule: builder.query({
//       query: ({ date }) => ({
//         url: '/attendance/todays-schedule',
//         params: { date }
//       }),
//       providesTags: ['Attendance']
//     }),
//     getAttendanceOverview: builder.query({
//       query: ({ date }) => `/attendance/overview?date=${date}`,
//     }),
//     markAttendanceWithRoutine: builder.mutation({
//       query: (data) => ({
//         url: '/attendance/mark-with-routine',
//         method: 'POST',
//         body: data
//       })
//     }),
//   }),
// });

// export const {
//   useGetClassRoutineQuery,
//   useGetTodaysScheduleQuery,
//   useGetAttendanceOverviewQuery,
//   useMarkAttendanceWithRoutineMutation,
//   useMarkAttendanceMutation,
//   useGetClassAttendanceQuery,
//   useGetStudentAttendanceQuery,
//   useGetClassAttendanceSummaryQuery,
//   useUpdateAttendanceMutation,
//   useDeleteAttendanceMutation,
//   useGetTodayAttendanceQuery,
//   useGetTeacherSubjectsAttendanceQuery,
//   useGetMyAttendanceQuery,
//   useGetChildrenAttendanceQuery,
//   useGetAttendanceAnalyticsQuery,
// } = attendanceApi;