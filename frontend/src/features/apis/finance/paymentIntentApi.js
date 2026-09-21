// src/api/paymentIntentApi.js
import { api } from "../api";

export const paymentIntentApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createPaymentIntent: builder.mutation({
            query: (data) => ({
                url: '/payment-intents',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['PaymentIntent'],
        }),

        listPaymentIntents: builder.query({
            query: ({ studentId, status, limit = 50 } = {}) => ({
                url: '/payment-intents',
                params: { studentId, status, limit },
            }),
            providesTags: ['PaymentIntent'],
        }),

        getPaymentIntent: builder.query({
            query: (id) => `/payment-intents/${id}`,
            providesTags: (result, error, id) => [{ type: 'PaymentIntent', id }],
        }),

        confirmPaymentIntent: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/payment-intents/${id}/confirm`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['PaymentIntent', 'Payment', 'FeeInstance', 'Ledger', 'Bill'],
        }),

        cancelPaymentIntent: builder.mutation({
            query: (id) => ({
                url: `/payment-intents/${id}/cancel`,
                method: 'POST',
            }),
            invalidatesTags: ['PaymentIntent'],
        }),
    }),
});

export const {
    useCreatePaymentIntentMutation,
    useListPaymentIntentsQuery,
    useGetPaymentIntentQuery,
    useConfirmPaymentIntentMutation,
    useCancelPaymentIntentMutation,
} = paymentIntentApi;