import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Plus, Edit2, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  selectInstructions,
  setEditingInstruction,
  removeInstruction,
} from "@/store/timelineSlice";
import type { Instruction } from "@/types";
import { formatTime } from "@/lib/time";
import InstructionTypeSelect from "./InstructionTypeSelect";
import { dispatchCustomEvent } from "@/lib/eventSystem";

const InstructionsList: React.FC = () => {
  const dispatch = useDispatch();
  const instructions = useSelector(selectInstructions);
  const [showTypeSelect, setShowTypeSelect] = useState(false);

  const handleAddNew = () => {
    setShowTypeSelect(true);
  };

  const handleTypeSelect = (type: string) => {
    dispatch(setEditingInstruction({ type } as Instruction));
    setShowTypeSelect(false);
  };

  const handleEdit = (instruction: Instruction) => {
    dispatch(setEditingInstruction(instruction));
    dispatchCustomEvent("SEEK_TO_TIME", {
      timeMs: instruction.triggerTime,
    });
  };

  const handleDelete = (id: string) => {
    dispatch(removeInstruction(id));
    dispatchCustomEvent("SAVE_INSTRUCTIONS", {
      instructions,
    });
  };

  if (showTypeSelect) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTypeSelect(false)}
          >
            ← Back
          </Button>
          <h3 className="text-lg font-medium">Select Instruction Type</h3>
        </div>
        <InstructionTypeSelect onSelect={handleTypeSelect} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Instructions</h3>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Instruction
        </Button>
      </div>

      <div className="space-y-2">
        {instructions.map((instruction) => (
          <div
            key={instruction.id}
            className="p-3 bg-muted/10 border border-border rounded-lg hover:bg-muted/20 flex items-center justify-between"
          >
            <div>
              <span className="font-medium capitalize">{instruction.type}</span>
              <span className="text-sm text-muted-foreground ml-2">
                at {formatTime(instruction.triggerTime)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {instruction.type === "skip" && (
                <span className="text-sm text-muted-foreground">
                  → {formatTime((instruction as any).skipToTime)}
                </span>
              )}
              {instruction.type === "pause" && (
                <span className="text-sm text-muted-foreground">
                  for {(instruction as any).pauseDuration}s
                </span>
              )}
              <Button variant="ghost" onClick={() => handleEdit(instruction)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleDelete(instruction.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}

        {instructions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No instructions yet. Click the button above to add one.
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructionsList;
