// features/baseQueryParent.js
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { server } from "@/utils/server";

/**
 * Base query for parent-facing endpoints.
 *
 * - Sends `parent_token` cookie via credentials: "include"
 * - Does NOT attempt an admin/student refresh on 401
 *   (parents re-authenticate via /parent-auth/login)
 * - Does NOT attach an Authorization header
 *   (parent JWT lives only in the httpOnly cookie)
 */
export const parentBaseQuery = fetchBaseQuery({
    baseUrl: server,
    credentials: "include",
});