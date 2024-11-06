import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentTime,
  setActiveTab,
  setCurrentTime,
} from "@/store/timelineSlice";
import {
  selectInstructions,
  setSelectedInstructionId,
  setEditingInstruction,
} from "@/store/instructionsSlice";
import { Instruction, PauseInstruction, SkipInstruction } from "@/types";
import { RootState } from "@/store";

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
  if ("pauseDuration" in instruction) {
    return `Pause for ${(instruction as PauseInstruction).pauseDuration}s`;
  } else if ("skipToTime" in instruction) {
    return `Skip to ${formatTime((instruction as SkipInstruction).skipToTime)}`;
  }
  return "Unknown instruction";
};

const Timeline: React.FC = () => {
  const dispatch = useDispatch();
  const timelineRef = useRef<HTMLDivElement>(null);
  const currentTime = useSelector(selectCurrentTime);
  const instructions: Instruction[] = useSelector((state: RootState) =>
    selectInstructions(state)
  );
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    const videoElement = document.querySelector("video");
    if (videoElement) {
      setDuration(videoElement.duration * 1000);

      const initialTimeMs = videoElement.currentTime * 1000;
      dispatch(setCurrentTime(initialTimeMs));

      const handleLoadedMetadata = () => {
        setDuration(videoElement.duration * 1000);
        const currentTimeMs = videoElement.currentTime * 1000;
        dispatch(setCurrentTime(currentTimeMs));
      };

      const handleTimeUpdate = () => {
        const currentTimeMs = videoElement.currentTime * 1000;
        requestAnimationFrame(() => {
          dispatch(setCurrentTime(currentTimeMs));
        });
      };

      const handleDurationChange = () => {
        setDuration(videoElement.duration * 1000);
      };

      videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.addEventListener("timeupdate", handleTimeUpdate);
      videoElement.addEventListener("durationchange", handleDurationChange);

      return () => {
        videoElement.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
        videoElement.removeEventListener("timeupdate", handleTimeUpdate);
        videoElement.removeEventListener(
          "durationchange",
          handleDurationChange
        );
      };
    }
  }, [dispatch]);

  useEffect(() => {
    const handleManualTimeUpdate = () => {
      const videoElement = document.querySelector("video");
      if (videoElement) {
        dispatch(setCurrentTime(videoElement.currentTime * 1000));
      }
    };

    const interval = setInterval(handleManualTimeUpdate, 100);
    return () => clearInterval(interval);
  }, [dispatch]);

  const seekToTime = (timeMs: number) => {
    window.dispatchEvent(
      new CustomEvent<{ timeMs: number }>("SEEK_TO_TIME", {
        detail: { timeMs },
      })
    );
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
    // Navigate to Instructions tab and open the edit form
    dispatch(setActiveTab("instructions"));
    dispatch(setEditingInstruction(instruction));
  };

  const renderInstructionMarkers = () => {
    // Group instructions by triggerTime to handle overlapping instructions
    const groupedInstructions = instructions.reduce((acc, instruction) => {
      const key = instruction.triggerTime;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(instruction);
      return acc;
    }, {} as { [key: number]: Instruction[] });

    return Object.keys(groupedInstructions).map((timeKey) => {
      const triggerTime = Number(timeKey);
      const instructionGroup = groupedInstructions[triggerTime];
      const groupPosition = getTimelinePosition(triggerTime);

      return (
        <div
          key={timeKey}
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            left: `${groupPosition}%`,
          }}
        >
          {instructionGroup.map((instruction, index) => (
            <div
              key={instruction.id}
              className={`relative group -translate-x-1/2 w-4 h-4
                ${
                  currentTime === instruction.triggerTime
                    ? "bg-accent"
                    : "bg-secondary"
                }
                rounded-full cursor-pointer hover:scale-110 transition-all
                border-2 border-background shadow-md`}
              style={{
                transform: `translate(-50%, -${index * 20}px)`,
              }}
              onClick={(e) => handleInstructionClick(e, instruction)}
            >
              <div
                className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 left-1/2 -translate-x-1/2
                bg-background border border-border px-2 py-1 rounded shadow-lg whitespace-nowrap text-xs"
              >
                {getInstructionLabel(instruction)}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-background border-b border-r border-border rotate-45" />
              </div>
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <div className="bg-background border border-border rounded-lg">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-sm font-medium text-foreground">Timeline</h3>
        <div className="text-xs text-muted-foreground">Click to seek</div>
      </div>

      <div
        ref={timelineRef}
        className="relative h-24 bg-muted/10 rounded-md cursor-pointer mx-4 mb-4 overflow-hidden"
        onClick={handleTimelineClick}
      >
        {/* Time markers */}
        <div className="absolute top-0 left-0 right-0 h-6 flex justify-between px-2 text-xs text-muted-foreground">
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
            className="absolute h-full bg-primary/30"
            style={{ width: `${getTimelinePosition(currentTime)}%` }}
          />
        </div>

        {/* Current time marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-primary transition-all"
          style={{ left: `${getTimelinePosition(currentTime)}%` }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary px-2 py-1 rounded text-xs text-white">
            {(currentTime / 1000).toFixed(1)}s
          </div>
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full" />
        </div>

        {/* Instructions markers */}
        {renderInstructionMarkers()}
      </div>
    </div>
  );
};

export default Timeline;
