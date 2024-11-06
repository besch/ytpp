import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./index";
import { Instruction } from "@/types";

interface InstructionsState {
  instructions: Instruction[];
  editingInstruction: Instruction | null;
  selectedInstructionId: string | null;
}

const initialState: InstructionsState = {
  instructions: [],
  editingInstruction: null,
  selectedInstructionId: null,
};

const instructionsSlice = createSlice({
  name: "instructions",
  initialState,
  reducers: {
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
    },
    setInstructions: (state, action: PayloadAction<Instruction[]>) => {
      state.instructions = action.payload;
    },
  },
});

export const {
  addInstruction,
  updateInstruction,
  removeInstruction,
  setEditingInstruction,
  setSelectedInstructionId,
  setInstructions,
} = instructionsSlice.actions;

export const selectInstructions = (state: RootState) =>
  state.instructions.instructions;
export const selectEditingInstruction = (state: RootState) =>
  state.instructions.editingInstruction;
export const selectSelectedInstructionId = (state: RootState) =>
  state.instructions.selectedInstructionId;

export default instructionsSlice.reducer;
