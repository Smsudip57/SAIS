import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserProfile {
  name: string;
  avatarUrl: string;
}

export interface AuthUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profile: UserProfile;
  isActive: boolean;
  createdAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading } = authSlice.actions;
export default authSlice.reducer;
