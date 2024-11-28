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
import type { Instruction, SkipInstruction, OverlayInstruction } from "@/types";
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
    if (instruction?.type === "overlay" && instruction.overlayMedia?.url) {
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

  const getInstructionDescription = (instruction: Instruction): string => {
    if (instruction.type === "skip") {
      return `Skips to ${formatTime(
        (instruction as SkipInstruction).skipToTime
      )}`;
    } else if (instruction.type === "overlay") {
      const overlayInstruction = instruction as OverlayInstruction;
      let description = `Displays ${
        overlayInstruction.overlayMedia?.name || "overlay media"
      }`;
      if (overlayInstruction.pauseMainVideo) {
        if (overlayInstruction.useOverlayDuration) {
          description += " (Pauses for overlay duration)";
        } else {
          description += ` (Pauses for ${overlayInstruction.pauseDuration}s)`;
        }
      }
      return description;
    }
    return "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">{currentTimeline?.title}</h1>
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
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-4" />
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
                  <h1 className="font-medium capitalize">
                    {instruction.type} Instruction
                  </h1>
                  <p className="text-sm text-muted-foreground ml-2">
                    at {formatTime(instruction.triggerTime)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getInstructionDescription(instruction)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      dispatch(seekToTime(instruction.triggerTime))
                    }
                  >
                    <Play size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(instruction)}
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(instruction.id)}
                  >
                    <Trash2 size={16} className="text-destructive" />
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
