import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/store/index";
import { Timeline, InstructionResponse, TextOverlayMedia } from "@/types";
import { createSelector } from "@reduxjs/toolkit";

interface TimelineState {
  currentTime: number;
  selectedElementId: string | null;
  activeTab: string;
  editingInstruction: InstructionResponse | null;
  selectedInstructionId: string | null;
  isCanvasVisible: boolean;
  timelines: Timeline[];
  currentTimeline: Timeline | null;
  instructions: InstructionResponse[];
  loading: boolean;
  error: string | null;
  videoElementId: string | null;
}

const initialState: TimelineState = {
  currentTime: 0,
  selectedElementId: null,
  activeTab: "elements",
  editingInstruction: null,
  selectedInstructionId: null,
  isCanvasVisible: true,
  timelines: [],
  currentTimeline: null,
  instructions: [],
  loading: false,
  error: null,
  videoElementId: null,
};

export const timelineSlice = createSlice({
  name: "timeline",
  initialState,
  reducers: {
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    addInstruction: (state, action: PayloadAction<InstructionResponse>) => {
      state.instructions.push(action.payload);
    },
    updateInstruction: (state, action: PayloadAction<InstructionResponse>) => {
      const index = state.instructions.findIndex(
        (instruction) => instruction.id === action.payload.id
      );
      if (index !== -1) {
        state.instructions[index] = action.payload;
      }
    },
    removeInstruction: (state, action: PayloadAction<string>) => {
      state.instructions = state.instructions.filter(
        (instruction) => instruction.id !== action.payload
      );
    },
    setEditingInstruction: (
      state,
      action: PayloadAction<InstructionResponse | null>
    ) => {
      state.editingInstruction = action.payload;
    },
    setSelectedInstructionId: (state, action: PayloadAction<string | null>) => {
      state.selectedInstructionId = action.payload;
      state.selectedElementId = null;
    },
    setInstructions: (state, action: PayloadAction<InstructionResponse[]>) => {
      state.instructions = action.payload;
    },
    setCanvasVisibility: (state, action: PayloadAction<boolean>) => {
      state.isCanvasVisible = action.payload;
    },
    setTimelines: (state, action: PayloadAction<Timeline[]>) => {
      state.timelines = action.payload;
    },
    setCurrentTimeline: (state, action: PayloadAction<Timeline | null>) => {
      state.instructions = [];
      state.editingInstruction = null;
      state.selectedInstructionId = null;
      state.currentTimeline = action.payload;
    },
    timelineDeleted: (state, action: PayloadAction<number>) => {
      state.timelines = state.timelines.filter((t) => t.id !== action.payload);
      if (state.currentTimeline?.id === action.payload) {
        state.currentTimeline = null;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setVideoElement: (state, action: PayloadAction<string | null>) => {
      state.videoElementId = action.payload;
    },
    seekToTime: (state, action: PayloadAction<number | undefined>) => {
      if (typeof action.payload === "number") {
        state.currentTime = action.payload;
      }
    },
    renameInstruction: (
      state,
      action: PayloadAction<{ id: string; name: string }>
    ) => {
      state.instructions = state.instructions.map((instruction) =>
        instruction.id === action.payload.id
          ? { ...instruction, name: action.payload.name }
          : instruction
      );
    },
  },
});

export const {
  setCurrentTime,
  addInstruction,
  updateInstruction,
  removeInstruction,
  setEditingInstruction,
  setSelectedInstructionId,
  setInstructions,
  setCanvasVisibility,
  setTimelines,
  setCurrentTimeline,
  timelineDeleted,
  setLoading,
  setError,
  setVideoElement,
  seekToTime,
  renameInstruction,
} = timelineSlice.actions;

export const selectCurrentTime = (state: RootState) =>
  state.timeline.currentTime;
export const selectActiveTab = (state: RootState) => state.timeline.activeTab;
export const selectInstructions = (state: RootState) =>
  state.timeline.instructions;
export const selectEditingInstruction = (state: RootState) =>
  state.timeline.editingInstruction;
export const selectSelectedInstructionId = (state: RootState) =>
  state.timeline.selectedInstructionId;
export const selectCanvasVisibility = (state: RootState) =>
  state.timeline.isCanvasVisible;
export const selectTimelines = (state: RootState) => state.timeline.timelines;
export const selectCurrentTimeline = (state: RootState) =>
  state.timeline.currentTimeline;
export const selectTimelineLoading = (state: RootState) =>
  state.timeline.loading;
export const selectTimelineError = (state: RootState) => state.timeline.error;
export const selectVideoElementId = (state: RootState) =>
  state.timeline.videoElementId;

export default timelineSlice.reducer;
