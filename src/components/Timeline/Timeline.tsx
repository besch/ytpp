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
          className="absolute top-0 h-full"
          style={{
            left: `${groupPosition}%`,
          }}
        >
          {instructionGroup.map((instruction, index) => {
            const isPause = instruction.type === "pause";
            const pauseDuration = isPause
              ? (instruction as PauseInstruction).pauseDuration * 1000
              : 0;
            const pauseWidth = isPause ? (pauseDuration / duration) * 100 : 0;

            return (
              <div
                key={instruction.id}
                className="absolute"
                style={{
                  top: `${25 + index * 20}%`,
                  width:
                    instruction.type === "skip"
                      ? `${
                          ((((instruction as SkipInstruction).skipToTime -
                            instruction.triggerTime) /
                            duration) *
                            100 *
                            (timelineRef.current?.clientWidth ?? 0)) /
                          100
                        }px`
                      : "auto",
                  left: instruction.type === "skip" ? 0 : "50%",
                }}
              >
                {isPause && (
                  <div
                    className="absolute h-2 bg-secondary/20 rounded-full"
                    style={{
                      width: `${pauseWidth}%`,
                      left: 0,
                    }}
                  />
                )}
                {instruction.type === "skip" && (
                  <div
                    className="absolute h-2 bg-primary/20 rounded-full"
                    style={{
                      width: "100%",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                    }}
                  />
                )}
                <div
                  className={`relative group ${
                    instruction.type === "skip" ? "" : "-translate-x-1/2"
                  }
                    ${
                      currentTime === instruction.triggerTime ? "scale-110" : ""
                    }
                    transition-all duration-200`}
                  onClick={(e) => handleInstructionClick(e, instruction)}
                >
                  <div
                    className={`w-4 h-4 rounded-full cursor-pointer
                      border-2 border-background shadow-md
                      transition-all duration-200
                      ${
                        instruction.type === "pause"
                          ? "bg-secondary hover:bg-secondary/80"
                          : "bg-primary hover:bg-primary/80"
                      }
                      ${
                        currentTime === instruction.triggerTime
                          ? "ring-2 ring-offset-2 ring-offset-background ring-primary"
                          : ""
                      }
                    `}
                  />
                  <div
                    className="absolute opacity-0 group-hover:opacity-100
                      bottom-full mb-2 left-1/2 -translate-x-1/2
                      bg-background/95 backdrop-blur-sm
                      border border-border px-3 py-2
                      rounded-lg shadow-xl
                      whitespace-nowrap text-xs
                      transition-all duration-200
                      z-50"
                  >
                    <div className="font-medium mb-1">
                      {instruction.type === "pause" ? "Pause" : "Skip"}
                    </div>
                    <div className="text-muted-foreground">
                      {getInstructionLabel(instruction)}
                    </div>
                    <div
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2
                      w-2 h-2 bg-background border-b border-r border-border
                      rotate-45"
                    />
                  </div>
                </div>
              </div>
            );
          })}
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
        className="relative h-32 bg-muted/5 rounded-md cursor-pointer mx-4 mb-4"
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
            bg-primary px-2 py-1 rounded text-xs text-white
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
