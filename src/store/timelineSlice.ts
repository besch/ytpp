import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/store/index";
import { Timeline, Instruction, ElementStyle } from "@/types";
import { dispatchCustomEvent } from "@/lib/eventSystem";

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
};

interface ElementUpdate {
  id: string;
  timeRange?: {
    from: number;
    to: number;
  };
  style?: ElementStyle;
  properties?: {
    left: number;
    top: number;
    scaleX: number;
    scaleY: number;
    width: number;
    height: number;
    scaleMode: "responsive" | "fixed";
  };
}

export const timelineSlice = createSlice({
  name: "timeline",
  initialState,
  reducers: {
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    addElement: (state, action: PayloadAction<Element>) => {
      if (state.currentTimeline) {
        state.currentTimeline.elements.push(action.payload);
      }
    },
    updateElement: (state, action: PayloadAction<ElementUpdate>) => {
      if (state.currentTimeline) {
        const index = state.currentTimeline.elements.findIndex(
          (el) => el.id === action.payload.id
        );
        if (index !== -1) {
          state.currentTimeline.elements[index] = {
            ...state.currentTimeline.elements[index],
            ...action.payload,
          };
        }
      }
    },
    setSelectedElementId: (state, action: PayloadAction<string | null>) => {
      state.selectedInstructionId = null;
      state.selectedElementId = action.payload;
    },
    setElements: (state, action: PayloadAction<Element[]>) => {
      if (state.currentTimeline) {
        state.currentTimeline.elements = action.payload;
      }
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    addInstruction: (state, action: PayloadAction<Instruction>) => {
      if (state.currentTimeline) {
        state.currentTimeline.instructions.push(action.payload);
        dispatchCustomEvent("SET_TIMELINE", {
          timeline: state.currentTimeline,
        });
      }
    },
    updateInstruction: (state, action: PayloadAction<Instruction>) => {
      if (state.currentTimeline) {
        const index = state.currentTimeline.instructions.findIndex(
          (instruction) => instruction.id === action.payload.id
        );
        if (index !== -1) {
          state.currentTimeline.instructions[index] = action.payload;
          // dispatchCustomEvent("SET_TIMELINE", {
          //   timeline: state.currentTimeline,
          // });
        }
      }
    },
    removeInstruction: (state, action: PayloadAction<string>) => {
      if (state.currentTimeline) {
        state.currentTimeline.instructions =
          state.currentTimeline.instructions.filter(
            (instruction) => instruction.id !== action.payload
          );
        dispatchCustomEvent("SET_TIMELINE", {
          timeline: state.currentTimeline,
        });
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
        dispatchCustomEvent("SET_TIMELINE", {
          timeline: state.currentTimeline,
        });
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
      dispatchCustomEvent("SET_TIMELINE", { timeline: action.payload });
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
  },
});

export const {
  setCurrentTime,
  addElement,
  updateElement,
  setSelectedElementId,
  setElements,
  setActiveTab,
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
} = timelineSlice.actions;

export const selectCurrentTime = (state: RootState) =>
  state.timeline.currentTime;
export const selectElements = (state: RootState) =>
  state.timeline.currentTimeline?.elements ?? [];
export const selectSelectedElementId = (state: RootState) =>
  state.timeline.selectedElementId;
export const selectSelectedElement = (state: RootState) => {
  const selectedId = state.timeline.selectedElementId;
  return selectedId
    ? state.timeline.currentTimeline?.elements.find(
        (el) => el.id === selectedId
      )
    : null;
};
export const selectActiveTab = (state: RootState) => state.timeline.activeTab;
export const selectInstructions = (state: RootState) =>
  state.timeline.currentTimeline?.instructions ?? [];
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

export default timelineSlice.reducer;
