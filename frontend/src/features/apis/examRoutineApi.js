// features/apis/examRoutineApi.js
import { api } from "./api";

export const examRoutineApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getExamRoutines: builder.query({
            query: (params = {}) => ({
                url: "/exam-routines/all",
                params
            }),
            providesTags: ["ExamRoutine"]
        }),
        getExamRoutine: builder.query({
            query: (id) => `/exam-routines/${id}`,
            providesTags: ["ExamRoutine"]
        }),
        createExamRoutine: builder.mutation({
            query: (data) => ({
                url: "/exam-routines/create",
                method: "POST",
                body: data
            }),
            invalidatesTags: ["ExamRoutine"]
        }),
        updateExamRoutine: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/exam-routines/${id}`,
                method: "PUT",
                body: data
            }),
            invalidatesTags: ["ExamRoutine"]
        }),
        deleteExamRoutine: builder.mutation({
            query: (id) => ({
                url: `/exam-routines/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["ExamRoutine"]
        }),
        getStudentExams: builder.query({
            query: () => "/exam-routines/student/my-exams",
            providesTags: ["ExamRoutine"]
        }),
        getTeacherExams: builder.query({
            query: () => "/exam-routines/teacher/my-exams",
            providesTags: ["ExamRoutine"]
        }),
        getClassExams: builder.query({
            query: (classId) => `/exam-routines/class/${classId}`,
            providesTags: ["ExamRoutine"]
        }),
        publishExamRoutine: builder.mutation({
            query: ({ id, isPublished }) => ({
                url: `/exam-routines/${id}/publish`,
                method: "PUT",
                body: { isPublished }
            }),
            invalidatesTags: ["ExamRoutine"]
        })
    })
});

export const {
    useGetExamRoutinesQuery,
    useGetExamRoutineQuery,
    useCreateExamRoutineMutation,
    useUpdateExamRoutineMutation,
    useDeleteExamRoutineMutation,
    useGetStudentExamsQuery,
    useGetTeacherExamsQuery,
    useGetClassExamsQuery,
    usePublishExamRoutineMutation
} = examRoutineApi;