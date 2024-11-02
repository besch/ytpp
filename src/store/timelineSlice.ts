import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/store/index";

interface ElementStyle {
  fill: string;
  stroke?: string;
}

interface TimelineState {
  currentTime: number;
  timeRange: {
    from: number;
    to: number;
  };
  selectedElement: {
    id: string | null;
    style: ElementStyle;
  };
}

const initialState: TimelineState = {
  currentTime: 0,
  timeRange: {
    from: 0,
    to: 0,
  },
  selectedElement: {
    id: null,
    style: {
      fill: "#000000",
      stroke: "#000000",
    },
  },
};

const timelineSlice = createSlice({
  name: "timeline",
  initialState,
  reducers: {
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    setTimeRange: (
      state,
      action: PayloadAction<{ from: number; to: number }>
    ) => {
      state.timeRange = action.payload;
    },
    setSelectedElement: (state, action: PayloadAction<string | null>) => {
      state.selectedElement.id = action.payload;
      if (!action.payload) {
        state.selectedElement.style = { fill: "#000000", stroke: "#000000" };
      }
    },
    setElementColor: (
      state,
      action: PayloadAction<{ type: "fill" | "stroke"; color: string }>
    ) => {
      state.selectedElement.style[action.payload.type] = action.payload.color;
    },
  },
});

export const {
  setCurrentTime,
  setTimeRange,
  setSelectedElement,
  setElementColor,
} = timelineSlice.actions;

// Selectors
export const selectCurrentTime = (state: RootState) =>
  state.timeline.currentTime;
export const selectTimeRange = (state: RootState) => state.timeline.timeRange;
export const selectSelectedElement = (state: RootState) =>
  state.timeline.selectedElement;
export const selectSelectedElementStyle = (state: RootState) =>
  state.timeline.selectedElement.style;

export default timelineSlice.reducer;
