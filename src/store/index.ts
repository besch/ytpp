import { configureStore } from "@reduxjs/toolkit";
import timelineReducer from "@/store/timelineSlice";
import instructionsReducer from "@/store/instructionsSlice";

export const store = configureStore({
  reducer: {
    timeline: timelineReducer,
    instructions: instructionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
