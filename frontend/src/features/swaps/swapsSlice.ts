import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as swapApi from "./swapApi";
import { toast } from "react-toastify";
import type { User, SwapRequest } from "../../types";

export interface Swap {
  _id: string;
  fromUserId: string | User;
  toUserId: string | User;
  skillOffered: string;
  skillWanted: string;
  message?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SwapsState {
  swaps: Swap[];
  loading: boolean;
  error: string | null;
}

const initialState: SwapsState = {
  swaps: [],
  loading: false,
  error: null,
};

export const fetchSwaps = createAsyncThunk(
  "swaps/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await swapApi.getAllSwaps();
      return res.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to fetch swaps");
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch swaps",
      );
    }
  },
);

export const createSwap = createAsyncThunk(
  "swaps/create",
  async (
    data: Omit<SwapRequest, "_id" | "status" | "createdAt" | "updatedAt">,
    { rejectWithValue },
  ) => {
    try {
      const res = await swapApi.createSwap(data);
      toast.success("Swap request sent!");
      return res.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to create swap");
      return rejectWithValue(
        error.response?.data?.message || "Failed to create swap",
      );
    }
  },
);

export const updateSwap = createAsyncThunk(
  "swaps/update",
  async (
    { id, status }: { id: string; status: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await swapApi.updateSwapStatus(id, status);
      toast.success("Swap status updated!");
      return res.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to update swap");
      return rejectWithValue(
        error.response?.data?.message || "Failed to update swap",
      );
    }
  },
);

export const deleteSwap = createAsyncThunk(
  "swaps/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await swapApi.deleteSwap(id);
      toast.success("Swap deleted!");
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to delete swap");
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete swap",
      );
    }
  },
);

const swapsSlice = createSlice({
  name: "swaps",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSwaps.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSwaps.fulfilled, (state, action) => {
        state.loading = false;
        state.swaps = action.payload;
      })
      .addCase(fetchSwaps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createSwap.fulfilled, (state, action) => {
        state.swaps.push(action.payload);
      })
      .addCase(updateSwap.fulfilled, (state, action) => {
        state.swaps = state.swaps.map((swap) =>
          swap._id === action.payload._id ? action.payload : swap,
        );
      })
      .addCase(deleteSwap.fulfilled, (state, action) => {
        state.swaps = state.swaps.filter((swap) => swap._id !== action.payload);
      });
  },
});

export default swapsSlice.reducer;
