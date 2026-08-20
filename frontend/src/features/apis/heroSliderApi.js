// features/apis/heroSliderApi.js
import { api } from "./api";

export const heroSliderApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Public endpoints
        getPublicHeroSliders: builder.query({
            query: () => '/hero-slider/public',
            providesTags: ['HeroSlider'],
        }),

        // Admin endpoints
        getHeroSliders: builder.query({
            query: () => '/hero-slider',
            providesTags: ['HeroSlider'],
        }),

        getHeroSlider: builder.query({
            query: (id) => `/hero-slider/${id}`,
            providesTags: (result, error, id) => [{ type: 'HeroSlider', id }],
        }),

        uploadHeroSlider: builder.mutation({
            query: (formData) => ({
                url: '/hero-slider/upload',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['HeroSlider'],
        }),

        updateHeroSlider: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/hero-slider/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'HeroSlider', id },
                'HeroSlider',
            ],
        }),

        deleteHeroSlider: builder.mutation({
            query: (id) => ({
                url: `/hero-slider/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['HeroSlider'],
        }),

        reorderHeroSliders: builder.mutation({
            query: (items) => ({
                url: '/hero-slider/reorder',
                method: 'PUT',
                body: { items },
            }),
            invalidatesTags: ['HeroSlider'],
        }),
    }),
});

export const {
    useGetPublicHeroSlidersQuery,
    useGetHeroSlidersQuery,
    useGetHeroSliderQuery,
    useUploadHeroSliderMutation,
    useUpdateHeroSliderMutation,
    useDeleteHeroSliderMutation,
    useReorderHeroSlidersMutation,
} = heroSliderApi;