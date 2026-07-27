// features/apis/routinesApi.js
import { api } from "./api";

export const routinesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRoutines: builder.query({
      query: (params = {}) => ({
        url: "/routines",
        method: "GET",
        params,
      }),
      providesTags: ["Routine"],
    }),

        // Get class slots for timetable grid
    getClassSlots: builder.query({
      query: ({ classId, day }) => ({
        url: `/routines/class/${classId}/slots`,
        params: { day }
      }),
      providesTags: ["Routine"]
    }),

    getRoutine: builder.query({
      query: (id) => `/routines/${id}`,
      providesTags: (result, error, id) => [{ type: "Routine", id }],
    }),

    createRoutine: builder.mutation({
      query: (routineData) => ({
        url: "/routines",
        method: "POST",
        body: routineData,
      }),
      invalidatesTags: ["Routine"],
    }),

    updateRoutine: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/routines/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Routine", id },
        "Routine",
      ],
    }),

    deleteRoutine: builder.mutation({
      query: (id) => ({
        url: `/routines/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Routine"],
    }),

    getTodayRoutine: builder.query({
      query: (classId) => `/routines/class/${classId}/today`,
      providesTags: ["Routine"],
    }),

    getTodaySchedules: builder.query({
      query: () => `/routines/today-schedules`,
      providesTags: ["Routine"],
    }),
  }),
});

export const {
  useGetRoutinesQuery,
  useGetClassSlotsQuery,
  useGetRoutineQuery,
  useCreateRoutineMutation,
  useUpdateRoutineMutation,
  useDeleteRoutineMutation,
  useGetTodayRoutineQuery,
  useGetTodaySchedulesQuery,
} = routinesApi;

// import { api } from "./api";

// export const routineApi = api.injectEndpoints({
//   endpoints: (builder) => ({
//     getRoutines: builder.query({
//       query: ({ classId, day } = {}) => {
//         const params = new URLSearchParams();
//         if (classId) params.append("classId", classId);
//         if (day) params.append("day", day);
//         return `/routine?${params.toString()}`;
//       },
//       providesTags: (result) =>
//         result ? [...result.map(r => ({ type: "Routines", id: r._id })), { type: "Routines", id: "LIST" }] : [{ type: "Routines", id: "LIST" }],
//     }),
//     createRoutine: builder.mutation({
//       query: (body) => ({ url: "/routine/create", method: "POST", body }),
//       invalidatesTags: [{ type: "Routines", id: "LIST" }],
//     }),
//     updateRoutine: builder.mutation({
//       query: ({ id, ...patch }) => ({ url: `/routine/${id}`, method: "PUT", body: patch }),
//       invalidatesTags: (res, err, { id }) => [{ type: "Routines", id }, { type: "Routines", id: "LIST" }],
//     }),
//     deleteRoutine: builder.mutation({
//       query: (id) => ({ url: `/routine/${id}`, method: "DELETE" }),
//       invalidatesTags: [{ type: "Routines", id: "LIST" }],
//     }),
//     checkConflict: builder.mutation({
//       // optional helper endpoint if backend exposes one, otherwise conflict is handled server-side on create
//       query: (body) => ({ url: "/routine/check-conflict", method: "POST", body }),
//     }),
//   }),
// });

// export const {
//   useGetRoutinesQuery,
//   useCreateRoutineMutation,
//   useUpdateRoutineMutation,
//   useDeleteRoutineMutation,
//   useCheckConflictMutation,
// } = routineApi;
