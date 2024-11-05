import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./index";
import { Instruction } from "@/types";

interface InstructionsState {
  instructions: Instruction[];
  selectedInstructionId: string | null;
}

const initialState: InstructionsState = {
  instructions: [],
  selectedInstructionId: null,
};

const instructionsSlice = createSlice({
  name: "instructions",
  initialState,
  reducers: {
    addInstruction: (state, action: PayloadAction<Instruction>) => {
      state.instructions.push(action.payload);
    },
    removeInstruction: (state, action: PayloadAction<string>) => {
      state.instructions = state.instructions.filter(
        (instruction) => instruction.id !== action.payload
      );
    },
    setInstructions: (state, action: PayloadAction<Instruction[]>) => {
      state.instructions = action.payload;
    },
    setSelectedInstructionId: (state, action: PayloadAction<string | null>) => {
      state.selectedInstructionId = action.payload;
    },
  },
});

export const {
  addInstruction,
  removeInstruction,
  setInstructions,
  setSelectedInstructionId,
} = instructionsSlice.actions;

export const selectInstructions = (state: RootState): Instruction[] =>
  state.instructions.instructions;
export const selectSelectedInstructionId = (state: RootState) =>
  state.instructions.selectedInstructionId;

export default instructionsSlice.reducer;
