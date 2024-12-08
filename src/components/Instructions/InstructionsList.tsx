import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Plus, Edit2, Trash2, Play, Check, X, Copy } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  selectInstructions,
  setEditingInstruction,
  removeInstruction,
  selectCurrentTimeline,
  selectEditingInstruction,
  seekToTime,
  cloneInstruction,
} from "@/store/timelineSlice";
import { selectIsTimelineOwner } from "@/store/authSlice";
import type { Instruction, SkipInstruction, OverlayInstruction } from "@/types";
import { formatTime } from "@/lib/time";
import InstructionTypeSelect from "./InstructionTypeSelect";
import { api } from "@/lib/api";
import { RootState } from "@/store";
import TimelineTitle from "./TimelineTitle";
import { useNavigate, useParams } from "react-router-dom";

const InstructionsList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: timelineId } = useParams();
  const currentTimeline = useSelector(selectCurrentTimeline);
  const instructions = useSelector(selectInstructions);
  const editingInstruction = useSelector(selectEditingInstruction);
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const isOwner = useSelector((state: RootState) =>
    selectIsTimelineOwner(state, currentTimeline)
  );

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
    navigate(`/timeline/${timelineId}/instruction`);
  };

  const handleEdit = (instruction: Instruction) => {
    dispatch(setEditingInstruction(instruction));
    dispatch(seekToTime(instruction.triggerTime));
    navigate(`/timeline/${timelineId}/instruction/${instruction.id}`);
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

  const handleClone = async (instruction: Instruction) => {
    dispatch(cloneInstruction(instruction.id));

    await api.timelines.update(currentTimeline!.id, {
      instructions,
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
      return description;
    }
    return "";
  };

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <TimelineTitle />
        <div>
          {isOwner && (
            <>
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
            </>
          )}
        </div>
      </div>

      {showTypeSelect && isOwner ? (
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
                  {isOwner && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClone(instruction)}
                      >
                        <Copy size={16} />
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
                    </>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No instructions yet. {isOwner && "Click the button above to add one."}
        </div>
      )}
    </div>
  );
};

export default InstructionsList;
