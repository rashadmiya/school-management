// features/slices/parentAuthSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    parent: null,              // { _id, name, phone, email, children }
    mustChangePin: false,
    isAuthenticated: false,
};

const parentAuthSlice = createSlice({
    name: "parentAuth", initialState,
    reducers: {
        parentLoggedIn: (state, action) => {
            state.parent = action.payload.parent;
            state.mustChangePin = !!action.payload.mustChangePin;
            state.isAuthenticated = true;
        },
        parentPinChanged: (state) => {
            state.mustChangePin = false;
        },
        parentSessionHydrated: (state, action) => {
            state.parent = action.payload.parent;
            state.isAuthenticated = !!action.payload.parent;
            // mustChangePin only known at login; do not update here
        },
        parentLoggedOut: (state) => {
            state.parent = null;
            state.mustChangePin = false;
            state.isAuthenticated = false;
        },
    },
});

export const {
    parentLoggedIn,
    parentPinChanged,
    parentSessionHydrated,
    parentLoggedOut,
} = parentAuthSlice.actions;

export default parentAuthSlice.reducer;