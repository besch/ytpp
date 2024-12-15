import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Plus, Play } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  selectInstructions,
  setEditingInstruction,
  selectCurrentTimeline,
  selectEditingInstruction,
  seekToTime,
  selectCurrentTime,
} from "@/store/timelineSlice";
import { selectIsTimelineOwner } from "@/store/authSlice";
import type { Instruction, SkipInstruction, OverlayInstruction } from "@/types";
import { formatTime } from "@/lib/time";
import InstructionTypeSelect from "./InstructionTypeSelect";
import TimelineDropdownMenu from "./TimelineDropdownMenu";
import { RootState } from "@/store";
import { useNavigate, useParams } from "react-router-dom";
import InstructionDropdownMenu from "./InstructionDropdownMenu";

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
  const currentTime = useSelector(selectCurrentTime);

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

  const isTimeMatching = (triggerTime: number): boolean => {
    const tolerance = 100;
    return Math.abs(triggerTime - currentTime) < tolerance;
  };

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">{currentTimeline?.title}</h1>
        <div className="flex items-center gap-2">
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
                <>
                  <Button onClick={handleAddNew}>
                    <Plus className="w-4 h-4 mr-4" />
                    Add Instruction
                  </Button>
                  {currentTimeline && (
                    <TimelineDropdownMenu
                      currentTimeline={currentTimeline}
                      isOwner={isOwner}
                    />
                  )}
                </>
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
                className={`p-3 border border-border rounded-lg flex items-center justify-between transition-all duration-200
                  ${
                    isTimeMatching(instruction.triggerTime)
                      ? "bg-primary/20 border-primary/50"
                      : "bg-muted/10 hover:bg-muted/20"
                  }`}
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
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      dispatch(seekToTime(instruction.triggerTime))
                    }
                  >
                    <Play size={16} />
                  </Button>
                  {isOwner && (
                    <InstructionDropdownMenu
                      instruction={instruction}
                      timelineId={timelineId!}
                      instructions={instructions}
                      currentTimelineId={currentTimeline!.id}
                    />
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
