import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/store/index";
import { Instruction } from "@/types";

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
  activeTab: string;
  instructions: Instruction[];
  editingInstruction: Instruction | null;
  selectedInstructionId: string | null;
  isCanvasVisible: boolean;
}

const initialState: TimelineState = {
  currentTime: 0,
  elements: [],
  selectedElementId: null,
  activeTab: "elements",
  instructions: [],
  editingInstruction: null,
  selectedInstructionId: null,
  isCanvasVisible: false,
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
      state.selectedInstructionId = null;
      state.selectedElementId = action.payload;
    },
    setElements: (state, action: PayloadAction<Element[]>) => {
      state.elements = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    addInstruction: (state, action: PayloadAction<Instruction>) => {
      state.instructions.push(action.payload);
    },
    updateInstruction: (state, action: PayloadAction<Instruction>) => {
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
      action: PayloadAction<Instruction | null>
    ) => {
      state.editingInstruction = action.payload;
    },
    setSelectedInstructionId: (state, action: PayloadAction<string | null>) => {
      state.selectedInstructionId = action.payload;
      state.selectedElementId = null;
    },
    setInstructions: (state, action: PayloadAction<Instruction[]>) => {
      state.instructions = action.payload;
    },
    setCanvasVisibility: (state, action: PayloadAction<boolean>) => {
      state.isCanvasVisible = action.payload;
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
export const selectActiveTab = (state: RootState) => state.timeline.activeTab;
export const selectInstructions = (state: RootState) =>
  state.timeline.instructions;
export const selectEditingInstruction = (state: RootState) =>
  state.timeline.editingInstruction;
export const selectSelectedInstructionId = (state: RootState) =>
  state.timeline.selectedInstructionId;
export const selectCanvasVisibility = (state: RootState) =>
  state.timeline.isCanvasVisible;

export default timelineSlice.reducer;
