import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/store/index";

interface ElementStyle {
  fill: string;
  stroke?: string;
}

interface Element {
  id: string;
  type: string;
  style: ElementStyle;
  timeRange: {
    from: number;
    to: number;
  };
  properties: {
    scaleMode: "fixed" | "responsive";
    originalWidth: number;
    originalHeight: number;
    originalX: number;
    originalY: number;
    relativeX?: number; // Percentage of video width
    relativeY?: number; // Percentage of video height
    relativeWidth?: number; // Percentage of video width
    relativeHeight?: number; // Percentage of video height
  };
}

interface TimelineState {
  currentTime: number;
  elements: Element[];
  selectedElementId: string | null;
}

const initialState: TimelineState = {
  currentTime: 0,
  elements: [],
  selectedElementId: null,
};

const timelineSlice = createSlice({
  name: "timeline",
  initialState,
  reducers: {
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    addElement: (state, action: PayloadAction<Element>) => {
      state.elements.push(action.payload);
    },
    updateElement: (state, action: PayloadAction<Partial<Element>>) => {
      const index = state.elements.findIndex(
        (el) => el.id === action.payload.id
      );
      if (index !== -1) {
        state.elements[index] = { ...state.elements[index], ...action.payload };
      }
    },
    setSelectedElementId: (state, action: PayloadAction<string | null>) => {
      state.selectedElementId = action.payload;
    },
    setElements: (state, action: PayloadAction<Element[]>) => {
      state.elements = action.payload;
    },
  },
});

export const {
  setCurrentTime,
  addElement,
  updateElement,
  setSelectedElementId,
  setElements,
} = timelineSlice.actions;

export const selectCurrentTime = (state: RootState) =>
  state.timeline.currentTime;
export const selectElements = (state: RootState) => state.timeline.elements;
export const selectSelectedElementId = (state: RootState) =>
  state.timeline.selectedElementId;
export const selectSelectedElement = (state: RootState) => {
  const selectedId = state.timeline.selectedElementId;
  return selectedId
    ? state.timeline.elements.find((el) => el.id === selectedId)
    : null;
};

export default timelineSlice.reducer;
