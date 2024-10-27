import { toast } from "react-toastify";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/store/index";
import config from "@/extension/content/config";
import {} from "@/types";
import {} from "@/api";

interface ScriptState {}

const initialState: ScriptState = {};

const scriptSlice = createSlice({
  name: "script",
  initialState,
  reducers: {},
  extraReducers: (builder) => {},
});

export const {} = scriptSlice.actions;

export default scriptSlice.reducer;
