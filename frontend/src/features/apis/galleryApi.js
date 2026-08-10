// features/apis/galleryApi.js
import { api } from "./api";

export const galleryApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Get all gallery images (admin with filters)
        getGalleryImages: builder.query({
            query: (params = {}) => ({
                url: '/gallery',
                params: {
                    page: params.page || 1,
                    limit: params.limit || 20,
                    category: params.category || '',
                    search: params.search || '',
                    isPublished: params.isPublished,
                    sortBy: params.sortBy || 'createdAt',
                    sortOrder: params.sortOrder || 'desc',
                    ...params
                }
            }),
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ _id }) => ({ type: 'Gallery', id: _id })),
                        { type: 'Gallery', id: 'LIST' },
                    ]
                    : [{ type: 'Gallery', id: 'LIST' }],
        }),
        
        getGalleryImage: builder.query({
            query: (id) => `/gallery/${id}`,
            providesTags: (result, error, id) => [{ type: 'Gallery', id }],
        }),
        
        getGalleryCategories: builder.query({
            query: () => '/gallery/categories',
            providesTags: ['GalleryCategories'],
        }),
        
        // Upload gallery image - FIXED
        uploadGalleryImage: builder.mutation({
            query: (formData) => ({
                url: '/gallery/upload',
                method: 'POST',
                body: formData,
                // CRITICAL: Don't set Content-Type for FormData
            }),
            invalidatesTags: ['Gallery', 'GalleryCategories'],
        }),
        
        updateGalleryImage: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/gallery/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Gallery', id },
                'Gallery',
                'GalleryCategories',
            ],
        }),
        
        deleteGalleryImage: builder.mutation({
            query: (id) => ({
                url: `/gallery/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Gallery', 'GalleryCategories'],
        }),
        
        bulkDeleteGalleryImages: builder.mutation({
            query: (ids) => ({
                url: '/gallery/bulk',
                method: 'DELETE',
                body: { ids },
            }),
            invalidatesTags: ['Gallery', 'GalleryCategories'],
        }),
        
        togglePublishGalleryImage: builder.mutation({
            query: (id) => ({
                url: `/gallery/${id}/toggle-publish`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Gallery', id },
                'Gallery',
                'GalleryCategories',
            ],
        }),
    }),
});

export const {
    useGetGalleryImagesQuery,
    useGetGalleryImageQuery,
    useGetGalleryCategoriesQuery,
    useUploadGalleryImageMutation,
    useUpdateGalleryImageMutation,
    useDeleteGalleryImageMutation,
    useBulkDeleteGalleryImagesMutation,
    useTogglePublishGalleryImageMutation,
} = galleryApi;