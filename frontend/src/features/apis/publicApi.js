// features/apis/publicApi.js
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

        // ==================== Gallery Public Endpoints ====================
        getPublicGalleryImages: builder.query({
            query: (params = {}) => ({
                url: '/gallery',
                params: {
                    page: params.page || 1,
                    limit: params.limit || 20,
                    category: params.category || '',
                    search: params.search || '',
                    ...params
                }
            }),
            providesTags: ['Gallery'],
        }),
        getPublicGalleryImage: builder.query({
            query: (id) => `/gallery/${id}`,
            providesTags: (result, error, id) => [{ type: 'Gallery', id }],
        }),
        getPublicGalleryCategories: builder.query({
            query: () => '/gallery/categories',
            providesTags: ['GalleryCategories'],
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
    //public gallery
    useGetPublicGalleryImagesQuery,
    useGetPublicGalleryImageQuery,
    useGetPublicGalleryCategoriesQuery,
} = publicApi;
