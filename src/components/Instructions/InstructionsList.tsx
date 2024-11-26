import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Plus, Edit2, Trash2, Play } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  selectInstructions,
  setEditingInstruction,
  removeInstruction,
  selectCurrentTimeline,
  selectEditingInstruction,
  seekToTime,
} from "@/store/timelineSlice";
import type { Instruction, PauseInstruction, SkipInstruction } from "@/types";
import { formatTime } from "@/lib/time";
import InstructionTypeSelect from "./InstructionTypeSelect";
import { api } from "@/lib/api";

const InstructionsList: React.FC = () => {
  const dispatch = useDispatch();
  const currentTimeline = useSelector(selectCurrentTimeline);
  const instructions = useSelector(selectInstructions);
  const editingInstruction = useSelector(selectEditingInstruction);
  const [showTypeSelect, setShowTypeSelect] = useState(false);

  useEffect(() => {
    if (editingInstruction) {
      setShowTypeSelect(false);
    }
  }, [editingInstruction]);

  const handleAddNew = () => {
    setShowTypeSelect(true);
  };

  const handleTypeSelect = (type: string) => {
    dispatch(setEditingInstruction({ type } as Instruction));
    setShowTypeSelect(false);
  };

  const handleEdit = (instruction: Instruction) => {
    dispatch(setEditingInstruction(instruction));
    dispatch(seekToTime(instruction.triggerTime));
  };

  const handleDelete = async (id: string) => {
    const instruction = instructions.find((inst) => inst.id === id);
    if (
      (instruction?.type === "pause" || instruction?.type === "overlay") &&
      instruction.overlayMedia?.url
    ) {
      await api.timelines.deleteMedia(instruction.overlayMedia.url);
    }

    const updatedInstructions = instructions.filter(
      (instruction) => instruction.id !== id
    );
    dispatch(removeInstruction(id));

    await api.timelines.update(currentTimeline!.id, {
      instructions: updatedInstructions,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Instructions</h3>
        <div>
          {showTypeSelect ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTypeSelect(false)}
            >
              Cancel
            </Button>
          ) : (
            <Button onClick={handleAddNew} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Instruction
            </Button>
          )}
        </div>
      </div>

      {showTypeSelect ? (
        <InstructionTypeSelect onSelect={handleTypeSelect} />
      ) : instructions.length > 0 ? (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {instructions
            .slice()
            .sort((a, b) => a.triggerTime - b.triggerTime)
            .map((instruction) => (
              <div
                key={instruction.id}
                className="p-3 bg-muted/10 border border-border rounded-lg hover:bg-muted/20 flex items-center justify-between"
              >
                <div>
                  <span className="font-medium capitalize">
                    {instruction.type} Instruction
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    at {formatTime(instruction.triggerTime)}
                  </span>
                  <div className="text-sm text-muted-foreground mt-1">
                    {instruction.type === "skip" && (
                      <>
                        Skips to{" "}
                        {formatTime(
                          (instruction as SkipInstruction).skipToTime
                        )}
                      </>
                    )}
                    {instruction.type === "pause" && (
                      <>
                        Pauses for{" "}
                        {(instruction as PauseInstruction).pauseDuration}s
                      </>
                    )}
                    {instruction.type === "overlay" && (
                      <>Displays overlay media</>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      dispatch(seekToTime(instruction.triggerTime))
                    }
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(instruction)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(instruction.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No instructions yet. Click the button above to add one.
        </div>
      )}
    </div>
  );
};

export default InstructionsList;
