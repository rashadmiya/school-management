// features/apis/examsApi.js
import { api } from "./api";

export const examsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getExams: builder.query({
      query: (params = {}) => ({
        url: "/exams",
        method: "GET",
        params,
      }),
      providesTags: ["Exam"],
    }),

    getExam: builder.query({
      query: (id) => `/exams/${id}`,
      providesTags: (result, error, id) => [{ type: "Exam", id }],
    }),

    createExam: builder.mutation({
      query: (examData) => ({
        url: "/exams",
        method: "POST",
        body: examData,
      }),
      invalidatesTags: ["Exam"],
    }),

    updateExam: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/exams/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Exam", id },
        "Exam",
      ],
    }),

    deleteExam: builder.mutation({
      query: (id) => ({
        url: `/exams/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Exam"],
    }),

    getClassExams: builder.query({
      query: ({ classId, status }) => ({
        url: `/exams/class/${classId}`,
        params: { status },
      }),
      providesTags: ["Exam"],
    }),

    getTeacherExams: builder.query({
      query: () => "/exams/teacher/my-exams",
      providesTags: ["Exam"],
    }),

    getUpcomingExams: builder.query({
      query: () => "/exams/student/upcoming",
      providesTags: ["Exam"],
    }),

    getTodayExams: builder.query({
      query: () => "/exams/today",
      providesTags: ["Exam"],
    }),

    getExamCalendar: builder.query({
      query: ({ year, month }) => `/exams/calendar/${year}/${month}`,
      providesTags: ["Exam"],
    }),
  }),
});

export const {
  useGetExamsQuery,
  useGetExamQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useGetClassExamsQuery,
  useGetTeacherExamsQuery,
  useGetUpcomingExamsQuery,
  useGetTodayExamsQuery,
  useGetExamCalendarQuery,
} = examsApi;

// import { api } from "./api";

// export const examsApi = api.injectEndpoints({
//   endpoints: (builder) => ({
//     getExams: builder.query({
//       query: ({ page=1, limit=50 }={}) => `/exams?page=${page}&limit=${limit}`,
//       providesTags: (result) => result ? [...result.docs.map(e=>({type:"Exams",id:e._id})),{type:"Exams",id:"LIST"}] : [{type:"Exams",id:"LIST"}]
//     }),
//     createExam: builder.mutation({
//       query: (body) => ({ url: "/exams/create", method: "POST", body }),
//       invalidatesTags: [{ type: "Exams", id: "LIST" }]
//     }),
//     updateExam: builder.mutation({
//       query: ({ id, ...patch }) => ({ url: `/exams/${id}`, method: "PUT", body: patch }),
//       invalidatesTags: (r,e,{id}) => [{ type:"Exams", id}, {type:"Exams", id:"LIST"}]
//     }),
//     deleteExam: builder.mutation({
//       query: (id) => ({ url: `/exams/${id}`, method: "DELETE" }),
//       invalidatesTags: [{ type:"Exams", id: "LIST" }]
//     }),
//   })
// });

// export const { useGetExamsQuery, useCreateExamMutation, useUpdateExamMutation, useDeleteExamMutation } = examsApi;
