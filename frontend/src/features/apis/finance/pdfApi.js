// src/api/pdfApi.js
import { api } from "../api";

export const pdfApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getReceiptJson: builder.query({
            query: (paymentId) => `/pdf/receipt/${paymentId}?format=json`,
            providesTags: ['Payment'],
        }),
    }),
});

export const { useGetReceiptJsonQuery } = pdfApi;