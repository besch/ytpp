import { configureStore } from "@reduxjs/toolkit";
import scriptReducer from "@/store/scriptSlice";

export const store = configureStore({
  reducer: {
    script: scriptReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
