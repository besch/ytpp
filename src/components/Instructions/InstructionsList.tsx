import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  setEditingInstruction,
  selectCurrentTimeline,
  selectEditingInstruction,
  seekToTime,
  selectCurrentTime,
  setInstructions,
  selectInstructions,
} from "@/store/timelineSlice";
import { selectIsTimelineOwner } from "@/store/authSlice";
import type { InstructionResponse } from "@/types";
import { formatTime } from "@/lib/time";
import InstructionTypeSelect from "./InstructionTypeSelect";
import TimelineDropdownMenu from "./TimelineDropdownMenu";
import { RootState } from "@/store";
import { useNavigate } from "react-router-dom";
import InstructionDropdownMenu from "./InstructionDropdownMenu";
import { useAPI } from "@/hooks/useAPI";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const InstructionsList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const timeline = useSelector(selectCurrentTimeline);
  const timelineId = timeline?.id;
  const editingInstruction = useSelector(selectEditingInstruction);
  const instructions = useSelector(
    (state: RootState) => state.timeline.instructions
  );
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const isOwner = useSelector(
    (state: RootState) => state.timeline.currentTimeline?.isOwner
  );
  const currentTime = useSelector(selectCurrentTime);
  const api = useAPI();

  // Use React Query for fetching instructions
  const { data: instructionsData = [], isLoading } = useQuery({
    queryKey: ["instructions", timelineId],
    queryFn: async () => {
      if (typeof timelineId === "number") {
        return api.instructions.getAll(timelineId.toString());
      }
      return [];
    },
    enabled: !!timelineId,
  });

  useEffect(() => {
    console.log("instructionsData", instructionsData);
    if (instructionsData.length > 0) {
      dispatch(setInstructions(instructionsData));
    }
  }, [instructionsData, dispatch]);

  useEffect(() => {
    if (editingInstruction) {
      setShowTypeSelect(false);
    }
  }, [editingInstruction]);

  const handleAddNew = () => {
    setShowTypeSelect(true);
  };

  const handleTypeSelect = (type: string) => {
    if (!timelineId) return;
    dispatch(setEditingInstruction({ data: { type } } as InstructionResponse));
    setShowTypeSelect(false);
    navigate(`/timeline/${timelineId}/instruction`);
  };

  const getInstructionDescription = (
    instruction: InstructionResponse
  ): string => {
    if (instruction.data.type === "skip" && instruction.data.skipToTime) {
      return `Skips to ${formatTime(instruction.data.skipToTime)}`;
    } else if (instruction.data.type === "overlay") {
      const overlayMedia = instruction.data.overlayMedia;
      let description = `Displays ${overlayMedia?.name || "overlay media"}`;
      return description;
    }
    return "";
  };

  const isTimeMatching = (triggerTime: number | undefined): boolean => {
    if (typeof triggerTime !== "number") return false;
    const tolerance = 100;
    return Math.abs(triggerTime - currentTime) < tolerance;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">{timeline?.title}</h1>
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
                  {timeline && <TimelineDropdownMenu isOwner={isOwner} />}
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
            .filter((instruction) => instruction && instruction.data.type)
            .sort((a, b) => a.data.triggerTime - b.data.triggerTime)
            .map((instruction) => (
              <div
                key={instruction.id}
                className={`p-3 border border-border rounded-lg flex items-center justify-between transition-all duration-200 cursor-pointer
                  ${
                    isTimeMatching(instruction.data.triggerTime)
                      ? "bg-primary/20 border-primary/50"
                      : "bg-muted/10 hover:bg-muted/20"
                  }`}
                onClick={() =>
                  dispatch(seekToTime(instruction.data.triggerTime))
                }
                onDoubleClick={() => {
                  if (!timelineId) return;
                  dispatch(setEditingInstruction(instruction));
                  navigate(`/timeline/${timelineId}/instruction`);
                }}
              >
                <div>
                  <p className="text-lg font-medium capitalize">
                    {instruction.data.name ||
                      `${instruction.data.type} Instruction`}
                  </p>
                  <p className="text-sm text-muted-foreground ml-2">
                    at {formatTime(instruction.data.triggerTime)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getInstructionDescription(instruction)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {isOwner && (
                    <InstructionDropdownMenu
                      instruction={
                        instruction as unknown as InstructionResponse
                      }
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
