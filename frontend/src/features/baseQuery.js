import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setShowLoginAlert } from "./globalReducer";
import { server } from "@/utils/server";
import { userLoggedOut } from "./slices/authSlice";

const baseQuery = fetchBaseQuery({
    baseUrl: server,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
        const authState = getState()?.auth;
        const token = authState?.token;

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        return headers;
    },
});

export const customBaseQuery = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    // ✅ If 401 → Refresh Token Flow
    if (result.error?.status === 401) {
        console.warn("Token expired → trying refresh...");

        // Detect which API is calling (student or user)
        // const isStudent = args.url.includes("/students");

        // const { isStudent } = api.getState().auth;
        const auth = JSON.parse(localStorage.getItem("auth") || "{}");
        const isStudent = auth.isStudent;

        const refreshUrl = isStudent ? "/students/refresh" : "/user/refresh";

        const refreshResult = await baseQuery(
            { url: refreshUrl, method: "GET" },
            api,
            extraOptions
        );

        if (refreshResult.data) {
            console.log("Refresh success ✅ Fetching user again...");


            console.log("Refresh success ✅");
            api.dispatch({ type: "auth/refreshSuccess", payload: refreshResult.data });

            // Retry original request
            result = await baseQuery(args, api, extraOptions);
        } else {
            console.error("Refresh failed ❌ Logging out...");

            api.dispatch(userLoggedOut());

            api.dispatch(setShowLoginAlert(true));
        }
    }

    return result;
};


// import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import { setShowLoginAlert } from "./globalReducer";
// import { server } from "@/utils/server";
// import { userLoggedOut } from "./slices/authSlice";

// const baseQuery = fetchBaseQuery({
//     baseUrl: server,
//     credentials: "include",
//     prepareHeaders: (headers, { getState }) => {
//         // Safely get token from auth slice
//         const authState = getState()?.auth;
//         const token = authState?.token;

//         if (token) {
//             headers.set("Authorization", `Bearer ${token}`);
//         }

//         return headers;
//     },
// });

// export const customBaseQuery = async (args, api, extraOptions) => {
//   let result = await baseQuery(args, api, extraOptions);

//   // ✅ If Access Token expired (401) → Try refresh token
//   if (result.error?.status === 401) {
//     console.log("Access token expired, trying refresh...");

//     // call refresh token endpoint
//     const refreshResult = await baseQuery(
//       { url: "/user/refresh", method: "GET" },
//       api,
//       extraOptions
//     );

//     if (refreshResult.data) {
//       console.log("Refresh success, retrying original request...");

//       // Re-run the original request after refresh
//       result = await baseQuery(args, api, extraOptions);
//     } else {
//       console.log("Refresh failed, logging out user...");
//       api.dispatch(userLoggedOut());
//       api.dispatch(setShowLoginAlert(true));
//     }
//   }

//   return result;
// };

// export const customBaseQuery = async (args, api, extraOptions) => {
//     try {
//         const result = await baseQuery(args, api, extraOptions);

//         // If unauthorized, show login alert and optionally log out user
//         if (result.error?.status === 401) {
//             api.dispatch(setShowLoginAlert(true));
//             // Optional: clear auth state if desired
//             // api.dispatch(userLoggedOut());
//         }

//         return result;
//     } catch (err) {
//         console.error("BaseQuery Error:", err);
//         return { error: { status: "CUSTOM_ERROR", error: err } };
//     }
// };