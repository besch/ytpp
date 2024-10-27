import { toast } from "react-toastify";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/store/index";
import config from "@/extension/content/config";
import {} from "@/api";

interface timelineState {}

const initialState: timelineState = {};

const timelineSlice = createSlice({
  name: "script",
  initialState,
  reducers: {},
  extraReducers: (builder) => {},
});

export const {} = timelineSlice.actions;

export default timelineSlice.reducer;
