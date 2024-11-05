import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectInstructions,
  removeInstruction,
} from "@/store/instructionsSlice";
import { selectCurrentTime } from "@/store/timelineSlice";
import { Clock, Pause, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { Instruction } from "@/types";

interface InstructionDetailsProps {
  instruction: Instruction;
  onClose: () => void;
}

const InstructionDetails: React.FC<InstructionDetailsProps> = ({
  instruction,
  onClose,
}) => {
  const dispatch = useDispatch();

  const handleDelete = () => {
    dispatch(removeInstruction(instruction.id));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg shadow-lg border border-border max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">Instruction Details</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            <span className="text-sm">Stop at: {instruction.stopTime}ms</span>
          </div>
          <div className="flex items-center gap-2">
            <Pause size={16} className="text-muted-foreground" />
            <span className="text-sm">
              Pause for: {instruction.pauseDuration}ms
            </span>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Instructions: React.FC = () => {
  const instructions = useSelector(selectInstructions);
  const [selectedInstruction, setSelectedInstruction] =
    useState<Instruction | null>(null);

  const handleInstructionClick = (instruction: Instruction) => {
    setSelectedInstruction(instruction);
  };

  return (
    <div className="mt-4 p-4 bg-background border border-border rounded-lg">
      <h3 className="text-sm font-medium text-foreground mb-4">Instructions</h3>
      <div className="space-y-2">
        {instructions.map((instruction) => (
          <div
            key={instruction.id}
            className="p-3 bg-muted/10 rounded-md flex justify-between items-center hover:bg-muted/20 cursor-pointer transition-colors"
            onClick={() => handleInstructionClick(instruction)}
          >
            <div>
              <p className="text-sm text-foreground">
                Stop at: {instruction.stopTime}ms
              </p>
              <p className="text-xs text-muted-foreground">
                Duration: {instruction.pauseDuration}ms
              </p>
            </div>
          </div>
        ))}
      </div>

      {selectedInstruction && (
        <InstructionDetails
          instruction={selectedInstruction}
          onClose={() => setSelectedInstruction(null)}
        />
      )}
    </div>
  );
};

export default Instructions;
