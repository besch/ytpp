import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentTime, setCurrentTime } from "@/store/timelineSlice";
import {
  selectInstructions,
  setSelectedInstructionId,
} from "@/store/instructionsSlice";
import { Instruction } from "@/types";

const Timeline: React.FC = () => {
  const dispatch = useDispatch();
  const timelineRef = useRef<HTMLDivElement>(null);
  const currentTime = useSelector(selectCurrentTime);
  const instructions = useSelector(selectInstructions);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    const videoElement = document.querySelector("video");
    if (videoElement) {
      setDuration(videoElement.duration * 1000);

      const initialTime =
        (window as any).videoManager?.getCurrentVideoTimeMs() ||
        videoElement.currentTime * 1000;
      dispatch(setCurrentTime(initialTime));

      const handleLoadedMetadata = () => {
        setDuration(videoElement.duration * 1000);
        const currentTimeMs = videoElement.currentTime * 1000;
        dispatch(setCurrentTime(currentTimeMs));
      };

      const handleDurationChange = () => {
        setDuration(videoElement.duration * 1000);
      };

      videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.addEventListener("durationchange", handleDurationChange);

      return () => {
        videoElement.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
        videoElement.removeEventListener(
          "durationchange",
          handleDurationChange
        );
      };
    }
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
    dispatch(setSelectedInstructionId(null)); // Clear selected instruction
  };

  const handleInstructionClick = (
    e: React.MouseEvent,
    instruction: Instruction
  ) => {
    e.stopPropagation();
    seekToTime(instruction.stopTime);
    dispatch(setSelectedInstructionId(instruction.id));
  };

  return (
    <div className="mt-4 p-4 bg-background border border-border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-foreground">Timeline</h3>
        <div className="text-xs text-muted-foreground">
          Click on timeline to set time
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative h-20 bg-muted/20 rounded-md cursor-pointer"
        onClick={handleTimelineClick}
      >
        {/* Timeline marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-primary transition-all"
          style={{ left: `${getTimelinePosition(currentTime)}%` }}
        />

        {/* Instructions markers */}
        {instructions.map((instruction) => (
          <div
            key={instruction.id}
            className="absolute top-0 h-full"
            style={{ left: `${getTimelinePosition(instruction.stopTime)}%` }}
          >
            <div
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 
                ${
                  currentTime === instruction.stopTime
                    ? "bg-accent"
                    : "bg-secondary"
                } 
                rounded-full cursor-pointer hover:scale-110 transition-transform`}
              onClick={(e) => handleInstructionClick(e, instruction)}
            >
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs">
                {instruction.pauseDuration}ms
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
