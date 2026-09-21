// src/api/notificationApi.js
import { api } from "../api";

export const notificationApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getNotificationPreferences: builder.query({
            query: () => '/notifications/preferences',
            providesTags: ['NotificationPreference'],
        }),

        updateNotificationPreferences: builder.mutation({
            query: (data) => ({
                url: '/notifications/preferences',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['NotificationPreference'],
        }),

        getNotifications: builder.query({
            query: ({ unreadOnly = false, limit = 30 } = {}) => ({
                url: '/notifications',
                params: { unreadOnly, limit },
            }),
            providesTags: ['Notification'],
        }),

        markNotificationRead: builder.mutation({
            query: (id) => ({
                url: `/notifications/${id}/read`,
                method: 'POST',
            }),
            invalidatesTags: ['Notification'],
        }),

        getParentNotifications: builder.query({
            query: ({ unreadOnly, limit } = {}) => ({
                url: '/notifications/parent',
                params: { unreadOnly, limit },
            }),
            providesTags: ['ParentNotifications'],
        }),

        markParentNotificationRead: builder.mutation({
            query: (id) => ({
                url: `/notifications/parent/${id}/read`,
                method: 'POST',
            }),
            invalidatesTags: ['ParentNotifications'],
        }),

    }),
});

export const {
    useGetNotificationPreferencesQuery,
    useUpdateNotificationPreferencesMutation,
    useGetNotificationsQuery,
    useMarkNotificationReadMutation,
    useGetParentNotificationsQuery,
    useMarkParentNotificationReadMutation,
} = notificationApi;