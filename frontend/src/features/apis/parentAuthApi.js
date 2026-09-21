// features/apis/parentAuthApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import { parentBaseQuery } from "./baseQueryParent";
import { parentLoggedIn, parentLoggedOut, parentSessionHydrated } from "../slices/parentAuthSlice";

export const parentAuthApi = createApi({
    reducerPath: "parentAuthApi",
    baseQuery: parentBaseQuery,
    tagTypes: ["ParentAuth"],
    endpoints: (builder) => ({
        parentLogin: builder.mutation({
            query: ({ phone, pin }) => ({
                url: "/parent-auth/login",
                method: "POST",
                body: { phone, pin },
            }),
            async onQueryStarted(arg, { queryFulfilled, dispatch }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(parentLoggedIn({
                        parent: data.parent,
                        mustChangePin: data.mustChangePin,
                    }));
                } catch { /* toast handled by caller */ }
            },
            invalidatesTags: ["ParentAuth"],
        }),

        changeParentPin: builder.mutation({
            query: ({ currentPin, newPin }) => ({
                url: "/parent-auth/change-pin",
                method: "POST",
                body: { currentPin, newPin },
            }),
            invalidatesTags: ["ParentAuth"],
        }),

        getParentMe: builder.query({
            query: () => "/parent-auth/me",
            async onQueryStarted(arg, { queryFulfilled, dispatch }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(parentSessionHydrated({ parent: data.parent }));
                } catch {
                    dispatch(parentLoggedOut());
                }
            },
            providesTags: ["ParentAuth"],
        }),

        parentLogout: builder.mutation({
            query: () => ({ url: "/parent-auth/logout", method: "POST" }),
            async onQueryStarted(arg, { queryFulfilled, dispatch }) {
                try { await queryFulfilled; } catch { /* ignore */ }
                dispatch(parentLoggedOut());
            },
            invalidatesTags: ["ParentAuth"],
        }),
    }),
});

export const {
    useParentLoginMutation,
    useChangeParentPinMutation,
    useGetParentMeQuery,
    useParentLogoutMutation,
} = parentAuthApi;


// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// export const parentAuthApi = createApi({
//     reducerPath: "parentAuthApi",
//     baseQuery: fetchBaseQuery({
//         baseUrl: `${API_URL}/parent-auth`,
//         credentials: "include",   // must send parent_token cookie
//     }),
//     tagTypes: ["ParentAuth"],
//     endpoints: (builder) => ({
//         parentLogin: builder.mutation({
//             query: ({ phone, pin }) => ({
//                 url: "/login",
//                 method: "POST",
//                 body: { phone, pin },
//             }),
//             invalidatesTags: ["ParentAuth"],
//         }),
//         changeParentPin: builder.mutation({
//             query: ({ currentPin, newPin }) => ({
//                 url: "/change-pin",
//                 method: "POST",
//                 body: { currentPin, newPin },
//             }),
//             invalidatesTags: ["ParentAuth"],
//         }),
//         getParentMe: builder.query({
//             query: () => "/me",
//             providesTags: ["ParentAuth"],
//         }),
//         parentLogout: builder.mutation({
//             query: () => ({ url: "/logout", method: "POST" }),
//             invalidatesTags: ["ParentAuth", "ParentPortal", "ParentDashboard"],
//         }),
//     }),
// });

// export const {
//     useParentLoginMutation,
//     useChangeParentPinMutation,
//     useGetParentMeQuery,
//     useParentLogoutMutation,
// } = parentAuthApi;