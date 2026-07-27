import { userLoggedIn, userLoggedOut } from "../slices/authSlice";
import { api } from "./api";

export const authApi = api.injectEndpoints({
    endpoints: (builder) => ({
        refreshToken: builder.query({
            query: () => ({ url: "/user/refresh", method: "GET" }),
        }),

        login: builder.mutation({
            query: ({ email, password }) => ({
                url: "/user/login-user",
                method: "POST",
                body: { email, password },
            }),
            async onQueryStarted(arg, { queryFulfilled, dispatch }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(userLoggedIn({
                        token: data.token,
                        user: data.user,
                        role: data.user.role.name, // coming from backend role object
                        isStudent: false
                    }));
                    // dispatch(userLoggedIn({
                    //     token: data.token,
                    //     user: data.user,
                    //     profile: data.profile, // teacher or parent profile
                    //     role: data.user.role.name, // coming from backend
                    //     isStudent: false
                    // }));
                } catch (err) {
                    console.error("Login failed:", err);
                }
            },
        }),

        logOut: builder.mutation({
            // query: (_, { getState }) => {
            //     const { isStudent } = getState().auth;
            //     return {
            //         url: isStudent ? "/students/logout" : "/user/logout",
            //         method: "POST",
            //     };
            // },
            query: () => {
                const auth = JSON.parse(localStorage.getItem("auth") || "{}");
                const isStudent = auth.isStudent;

                return {
                    url: isStudent ? "/students/logout" : "/user/logout",
                    method: "POST",
                };
            },
            async onQueryStarted(arg, { queryFulfilled, dispatch }) {
                try {
                    await queryFulfilled;
                } catch (err) {
                    console.error("Logout API failed:", err);
                } finally {
                    dispatch(userLoggedOut());
                }
            },
        }),


        me: builder.query({
            query: () => {
                const auth = JSON.parse(localStorage.getItem("auth") || "{}");
                const isStudent = auth.isStudent;

                console.warn("isStudent :", isStudent)
                return {
                    url: isStudent ? "/students/me" : "/user/auth/me",
                    method: "GET",
                };
            },

            async onQueryStarted(arg, { queryFulfilled, dispatch }) {
                try {
                    const { data } = await queryFulfilled;
                    // const { isStudent } = getState().auth;
                    console.warn("me data :", data)

                    dispatch(userLoggedIn({
                        token: data.token,
                        user: data.user,
                        role: data.user.role.name || "",
                        // role: isStudent ? "student" : data.user.role.name,
                        isStudent: data.user.isStudent,
                    }));
                } catch (err) {
                    console.warn("me err :", err)
                    dispatch(userLoggedOut());
                }
            },

            keepUnusedDataFor: 3600,
        }),


        // ✅ createUser mutation
        createUser: builder.mutation({
            query: (formData) => ({
                url: "/user/create-user",
                method: "POST",
                body: formData, // must be FormData for file upload
            }),
        }),


        // me: builder.query({
        //     query: () => ({ url: "/user/auth/me", method: "GET" }),
        //     async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        //         try {
        //             const { data } = await queryFulfilled;
        //             if (data.token) {

        //                 dispatch(userLoggedIn({ token: data.token, user: data.user }));
        //             }
        //         } catch (err) {
        //             console.log("me data at mequery :", (await queryFulfilled).data)
        //             console.error("Failed to fetch user via /auth/me", err);
        //             dispatch(userLoggedOut()); // optional: clear user if token invalid
        //         }
        //     },
        //     keepUnusedDataFor: 3600, // cache for 1 hour
        // }),

        // logOut: builder.mutation({
        //     query: () => ({ url: "/user/logout", method: "POST" }),
        //     async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        //         try {
        //             await queryFulfilled;
        //             dispatch(userLoggedOut());
        //             localStorage.removeItem("user");
        //         } catch (err) {
        //             console.error("Logout failed:", err);
        //         }
        //     },
        // }),


        forgotPassword: builder.mutation({
            query: ({ email }) => ({
                url: "/user/forgot-password",
                method: "POST",
                body: { email },
            }),
        }),
        resetPassword: builder.mutation({
            query: ({ token, newPassword, confirmPassword }) => ({
                url: `/user/reset-password/${token}`,
                method: "PUT",
                body: { newPassword, confirmPassword },
            }),
        }),

        getUsers: builder.query({
            query: () => ({
                url: "/user/all-users",
                method: "GET",
                // credentials: "include" as const,
            }),
            providesTags: ['Users'],
        }),

        getAdminUsers: builder.query({
            query: () => ({
                url: "/user/admin-all-users",
                method: "GET",
                // credentials: "include" as const,
            }),
            providesTags: ['Users'],
        }),

        getUserById: builder.query({
            query: (id) => ({
                url: `/user/admin-user/${id}`,
                method: "GET",
            }),
            providesTags: ['Users'],
        }),

        updateUser: builder.mutation({
            query: ({ userId, role, businessType }) => ({
                url: `/user/admin-update-user/${userId}`,
                method: "PUT",
                body: {
                    role,
                    businessType,
                },
                // credentials: "include" as const,

            }),
            async onQueryStarted({ userId, role, businessType }, { queryFulfilled, dispatch }) {
                try {
                    await queryFulfilled;
                    dispatch(authApi.util.invalidateTags(['Users']));
                    // alert("User updated successfully");
                } catch (error) {
                    console.error("Failed to update user", error);
                    // alert("Failed to update user");
                }
            },
        }),


        updateUserByAdmin: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/user/update-user-by-admin/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Users"],
        }),

        resetUserPasswordByAdmin: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/user/${id}/reset-user-password-by-admin`,
                method: "PUT",
                body,
            }),
        }),

    }),
});

export const {
    useUpdateUserByAdminMutation,
    useResetUserPasswordByAdminMutation,
    useRefreshTokenQuery,
    useLoginMutation,
    useCreateUserMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
    useGetUsersQuery,
    useGetAdminUsersQuery,
    useGetUserByIdQuery,
    useUpdateUserMutation,
    useLogOutMutation,
    useMeQuery,

} = authApi;