import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthResolved: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserDetails: (state, action) => {
      state.user = action.payload || null;
      state.isAuthResolved = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthResolved = true;
    },
    setAuthResolved: (state, action) => {
      state.isAuthResolved = Boolean(action.payload);
    },
  },
});

export const { setUserDetails, clearUser, setAuthResolved } = userSlice.actions;

export default userSlice.reducer;
