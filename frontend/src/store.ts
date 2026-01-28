import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import swapsReducer from "./features/swaps/swapsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    swaps: swapsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
