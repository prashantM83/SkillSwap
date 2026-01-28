import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { User } from "../../types";
import api from "./axiosConfig";
import {
  getCurrentUser,
  updateUser as updateUserApi,
  getUserById,
  UpdateUserData,
} from "../../services/userService";

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
};

export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    {
      name,
      email,
      password,
    }: { name: string; email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      return res.data;
    } catch (err: unknown) {
      const error = err as ApiError;
      return rejectWithValue(
        error.response?.data?.message || "Registration failed",
      );
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      return res.data;
    } catch (err: unknown) {
      const error = err as ApiError;
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  },
);

// Get current user profile
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const user = await getCurrentUser();
      return user;
    } catch (err: unknown) {
      const error = err as ApiError;
      // If user is banned, logout automatically
      if (
        error.response?.status === 403 &&
        error.response?.data?.message?.includes("banned")
      ) {
        dispatch(logout());
        return rejectWithValue(
          "Your account has been banned. Please contact support.",
        );
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user",
      );
    }
  },
);

// Update user profile
export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (
    { userId, userData }: { userId: string; userData: UpdateUserData },
    { rejectWithValue },
  ) => {
    try {
      const updatedUser = await updateUserApi(userId, userData);
      return updatedUser;
    } catch (err: unknown) {
      const error = err as ApiError;
      return rejectWithValue(
        error.response?.data?.message || "Failed to update user",
      );
    }
  },
);

// Get user by ID
export const fetchUserById = createAsyncThunk(
  "auth/fetchUserById",
  async (userId: string, { rejectWithValue }) => {
    try {
      const user = await getUserById(userId);
      return user;
    } catch (err: unknown) {
      const error = err as ApiError;
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user",
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
