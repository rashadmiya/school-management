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
