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
  setInstructions,
} from "@/store/timelineSlice";
import { selectIsTimelineOwner } from "@/store/authSlice";
import type { Instruction, SkipInstruction, OverlayInstruction } from "@/types";
import { formatTime } from "@/lib/time";
import InstructionTypeSelect from "./InstructionTypeSelect";
import TimelineDropdownMenu from "./TimelineDropdownMenu";
import { RootState } from "@/store";
import { useNavigate, useParams } from "react-router-dom";
import InstructionDropdownMenu from "./InstructionDropdownMenu";
import { useAPI } from "@/hooks/useAPI";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const InstructionsList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: timelineId } = useParams();
  const currentTimeline = useSelector(selectCurrentTimeline);
  const editingInstruction = useSelector(selectEditingInstruction);
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const isOwner = useSelector((state: RootState) =>
    selectIsTimelineOwner(state, currentTimeline)
  );
  const currentTime = useSelector(selectCurrentTime);
  const api = useAPI();

  // Use React Query for fetching instructions
  const { data: instructions = [], isLoading } = useQuery({
    queryKey: ["instructions", timelineId],
    queryFn: async () => {
      if (!timelineId) return [];
      const responses = await api.instructions.getAll(timelineId);
      const transformedInstructions = responses.map((response) => ({
        ...response.data,
        id: response.id,
        triggerTime: response.trigger_time,
      })) as Instruction[];

      // Always update Redux store with the latest instructions
      dispatch(setInstructions(transformedInstructions));
      return transformedInstructions;
    },
    staleTime: 0, // Always consider data stale to ensure fresh data on timeline switch
    enabled: !!timelineId, // Only need timelineId to be present
  });

  // Effect to ensure instructions are updated in Redux when timeline changes
  useEffect(() => {
    if (instructions && instructions.length > 0) {
      dispatch(setInstructions(instructions));
    }
  }, [currentTimeline?.id, instructions, dispatch]);

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
      ) : Array.isArray(instructions) && instructions.length > 0 ? (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {instructions
            .filter((instruction) => instruction && instruction.type) // Add filter to ensure valid instructions
            .sort((a, b) => a.triggerTime - b.triggerTime)
            .map((instruction) => (
              <div
                key={instruction.id}
                className={`p-3 border border-border rounded-lg flex items-center justify-between transition-all duration-200 cursor-pointer
                  ${
                    isTimeMatching(instruction.triggerTime)
                      ? "bg-primary/20 border-primary/50"
                      : "bg-muted/10 hover:bg-muted/20"
                  }`}
                onClick={() => dispatch(seekToTime(instruction.triggerTime))}
              >
                <div>
                  <p className="text-lg font-medium capitalize">
                    {instruction.name || `${instruction.type} Instruction`}
                  </p>
                  <p className="text-sm text-muted-foreground ml-2">
                    at {formatTime(instruction.triggerTime)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getInstructionDescription(instruction)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {isOwner && (
                    <InstructionDropdownMenu
                      instruction={instruction}
                      timelineId={Number(timelineId!)}
                      instructions={instructions}
                      currentTimelineId={currentTimeline!.id}
                      timeline={currentTimeline!}
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
