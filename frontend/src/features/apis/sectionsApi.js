// features/apis/sectionsApi.js

import { api } from "./api";

export const sectionsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getSections: builder.query({ query: () => '/sections/all', providesTags: ['Section'] }),
        getActiveSections: builder.query({ query: () => '/sections/active', providesTags: ['Section'] }),
        createSection: builder.mutation({ query: (data) => ({ url: '/sections/create', method: 'POST', body: data }), invalidatesTags: ['Section'] }),
        updateSection: builder.mutation({ query: ({ id, ...data }) => ({ url: `/sections/${id}`, method: 'PUT', body: data }), invalidatesTags: ['Section'] }),
        deleteSection: builder.mutation({ query: (id) => ({ url: `/sections/${id}`, method: 'DELETE' }), invalidatesTags: ['Section'] })
    })
});

export const { useGetSectionsQuery, useGetActiveSectionsQuery, useCreateSectionMutation, useUpdateSectionMutation, useDeleteSectionMutation } = sectionsApi;