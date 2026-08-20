// features/apis/directoryApi.js
import { api } from "./api";

export const directoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // =========== STAFF ===========
    getStaff: builder.query({
      query: (params = {}) => {
        const {
          page = 1,
          limit = 20,
          search = "",
          session,
          designation,
          isActive
        } = params;

        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page);
        if (limit) queryParams.append('limit', limit);
        if (search) queryParams.append('search', search);
        if (session) queryParams.append('session', session);
        if (designation) queryParams.append('designation', designation);
        if (isActive !== undefined) queryParams.append('isActive', isActive);

        return `/stuff?${queryParams.toString()}`;
      },
      providesTags: ["Staff"],
    }),

    getStaffById: builder.query({
      query: (id) => `/stuff/${id}`,
      providesTags: (result, error, id) => [{ type: "Staff", id }],
    }),

    createStaff: builder.mutation({
      query: (staffData) => ({
        url: "/stuff",
        method: "POST",
        body: staffData,
      }),
      invalidatesTags: ["Staff"],
    }),

    updateStaff: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/stuff/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Staff", id },
        "Staff",
      ],
    }),

    deleteStaff: builder.mutation({
      query: (id) => ({
        url: `/stuff/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Staff"],
    }),

    getStaffStats: builder.query({
      query: () => "/stuff/stats/count",
      providesTags: ["Staff"],
    }),

    // =========== COMMITTEE ===========
    getCommittee: builder.query({
      query: (params = {}) => {
        const {
          page = 1,
          limit = 20,
          session,
          designation,
          isActive
        } = params;

        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page);
        if (limit) queryParams.append('limit', limit);
        if (session) queryParams.append('session', session);
        if (designation) queryParams.append('designation', designation);
        if (isActive !== undefined) queryParams.append('isActive', isActive);

        return `/committee?${queryParams.toString()}`;
      },
      providesTags: ["Committee"],
    }),

    getCommitteeById: builder.query({
      query: (id) => `/committee/${id}`,
      providesTags: (result, error, id) => [{ type: "Committee", id }],
    }),

    createCommitteeMember: builder.mutation({
      query: (committeeData) => ({
        url: "/committee",
        method: "POST",
        body: committeeData,
      }),
      invalidatesTags: ["Committee"],
    }),

    updateCommitteeMember: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/committee/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Committee", id },
        "Committee",
      ],
    }),

    deleteCommitteeMember: builder.mutation({
      query: (id) => ({
        url: `/committee/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Committee"],
    }),

    updateCommitteeOrder: builder.mutation({
      query: (orderUpdates) => ({
        url: "/committee/order/update",
        method: "PUT",
        body: { orderUpdates },
      }),
      invalidatesTags: ["Committee"],
    }),

    // =========== CABINET ===========
    getCabinet: builder.query({
      query: (params = {}) => {
        const {
          page = 1,
          limit = 20,
          session,
          class: classId,
          designation,
          isActive
        } = params;

        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page);
        if (limit) queryParams.append('limit', limit);
        if (session) queryParams.append('session', session);
        if (classId) queryParams.append('class', classId);
        if (designation) queryParams.append('designation', designation);
        if (isActive !== undefined) queryParams.append('isActive', isActive);

        return `/cabinet?${queryParams.toString()}`;
      },
      providesTags: ["Cabinet"],
    }),

    getCabinetById: builder.query({
      query: (id) => `/cabinet/${id}`,
      providesTags: (result, error, id) => [{ type: "Cabinet", id }],
    }),

    getStudentCabinetById: builder.query({
      query: (id) => `/cabinet/${id}`,
      providesTags: (result, error, id) => [{ type: 'StudentCabinet', id }],
    }),

    createCabinetMember: builder.mutation({
      query: (cabinetData) => ({
        url: "/cabinet",
        method: "POST",
        body: cabinetData,
      }),
      invalidatesTags: ["Cabinet"],
    }),

    updateCabinetMember: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/cabinet/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Cabinet", id },
        "Cabinet",
      ],
    }),

    deleteCabinetMember: builder.mutation({
      query: (id) => ({
        url: `/cabinet/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cabinet"],
    }),

    getCabinetBySession: builder.query({
      query: (session) => `/cabinet/session/${session}`,
      providesTags: ["Cabinet"],
    }),

    // =========== CLUBS ===========
    getClubs: builder.query({
      query: (params = {}) => {
        const {
          page = 1,
          limit = 20,
          search = "",
          session,
          supervisor,
          type,
          isActive
        } = params;

        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page);
        if (limit) queryParams.append('limit', limit);
        if (search) queryParams.append('search', search);
        if (session) queryParams.append('session', session);
        if (supervisor) queryParams.append('supervisor', supervisor);
        if (type) queryParams.append('type', type);
        if (isActive !== undefined) queryParams.append('isActive', isActive);

        return `/clubs?${queryParams.toString()}`;
      },
      providesTags: ["Club"],
    }),

    getClubById: builder.query({
      query: (id) => `/clubs/${id}`,
      providesTags: (result, error, id) => [{ type: "Club", id }],
    }),

    createClub: builder.mutation({
      query: (clubData) => ({
        url: "/clubs",
        method: "POST",
        body: clubData,
      }),
      invalidatesTags: ["Club"],
    }),

    updateClub: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/clubs/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Club", id },
        "Club",
      ],
    }),

    deleteClub: builder.mutation({
      query: (id) => ({
        url: `/clubs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Club"],
    }),

    addClubMember: builder.mutation({
      query: ({ id, student, role }) => ({
        url: `/clubs/${id}/members`,
        method: "POST",
        body: { student, role },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Club", id },
        "Club",
      ],
    }),

    removeClubMember: builder.mutation({
      query: ({ id, memberId }) => ({
        url: `/clubs/${id}/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Club", id },
        "Club",
      ],
    }),

    // =========== PUBLIC CLUBS ===========
    getPublicClubs: builder.query({
      query: (params = {}) => {
        const { session, type } = params;
        const queryParams = new URLSearchParams();
        if (session) queryParams.append('session', session);
        if (type) queryParams.append('type', type);
        return `/clubs/public/active?${queryParams.toString()}`;
      },
      providesTags: ["PublicClub"],
    }),

    getPublicClubById: builder.query({
      query: (id) => `/clubs/public/${id}`,
      providesTags: (result, error, id) => [{ type: "PublicClub", id }],
    }),

    // =========== SECTIONS ===========
    getSections: builder.query({
      query: (params = {}) => {
        const {
          page = 1,
          limit = 20,
          search = "",
          isActive
        } = params;

        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page);
        if (limit) queryParams.append('limit', limit);
        if (search) queryParams.append('search', search);
        if (isActive !== undefined) queryParams.append('isActive', isActive);

        return `/sections?${queryParams.toString()}`;
      },
      providesTags: ["Section"],
    }),

    getSectionById: builder.query({
      query: (id) => `/sections/${id}`,
      providesTags: (result, error, id) => [{ type: "Section", id }],
    }),

    createSection: builder.mutation({
      query: (sectionData) => ({
        url: "/sections",
        method: "POST",
        body: sectionData,
      }),
      invalidatesTags: ["Section"],
    }),

    updateSection: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/sections/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Section", id },
        "Section",
      ],
    }),

    deleteSection: builder.mutation({
      query: (id) => ({
        url: `/sections/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Section"],
    }),

    getSectionStats: builder.query({
      query: () => "/sections/stats/count",
      providesTags: ["Section"],
    }),

    // =========== PUBLIC DIRECTORY ===========
    getPublicStaff: builder.query({
      query: (params = {}) => {
        const { session, designation } = params;
        const queryParams = new URLSearchParams();
        if (session) queryParams.append('session', session);
        if (designation) queryParams.append('designation', designation);
        return `/public/staff?${queryParams.toString()}`;
      },
    }),

    getPublicStaffById: builder.query({
      query: (id) => `/public/staff/${id}`,
    }),

    getPublicCommittee: builder.query({
      query: (params = {}) => {
        const { session } = params;
        const queryParams = new URLSearchParams();
        if (session) queryParams.append('session', session);
        return `/public/committee?${queryParams.toString()}`;
      },
    }),

    getCommitteeWithQuotes: builder.query({
      query: () => '/committee/with-quotes',
      providesTags: ['Committee'],
    }),
    getPublicCommitteeById: builder.query({
      query: (id) => `/public/committee/${id}`,
    }),

    getPublicCabinet: builder.query({
      query: (params = {}) => {
        const { session } = params;
        const queryParams = new URLSearchParams();
        if (session) queryParams.append('session', session);
        return `/public/cabinet?${queryParams.toString()}`;
      },
    }),

    getPublicCabinetById: builder.query({
      query: (id) => `/public/cabinet/${id}`,
    }),


    getPublicSections: builder.query({
      query: () => "/public/sections",
    }),

    getDirectoryStats: builder.query({
      query: () => "/public/directory/stats",
    }),
  }),
});

export const {
  // Staff
  useGetStaffQuery,
  useLazyGetStaffQuery,
  useGetStaffByIdQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useGetStaffStatsQuery,

  // Committee
  useGetCommitteeQuery,
  useLazyGetCommitteeQuery,
  useGetCommitteeByIdQuery,
  useCreateCommitteeMemberMutation,
  useUpdateCommitteeMemberMutation,
  useDeleteCommitteeMemberMutation,
  useUpdateCommitteeOrderMutation,

  // Cabinet
  useGetCabinetQuery,
  useLazyGetCabinetQuery,
  useGetCabinetByIdQuery,
  useGetStudentCabinetByIdQuery,
  useCreateCabinetMemberMutation,
  useUpdateCabinetMemberMutation,
  useDeleteCabinetMemberMutation,
  useGetCabinetBySessionQuery,

  // Clubs
  useGetClubsQuery,
  useLazyGetClubsQuery,
  useGetClubByIdQuery,
  useCreateClubMutation,
  useUpdateClubMutation,
  useDeleteClubMutation,
  useAddClubMemberMutation,
  useRemoveClubMemberMutation,

  // Sections
  useGetSectionsQuery,
  useLazyGetSectionsQuery,
  useGetSectionByIdQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
  useGetSectionStatsQuery,

  // Public Directory
  useGetPublicStaffQuery,
  useGetPublicStaffByIdQuery,
  useGetPublicCommitteeQuery,
  useGetPublicCommitteeByIdQuery,
  useGetCommitteeWithQuotesQuery,
  useGetPublicCabinetQuery,
  useGetPublicCabinetByIdQuery,
  useGetPublicClubsQuery,
  useGetPublicClubByIdQuery,
  useGetPublicSectionsQuery,
  useGetDirectoryStatsQuery,
} = directoryApi;