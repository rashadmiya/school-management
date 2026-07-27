import { api } from "./api"; // your baseApi setup (already used in authApi, etc.)

export const publicApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Pages
        getPageBySlug: builder.query({
            query: (slug) => `/public/pages/${slug}`,
            providesTags: ['Page'],
        }),
        getAllPages: builder.query({
            query: () => '/public/pages',
            providesTags: ['Page'],
        }),

        // Settings
        getPublicSettings: builder.query({
            query: () => '/public/settings',
            providesTags: ['Settings'],
        }),

        // Statistics
        getStatistics: builder.query({
            query: () => '/public/statistics',
        }),

        // Public endpoints
        getPublicAnnouncements: builder.query({
            query: (params = {}) => ({
                url: '/announcements/public-announcements',
                params
            }),
            providesTags: ['Announcement'],
        }),
        getPublicAnnouncement: builder.query({
            query: (id) => `/announcements/public-announcement/${id}`,
            providesTags: ['Announcement'],
        }),
        getAnnouncementCategories: builder.query({
            query: () => '/announcements/public-announcements/categories',
        }),
    }),
});

export const {
    useGetPageBySlugQuery,
    useGetAllPagesQuery,
    useGetPublicSettingsQuery,
    useGetStatisticsQuery,
    //public announcement
    useGetPublicAnnouncementsQuery,
    useGetPublicAnnouncementQuery,
    useGetAnnouncementCategoriesQuery,
    
} = publicApi;