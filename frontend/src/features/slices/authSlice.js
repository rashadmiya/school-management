import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: "",
  user: null,
  role: null,       // "admin", "teacher", "parent", "student"
  profile: null,
  isStudent: false, // to detect API flow easily
  isHydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userLoggedIn: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.profile = action.payload.profile; // ✅ Store profile
      state.isStudent = action.payload.isStudent;
      state.isHydrated = true;

      localStorage.setItem(
        "auth",
        JSON.stringify({
          token: action.payload.token,
          user: action.payload.user,     // ← Add this
          role: action.payload.role,     // ← Add this
          isStudent: action.payload.isStudent,
          profile: action.payload.profile, // ✅ Store profile in localStorage
        })
      );
    },

    userLoggedOut: (state) => {
      state.token = "";
      state.user = null;
      state.role = null;
      state.isStudent = false;
      state.profile = null; // ✅ Clear profile
      state.isHydrated = true;
      localStorage.removeItem("auth");
    },
  },
  //add extraReducers for this line, in the customBaseQuery
  // api.dispatch({ type: "auth/refreshSuccess", payload: refreshResult.data });
  extraReducers: (builder) => {
    builder.addCase("auth/refreshSuccess", (state, action) => {
      // Update token or user info after refresh
      state.token = action.payload.token;
      if (action.payload.user) {
        state.user = action.payload.user;
      }
    });
  },
});

export const { userLoggedIn, userLoggedOut } = authSlice.actions;
export default authSlice.reducer;

// import { createSlice } from "@reduxjs/toolkit";

// const initialState = {
//   token: "",
//   user: null,
//   isHydrated: false,
// };

// const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     userRegistration: (state, action) => {
//       state.token = action.payload.token;
//     },
//     userLoggedIn: (state, action) => {
//       state.token = action.payload.token;
//       state.user = action.payload.user;
//       state.isHydrated = true;
//       // Save to localStorage
//       localStorage.setItem(
//         "auth",
//         JSON.stringify({
//           token: action.payload.token,
//           user: action.payload.user,
//         })
//       );
//     },
//     userLoggedOut: (state) => {
//       state.token = "";
//       state.user = null;
//       state.isHydrated = true;
//       // Clear from localStorage
//       localStorage.removeItem("auth");
//     },
//   },
// });

// export const { userRegistration, userLoggedIn, userLoggedOut } = authSlice.actions;

// export default authSlice.reducer;
