import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentTime,
  setActiveTab,
  setCurrentTime,
  selectInstructions,
  setSelectedInstructionId,
  setEditingInstruction,
  updateInstruction,
  selectCurrentTimeline,
  selectSelectedInstructionId,
} from "@/store/timelineSlice";
import {
  Instruction,
  PauseInstruction,
  SkipInstruction,
  OverlayInstruction,
  Timeline as ITimeline,
} from "@/types";
import { dispatchCustomEvent } from "@/lib/eventSystem";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
import { Move } from "lucide-react";

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
  if (instruction.type === "pause") {
    return `Pause for ${(instruction as PauseInstruction).pauseDuration}s`;
  } else if (instruction.type === "skip") {
    return `Skip to ${formatTime((instruction as SkipInstruction).skipToTime)}`;
  } else if (instruction.type === "overlay") {
    return `Overlay ${
      (instruction as OverlayInstruction).overlayMedia?.name || "media"
    }`;
  }
  return "Unknown instruction";
};

const Timeline: React.FC = () => {
  const dispatch = useDispatch();
  const timelineRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentTime = useSelector(selectCurrentTime);
  const instructions = useSelector(selectInstructions);
  const currentTimeline = useSelector(selectCurrentTimeline);
  const selectedInstructionId = useSelector(selectSelectedInstructionId);
  const [duration, setDuration] = useState<number>(0);
  const [draggingInstructionId, setDraggingInstructionId] = useState<
    string | null
  >(null);
  const [draggingTime, setDraggingTime] = useState<number | null>(null);
  const [draggingSkipEndId, setDraggingSkipEndId] = useState<string | null>(
    null
  );
  const [draggingSkipEndTime, setDraggingSkipEndTime] = useState<number | null>(
    null
  );

  useEffect(() => {
    videoRef.current = document.querySelector(
      "video:not(.timelines-video)"
    ) as HTMLVideoElement;

    if (videoRef.current) {
      setDuration(videoRef.current.duration * 1000);
      dispatch(setCurrentTime(videoRef.current.currentTime * 1000));

      const handleLoadedMetadata = () => {
        if (!videoRef.current) return;
        setDuration(videoRef.current.duration * 1000);
        dispatch(setCurrentTime(videoRef.current.currentTime * 1000));
      };

      const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const currentTimeMs = videoRef.current.currentTime * 1000;
        requestAnimationFrame(() => {
          dispatch(setCurrentTime(currentTimeMs));
        });
      };

      const handleDurationChange = () => {
        if (!videoRef.current) return;
        setDuration(videoRef.current.duration * 1000);
      };

      videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
      videoRef.current.addEventListener("timeupdate", handleTimeUpdate);
      videoRef.current.addEventListener("durationchange", handleDurationChange);

      return () => {
        if (!videoRef.current) return;
        videoRef.current.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
        videoRef.current.removeEventListener("timeupdate", handleTimeUpdate);
        videoRef.current.removeEventListener(
          "durationchange",
          handleDurationChange
        );
      };
    }
  }, [dispatch]);

  useEffect(() => {
    const handleManualTimeUpdate = () => {
      if (!videoRef.current) return;
      const newTime = videoRef.current.currentTime * 1000;
      if (Math.abs(newTime - currentTime) > 16) {
        dispatch(setCurrentTime(newTime));
      }
    };

    const interval = setInterval(handleManualTimeUpdate, 250);
    return () => clearInterval(interval);
  }, [dispatch, currentTime]);

  const seekToTime = (timeMs: number) => {
    dispatchCustomEvent("SEEK_TO_TIME", { timeMs });
    dispatch(setCurrentTime(timeMs));
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
    dispatch(setSelectedInstructionId(null));
    dispatch(setEditingInstruction(null));
  };

  const handleInstructionClick = (
    e: React.MouseEvent,
    instruction: Instruction
  ) => {
    e.stopPropagation();
    seekToTime(instruction.triggerTime);
    dispatch(setSelectedInstructionId(instruction.id));
    dispatch(setActiveTab("instructions"));
    dispatch(setEditingInstruction(instruction));
  };

  const handleInstructionDrag = (
    e: React.MouseEvent,
    instruction: Instruction
  ) => {
    e.stopPropagation();
    setDraggingInstructionId(instruction.id);
    setDraggingTime(instruction.triggerTime);

    const startX = e.clientX;
    const startTime = instruction.triggerTime;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const deltaX = moveEvent.clientX - startX;
      const timePerPixel = duration / rect.width;
      const timeDelta = deltaX * timePerPixel;

      const newTime = Math.max(0, Math.min(duration, startTime + timeDelta));
      setDraggingTime(newTime);

      // Update instruction with new time
      const updatedInstruction = {
        ...instruction,
        triggerTime: Math.round(newTime),
      };

      // Update both the instruction and editing instruction
      dispatch(updateInstruction(updatedInstruction));
      dispatch(setEditingInstruction(updatedInstruction));
    };

    const handleMouseUp = async () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      setDraggingInstructionId(null);
      setDraggingTime(null);

      if (currentTimeline && instructions) {
        const {
          id,
          title,
          video_url,
          elements,
          media_files,
          created_at,
          updated_at,
        } = currentTimeline;

        const updatedTimeline: ITimeline = {
          id,
          title,
          video_url,
          instructions,
          elements,
          media_files,
          created_at,
          updated_at,
        };

        dispatchCustomEvent("UPDATE_TIMELINE", { timeline: updatedTimeline });
        await api.timelines.update(id, updatedTimeline);
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
    setDraggingSkipEndId(instruction.id);
    setDraggingSkipEndTime(instruction.skipToTime);

    const startX = e.clientX;
    const startTime = instruction.skipToTime;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const deltaX = moveEvent.clientX - startX;
      const timePerPixel = duration / rect.width;
      const timeDelta = deltaX * timePerPixel;

      const newTime = Math.max(
        instruction.triggerTime,
        Math.min(duration, startTime + timeDelta)
      );
      setDraggingSkipEndTime(newTime);

      // Update instruction with new skipToTime
      const updatedInstruction = {
        ...instruction,
        skipToTime: Math.round(newTime),
      };

      dispatch(updateInstruction(updatedInstruction));
      dispatch(setEditingInstruction(updatedInstruction));
    };

    const handleMouseUp = async () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      setDraggingSkipEndId(null);
      setDraggingSkipEndTime(null);

      // Save to backend
      if (currentTimeline && instructions) {
        const updatedTimeline: ITimeline = {
          ...currentTimeline,
          instructions,
        };

        dispatchCustomEvent("UPDATE_TIMELINE", { timeline: updatedTimeline });
        await api.timelines.update(currentTimeline.id, updatedTimeline);
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

      // Add start marker
      markers.push({
        id: instruction.id,
        position,
        instruction,
        isEndMarker: false,
      });

      // Add end marker for skip instructions
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

    // Group markers by position
    const groupedMarkers = markers.reduce((acc, marker) => {
      const key = marker.position;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(marker);
      return acc;
    }, {} as { [key: number]: typeof markers });

    return (
      <>
        {skipRanges}
        {Object.entries(groupedMarkers).map(([position, markerGroup]) => (
          <div
            key={position}
            className="absolute top-0 h-full"
            style={{
              left: `${position}%`,
            }}
          >
            {markerGroup.map((marker, index) => {
              const instruction = marker.instruction;
              const isEndMarker = marker.isEndMarker;
              const isSelected = instruction.id === selectedInstructionId;

              return (
                <div
                  key={marker.id}
                  className="absolute"
                  style={{
                    top: `${25 + index * 20}%`,
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
                        draggingInstructionId === instruction.id
                          ? "visible"
                          : ""
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
              );
            })}
          </div>
        ))}
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
        <div className="flex gap-2 items-center">
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
