import { configureStore } from "@reduxjs/toolkit";
import timelineReducer from "@/store/timelineSlice";
import authReducer from "@/store/authSlice";

export const store = configureStore({
  reducer: {
    timeline: timelineReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
