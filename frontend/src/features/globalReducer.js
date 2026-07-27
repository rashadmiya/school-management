import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isSidebarCollapsed: false,
    isDarkMode: false,
    showLoginAlert: false,
};

export const globalSlice = createSlice({
    name: "global",
    initialState,
    reducers: {
        setIsSidebarCollapsed: (state, action) => {
            state.isSidebarCollapsed = action.payload;
        },
        setIsDarkMode: (state, action) => {
            state.isDarkMode = action.payload;
        },
        setShowLoginAlert: (state, action) => {
            state.showLoginAlert = action.payload;
        },
    },
});

export const {
    setIsSidebarCollapsed,
    setIsDarkMode,
    setShowLoginAlert,
} = globalSlice.actions;

export default globalSlice.reducer;
