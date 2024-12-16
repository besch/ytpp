import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentTime,
  setCurrentTime,
  selectInstructions,
  setSelectedInstructionId,
  setEditingInstruction,
  updateInstruction,
  selectCurrentTimeline,
  selectSelectedInstructionId,
  setCurrentTimeline,
} from "@/store/timelineSlice";
import { Instruction, SkipInstruction, OverlayInstruction } from "@/types";
import { useAPI } from "@/hooks/useAPI";
import Button from "@/components/ui/Button";
import { Move } from "lucide-react";
import { useVideoManager } from "@/hooks/useVideoManager";
import { toast } from "react-toastify";

const formatTime = (timeMs: number): string => {
  const totalSeconds = Math.floor(timeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (num: number) => num.toString().padStart(2, "0");
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

const getInstructionLabel = (instruction: Instruction): string => {
  if (instruction.type === "skip") {
    return `Skip to ${formatTime((instruction as SkipInstruction).skipToTime)}`;
  } else if (instruction.type === "overlay") {
    const overlayInstruction = instruction as OverlayInstruction;
    return `Overlay ${overlayInstruction.overlayMedia?.name || "media"}`;
  }
  return "Unknown instruction";
};

const MARKER_SPACING = 2; // Minimum spacing in percentage points

const calculateMarkerLevels = (
  markers: Array<{
    id: string;
    position: number;
    instruction: Instruction;
    isEndMarker: boolean;
  }>
): Array<{ marker: (typeof markers)[0]; level: number }> => {
  // Sort markers by position
  const sortedMarkers = [...markers].sort((a, b) => a.position - b.position);
  const markersWithLevels: Array<{
    marker: (typeof markers)[0];
    level: number;
  }> = [];

  for (const marker of sortedMarkers) {
    let level = 0;
    let positionTaken = true;

    while (positionTaken) {
      positionTaken = markersWithLevels.some(
        ({ marker: existingMarker, level: existingLevel }) =>
          level === existingLevel &&
          Math.abs(existingMarker.position - marker.position) < MARKER_SPACING
      );
      if (positionTaken) level++;
    }

    markersWithLevels.push({ marker, level });
  }

  return markersWithLevels;
};

const Timeline: React.FC = () => {
  const dispatch = useDispatch();
  const timelineRef = useRef<HTMLDivElement>(null);
  const videoManager = useVideoManager();
  const currentTime = useSelector(selectCurrentTime);
  const instructions = useSelector(selectInstructions);
  const currentTimeline = useSelector(selectCurrentTimeline);
  const selectedInstructionId = useSelector(selectSelectedInstructionId);
  const [duration, setDuration] = useState<number>(0);
  const [draggingInstructionId, setDraggingInstructionId] = useState<
    string | null
  >(null);
  const [draggingTime, setDraggingTime] = useState<number | null>(null);
  const api = useAPI();

  useEffect(() => {
    if (videoManager) {
      setDuration(videoManager.getDuration());
      dispatch(setCurrentTime(videoManager.getCurrentTime()));
    }
  }, [videoManager, dispatch]);

  const seekToTime = (timeMs: number) => {
    if (videoManager) {
      videoManager.seekTo(timeMs);
    }
  };

  const getTimelinePosition = (time: number): number => {
    if (duration === 0) return 0;
    return (time / duration) * 100;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    const clickedTime = (percentage / 100) * duration;

    seekToTime(clickedTime);

    // Dispatch actions to trigger navigation
    dispatch(setSelectedInstructionId(null));
    dispatch(setEditingInstruction(null));
  };

  const handleInstructionClick = (
    e: React.MouseEvent,
    instruction: Instruction
  ) => {
    e.stopPropagation();
    seekToTime(instruction.triggerTime);
    dispatch(setSelectedInstructionId(null));
    dispatch(setEditingInstruction(null));
  };

  const handleSaveInstructions = async (updatedInstructions: Instruction[]) => {
    if (!currentTimeline) return;

    try {
      const updatedTimeline = {
        ...currentTimeline,
        instructions: updatedInstructions,
      };

      const savedTimeline = await api.timelines.update(
        currentTimeline.id,
        updatedTimeline
      );
      dispatch(setCurrentTimeline(savedTimeline));
      toast.success("Timeline updated successfully");
    } catch (error) {
      console.error("Failed to save instructions:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save instructions"
      );
    }
  };

  const handleInstructionDrag = (
    e: React.MouseEvent,
    instruction: Instruction
  ) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startTime = instruction.triggerTime;
    let isDragging = false;
    const dragThreshold = 3; // pixels
    let updatedInstruction: Instruction | null = null;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);

      if (!isDragging && (deltaX > dragThreshold || deltaY > dragThreshold)) {
        isDragging = true;
        setDraggingInstructionId(instruction.id);
        setDraggingTime(instruction.triggerTime);
      }

      if (isDragging) {
        const rect = timelineRef.current?.getBoundingClientRect();
        if (!rect) return;

        const deltaX = moveEvent.clientX - startX;
        const timePerPixel = duration / rect.width;
        const timeDelta = deltaX * timePerPixel;

        const newTime = Math.max(0, Math.min(duration, startTime + timeDelta));
        setDraggingTime(newTime);

        updatedInstruction = {
          ...instruction,
          triggerTime: Math.round(newTime),
        };
        dispatch(updateInstruction(updatedInstruction));
        dispatch(setEditingInstruction(updatedInstruction));
      }
    };

    const handleMouseUp = async () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      if (isDragging && updatedInstruction) {
        setDraggingInstructionId(null);
        setDraggingTime(null);

        if (currentTimeline) {
          const updatedInstructions = instructions.map((i) =>
            i.id === updatedInstruction!.id ? updatedInstruction! : i
          );
          await handleSaveInstructions(updatedInstructions);
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleSkipEndDrag = (
    e: React.MouseEvent,
    instruction: SkipInstruction
  ) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startTime = instruction.skipToTime;
    let isDragging = false;
    const dragThreshold = 3; // pixels
    let updatedInstruction: SkipInstruction | null = null;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);

      if (!isDragging && (deltaX > dragThreshold || deltaY > dragThreshold)) {
        isDragging = true;
      }

      if (isDragging) {
        const rect = timelineRef.current?.getBoundingClientRect();
        if (!rect) return;

        const deltaX = moveEvent.clientX - startX;
        const timePerPixel = duration / rect.width;
        const timeDelta = deltaX * timePerPixel;

        const newTime = Math.max(
          instruction.triggerTime,
          Math.min(duration, startTime + timeDelta)
        );

        updatedInstruction = {
          ...instruction,
          skipToTime: Math.round(newTime),
        };
        dispatch(updateInstruction(updatedInstruction));
        dispatch(setEditingInstruction(updatedInstruction));
      }
    };

    const handleMouseUp = async () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      if (isDragging && updatedInstruction && currentTimeline) {
        const updatedInstructions = instructions.map((i) =>
          i.id === updatedInstruction!.id ? updatedInstruction! : i
        );
        await handleSaveInstructions(updatedInstructions);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const renderInstructionMarkers = () => {
    // First render skip ranges
    const skipRanges = instructions
      .filter(
        (instruction): instruction is SkipInstruction =>
          instruction.type === "skip"
      )
      .map((skipInstruction) => {
        const startPosition = getTimelinePosition(skipInstruction.triggerTime);
        const endPosition = getTimelinePosition(skipInstruction.skipToTime);

        return (
          <div
            key={`skip-range-${skipInstruction.id}`}
            className="absolute top-0 h-full"
            style={{
              left: `${startPosition}%`,
              width: `${endPosition - startPosition}%`,
              backgroundColor: "rgb(37 99 235 / 0.1)", // primary color with low opacity
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        );
      });

    // Then render instruction markers as before, but add end markers for skip instructions
    const markers = instructions.flatMap((instruction) => {
      const markers = [];
      const position = getTimelinePosition(instruction.triggerTime);

      markers.push({
        id: instruction.id,
        position,
        instruction,
        isEndMarker: false,
      });

      if (instruction.type === "skip") {
        const skipInstruction = instruction as SkipInstruction;
        markers.push({
          id: `${instruction.id}-end`,
          position: getTimelinePosition(skipInstruction.skipToTime),
          instruction: skipInstruction,
          isEndMarker: true,
        });
      }

      return markers;
    });

    const markersWithLevels = calculateMarkerLevels(markers);

    return (
      <>
        {skipRanges}
        {markersWithLevels.map(({ marker, level }) => {
          const instruction = marker.instruction;
          const isEndMarker = marker.isEndMarker;
          const isSelected = instruction.id === selectedInstructionId;

          return (
            <div
              key={marker.id}
              className="absolute top-0 h-full"
              style={{
                left: `${marker.position}%`,
              }}
            >
              <div
                className="absolute"
                style={{
                  top: `${20 + level * 15}%`, // Adjust vertical spacing based on level
                  transform: "translateX(-50%)",
                  zIndex: 20,
                }}
              >
                <div
                  className={`instruction-marker border-2 border-background shadow-md
                    ${isEndMarker ? "opacity-50" : ""}
                    ${
                      isSelected
                        ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-125"
                        : ""
                    }
                    transition-all duration-200 ease-out
                  `}
                  data-type={instruction.type}
                  data-selected={isSelected}
                  onMouseDown={(e) =>
                    isEndMarker
                      ? handleSkipEndDrag(e, instruction as SkipInstruction)
                      : handleInstructionDrag(e, instruction)
                  }
                  onClick={(e) => handleInstructionClick(e, instruction)}
                >
                  {currentTime ===
                    (isEndMarker
                      ? (instruction as SkipInstruction).skipToTime
                      : instruction.triggerTime) && (
                    <span className="absolute inset-0 rounded-full bg-primary/30 animate-ripple" />
                  )}
                </div>

                {!isEndMarker && (
                  <div
                    className={`instruction-popover ${
                      draggingInstructionId === instruction.id ? "visible" : ""
                    }
                      bg-background/95 backdrop-blur-sm
                      border border-border px-3 py-2
                      rounded-lg shadow-xl
                      text-xs`}
                  >
                    <div className="font-medium mb-1">
                      {instruction.type.charAt(0).toUpperCase() +
                        instruction.type.slice(1)}
                    </div>
                    <div className="text-muted-foreground">
                      {draggingInstructionId === instruction.id &&
                      draggingTime !== null
                        ? formatTime(draggingTime)
                        : getInstructionLabel(instruction)}
                    </div>
                    <div
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2
                      w-2 h-2 bg-background border-b border-r border-border
                      rotate-45"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  const handleDragStart = (e: React.MouseEvent) => {
    const container = document.getElementById("timeline-container");
    if (!container) return;

    const initialX = e.clientX - container.offsetLeft;
    const initialY = e.clientY - container.offsetTop;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const currentX = e.clientX - initialX;
      const currentY = e.clientY - initialY;
      container.style.left = `${currentX}px`;
      container.style.top = `${currentY}px`;
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="bg-background border border-border rounded-lg">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-sm font-medium text-foreground">Timeline</h3>
        <div className="flex gap-2 items-center mb-4">
          <Button
            variant="ghost"
            size="lg"
            onMouseDown={handleDragStart}
            title="Drag timeline"
          >
            <Move className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative h-32 bg-muted/5 rounded-md cursor-pointer mx-4 mb-4"
        onClick={handleTimelineClick}
      >
        {/* Time markers */}
        <div className="absolute top-0 left-0 right-0 h-6 flex justify-between px-2 text-sm text-muted-foreground">
          {[0, 25, 50, 75, 100].map((percent) => (
            <div key={percent} className="relative">
              {formatTime((duration * percent) / 100)}
              <div className="absolute top-6 w-px h-full bg-muted/20" />
            </div>
          ))}
        </div>

        {/* Timeline track */}
        <div className="absolute left-0 right-0 h-1 bg-muted/30 top-1/2 -translate-y-1/2">
          {/* Progress bar */}
          <div
            className="absolute h-full bg-primary/30 transition-all duration-200"
            style={{ width: `${getTimelinePosition(currentTime)}%` }}
          />
        </div>

        {/* Current time marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-primary transition-all duration-200"
          style={{ left: `${getTimelinePosition(currentTime)}%` }}
        >
          <div
            className="absolute -top-6 left-1/2 -translate-x-1/2 
            bg-primary px-2 py-1 rounded text-sm font-medium text-white
            shadow-lg"
          >
            {formatTime(currentTime)}
          </div>
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 
            w-3 h-3 bg-primary rounded-full shadow-lg"
          />
        </div>

        {/* Instructions markers */}
        {renderInstructionMarkers()}
      </div>
    </div>
  );
};

export default Timeline;
