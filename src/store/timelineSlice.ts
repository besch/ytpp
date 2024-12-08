import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/store/index";
import {
  Timeline,
  Instruction,
  TextOverlayMedia,
  TextOverlayInstruction,
} from "@/types";
import { createSelector } from "@reduxjs/toolkit";
import type { Draft } from "@reduxjs/toolkit";

interface TimelineState {
  currentTime: number;
  selectedElementId: string | null;
  activeTab: string;
  editingInstruction: Instruction | null;
  selectedInstructionId: string | null;
  isCanvasVisible: boolean;
  timelines: Timeline[];
  currentTimeline: Timeline | null;
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
    addInstruction: (state, action: PayloadAction<Instruction>) => {
      if (state.currentTimeline) {
        state.currentTimeline.instructions.push(action.payload);
      }
    },
    updateInstruction: (state, action: PayloadAction<Instruction>) => {
      if (state.currentTimeline) {
        const index = state.currentTimeline.instructions.findIndex(
          (instruction) => instruction.id === action.payload.id
        );
        if (index !== -1) {
          state.currentTimeline.instructions[index] = action.payload;
        }
      }
    },
    removeInstruction: (state, action: PayloadAction<string>) => {
      if (state.currentTimeline) {
        state.currentTimeline.instructions =
          state.currentTimeline.instructions.filter(
            (instruction) => instruction.id !== action.payload
          );
      }
    },
    setEditingInstruction: (
      state,
      action: PayloadAction<Instruction | null>
    ) => {
      state.editingInstruction = action.payload;
    },
    setSelectedInstructionId: (state, action: PayloadAction<string | null>) => {
      state.selectedInstructionId = action.payload;
      state.selectedElementId = null;
    },
    setInstructions: (state, action: PayloadAction<Instruction[]>) => {
      if (state.currentTimeline) {
        state.currentTimeline.instructions = action.payload;
      }
    },
    setCanvasVisibility: (state, action: PayloadAction<boolean>) => {
      state.isCanvasVisible = action.payload;
    },
    setTimelines: (state, action: PayloadAction<Timeline[]>) => {
      state.timelines = action.payload;
    },
    setCurrentTimeline: (state, action: PayloadAction<Timeline | null>) => {
      state.currentTimeline = action.payload;
    },
    timelineDeleted: (state, action: PayloadAction<string>) => {
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
    seekToTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    updateTextOverlay: (
      state,
      action: PayloadAction<{
        instructionId: string;
        textOverlay: TextOverlayMedia;
      }>
    ) => {
      if (state.currentTimeline) {
        const instruction = state.currentTimeline.instructions.find(
          (i) => i.id === action.payload.instructionId
        ) as TextOverlayInstruction | undefined;

        if (instruction) {
          instruction.textOverlay = action.payload.textOverlay;
        }
      }
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
  updateTextOverlay,
} = timelineSlice.actions;

export const selectCurrentTime = (state: RootState) =>
  state.timeline.currentTime;
export const selectActiveTab = (state: RootState) => state.timeline.activeTab;
export const selectInstructions = createSelector(
  [(state: RootState) => state.timeline.currentTimeline],
  (currentTimeline) => currentTimeline?.instructions ?? []
);
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
export const selectTextOverlayInstructions = createSelector(
  [selectInstructions],
  (instructions) =>
    instructions.filter(
      (instruction): instruction is TextOverlayInstruction =>
        instruction.type === "text-overlay"
    )
);

export default timelineSlice.reducer;
