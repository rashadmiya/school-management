import { createApi } from "@reduxjs/toolkit/query/react";
import { customBaseQuery } from "../baseQuery";

export const api = createApi({
    reducerPath: "api",
    baseQuery: customBaseQuery,
    // tagTypes: [
    //     "Students", "Subjects", "Teachers", "Classes", "Routines", "Attendance", "Exams", "Assignments", "Results", "Parents", "Notifications", "Grades"
    // ],

    tagTypes: [
        'Auth',
        'User',
        'Student',
        'Teacher',
        'Parent',
        'Class',
        'Subject', // ✅ Add this
        'Routine',
        'Attendance', // ✅ Add this
        'Assignment', // ✅ Add this
        'Exam',
        'Result', // ✅ Add this
        'ResultSheet', // ✅ Add this
        'Announcement',
        'Page',
        'Setting',
        // NEW: Directory tags
        'Staff',
        'Committee',
        'Cabinet',
        'Club',
        'Section',
        'FeeStructure',
        'Payment',
        'Fee',
        'StudentFinance',
        'StudentLedger',
        'Dashboard',
        'TeacherFinance',
        'Performance',
        'Reports',
        'MyPayments',
        'MyDashboard',
        'FeeTemplate',
        'FeeInstance',
        'Report',
        'Ledger',
    ],
    endpoints: (builder) => ({

        getAdminDashboard: builder.query({
            query: () => "/admin/dashboard",
            providesTags: ["Dashboard"],
        }),
        // In your teacher creation API
        // ✅ OPTION 1: Create teacher without photo
        createTeacher: builder.mutation({
            query: (teacherData) => ({
                url: "/teachers/create",
                method: "POST",
                body: teacherData,
            }),
            invalidatesTags: [{ type: "Teachers", id: "LIST" }]
        }),

        // ✅ OPTION 2: Create teacher with photo (single step)
        createTeacherWithPhoto: builder.mutation({
            query: (formData) => ({
                url: "/teachers/create-with-photo",
                method: "POST",
                body: formData,
                // Note: No Content-Type header - browser will set it for FormData
            }),
            invalidatesTags: [{ type: "Teachers", id: "LIST" }]
        }),

        // ✅ OPTION 3: Upload/update teacher photo
        uploadTeacherPhoto: builder.mutation({
            query: ({ id, formData }) => ({
                url: `/teachers/${id}/photo`,
                method: "POST",
                body: formData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Teachers", id },
                { type: "Teachers", id: "LIST" }
            ]
        }),

        // ✅ OPTION 4: Remove teacher photo
        removeTeacherPhoto: builder.mutation({
            query: (id) => ({
                url: `/teachers/${id}/photo`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "Teachers", id },
                { type: "Teachers", id: "LIST" }
            ]
        }),

        // Create parent

        createParent: builder.mutation({
            query: (parentData) => ({
                url: "/parents/create",
                method: "POST",
                body: parentData,
            }),
            async onQueryStarted(arg, { queryFulfilled, dispatch }) {
                try {
                    const { data } = await queryFulfilled;
                    // If you want to immediately update the state (optional)
                    console.log("parent created:", data);

                    // You could dispatch an action to add to parents list
                    // dispatch(parentAdded(data.profile));
                } catch (err) {
                    console.error("parent creation failed:", err);
                }
            },
        }),

        // Create student
        // ✅ OPTION 1: Create student without photo
        createStudent: builder.mutation({
            query: (studentData) => ({
                url: "/students/register",
                method: "POST",
                body: studentData,
            }),
            async onQueryStarted(arg, { queryFulfilled, dispatch }) {
                try {
                    const { data } = await queryFulfilled;
                    if (data.token && data.student) {
                        dispatch(userLoggedIn({
                            token: data.token,
                            user: data.student,
                            role: "student",
                            isStudent: true
                        }));
                    }
                } catch (err) {
                    console.error("Student creation failed:", err);
                }
            },
            invalidatesTags: [{ type: "Students", id: "LIST" }]
        }),

        // ✅ OPTION 2: Create student with photo (single step)
        createStudentWithPhoto: builder.mutation({
            query: (formData) => ({
                url: "/students/register-with-photo",
                method: "POST",
                body: formData,
            }),
            async onQueryStarted(arg, { queryFulfilled, dispatch }) {
                try {
                    const { data } = await queryFulfilled;
                    if (data.token && data.student) {
                        dispatch(userLoggedIn({
                            token: data.token,
                            user: data.student,
                            role: "student",
                            isStudent: true
                        }));
                    }
                } catch (err) {
                    console.error("Student creation with photo failed:", err);
                }
            },
            invalidatesTags: [{ type: "Students", id: "LIST" }]
        }),

        // ✅ OPTION 3: Upload/update student photo
        // uploadStudentPhoto: builder.mutation({
        //     query: ({ id, formData }) => ({
        //         url: `/students/${id}/photo`,
        //         method: "POST",
        //         body: formData,
        //     }),
        //     invalidatesTags: (result, error, { id }) => [
        //         { type: "Students", id },
        //         { type: "Students", id: "LIST" },
        //         { type: "StudentProfile" }
        //     ]
        // }),

        // ✅ OPTION 4: Remove student photo
        removeStudentPhoto: builder.mutation({
            query: (id) => ({
                url: `/students/${id}/photo`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "Students", id },
                { type: "Students", id: "LIST" },
                { type: "StudentProfile" }
            ]
        }),

        // Admin Pages integrate for public access
        getAdminPages: builder.query({
            query: () => '/admin/all-pages',
            providesTags: ['AdminPage'],
        }),
        getAdminPageById: builder.query({
            query: (id) => `/admin/page/${id}`,
            providesTags: ['AdminPage'],
        }),
        createPage: builder.mutation({
            query: (pageData) => ({
                url: '/admin/create-page',
                method: 'POST',
                body: pageData,
            }),
            invalidatesTags: ['AdminPage'],
        }),
        updatePage: builder.mutation({
            query: ({ id, ...pageData }) => ({
                url: `/admin/update-page/${id}`,
                method: 'PUT',
                body: pageData,
            }),
            invalidatesTags: ['AdminPage', 'Page'],
        }),
        deletePage: builder.mutation({
            query: (id) => ({
                url: `/admin/delete-page/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['AdminPage', 'Page'],
        }),
        updatePageOrder: builder.mutation({
            query: (pages) => ({
                url: '/admin/page-order/update',
                method: 'PUT',
                body: { pages },
            }),
            invalidatesTags: ['AdminPage'],
        }),

        // Admin Settings
        getAdminSettings: builder.query({
            query: (params = {}) => ({
                url: '/admin/all-settings',
                params,
            }),
            providesTags: ['AdminSetting'],
        }),

        getSettingsByCategory: builder.query({
            query: (category) => `/admin/settings-by-category/${category}`,
            providesTags: ['AdminSetting'],
        }),

        createSetting: builder.mutation({
            query: (settingData) => ({
                url: '/admin/create-setting',
                method: 'POST',
                body: settingData,
            }),
            invalidatesTags: ['AdminPage'],
        }),

        updateSetting: builder.mutation({
            query: ({ id, ...pageData }) => ({
                url: `/admin/update-setting/${id}`,
                method: 'PUT',
                body: pageData,
            }),
            invalidatesTags: ['AdminPage', 'Page'],
        }),

        updateSettingsBulk: builder.mutation({
            query: (settings) => ({
                url: '/admin/setting/bulk-update',
                method: 'PUT',
                body: { settings },
            }),
            invalidatesTags: ['AdminSetting', 'Settings'],
        }),

        deleteSetting: builder.mutation({
            query: (key) => ({
                url: `/admin/delete-setting/${key}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['AdminSetting', 'Settings'],
        }),

        // announcement endpoints
        getAdminAnnouncements: builder.query({
            query: (params = {}) => ({
                url: '/announcements/admin-announcements',
                params
            }),
            providesTags: ['AdminAnnouncement'],
        }),
        getAdminAnnouncement: builder.query({
            query: (id) => `/announcements/admin-announcement/${id}`,
            providesTags: ['AdminAnnouncement'],
        }),
        createAnnouncement: builder.mutation({
            query: (announcementData) => ({
                url: '/announcements/create',
                method: 'POST',
                body: announcementData,
            }),
            invalidatesTags: ['AdminAnnouncement', 'Announcement'],
        }),
        updateAnnouncement: builder.mutation({
            query: ({ id, ...announcementData }) => ({
                url: `/announcements/update/${id}`,
                method: 'PUT',
                body: announcementData,
            }),
            invalidatesTags: ['AdminAnnouncement', 'Announcement'],
        }),
        deleteAnnouncement: builder.mutation({
            query: (id) => ({
                url: `/announcements/delete/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['AdminAnnouncement', 'Announcement'],
        }),
        togglePinAnnouncement: builder.mutation({
            query: (id) => ({
                url: `/announcements/pin-status/${id}/pin`,
                method: 'PATCH',
            }),
            invalidatesTags: ['AdminAnnouncement', 'Announcement'],
        }),

    }),
});

export const {
    useGetAdminDashboardQuery,
    // teachers
    useCreateTeacherMutation,
    useCreateTeacherWithPhotoMutation,
    useUploadTeacherPhotoMutation,
    useRemoveTeacherPhotoMutation,
    //teachers
    useCreateParentMutation,
    //students
    useCreateStudentMutation,
    useCreateStudentWithPhotoMutation,
    // useUploadStudentPhotoMutation,
    useRemoveStudentPhotoMutation,
    //students

    // Pages
    useGetAdminPagesQuery,
    useGetAdminPageByIdQuery,
    useCreatePageMutation,
    useUpdatePageMutation,
    useDeletePageMutation,
    useUpdatePageOrderMutation,

    // Settings
    useGetAdminSettingsQuery,
    useGetSettingsByCategoryQuery,
    useCreateSettingMutation,
    useUpdateSettingMutation,
    useUpdateSettingsBulkMutation,
    useDeleteSettingMutation,
    //announcement
    useGetAdminAnnouncementsQuery,
    useGetAdminAnnouncementQuery,
    useCreateAnnouncementMutation,
    useUpdateAnnouncementMutation,
    useDeleteAnnouncementMutation,
    useTogglePinAnnouncementMutation,
} = api;


//  export const adminApi = api.injectEndpoints({
//    endpoints: (builder) => ({
//      getAdminStats: builder.query({
//        query: () => '/admin/stats',
//      }),
//      getTodayAttendance: builder.query({
//        query: () => '/admin/today-attendance',
//      }),
//      getRecentActivity: builder.query({
//        query: () => '/admin/recent-activity',
//      }),
//    }),
//  });