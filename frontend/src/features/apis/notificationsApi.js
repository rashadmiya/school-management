import { api } from "./api";


export const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: ({ userId }) => `/notifications/${userId}`,
      providesTags: (res) => res ? res.map(n => ({ type: "Notifications", id: n._id })) : []
    }),
    createNotification: builder.mutation({
      query: (body) => ({ url: "/notifications/create", method: "POST", body }),
      invalidatesTags: [{ type: "Notifications", id: "LIST" }]
    }),
    markRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: (r,e,id) => [{ type: "Notifications", id }]
    })
  })
});

export const { useGetNotificationsQuery, useCreateNotificationMutation, useMarkReadMutation } = notificationsApi;
