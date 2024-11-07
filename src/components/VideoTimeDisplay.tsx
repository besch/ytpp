import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentTime, setCurrentTime } from "@/store/timelineSlice";
import { addCustomEventListener } from "@/lib/eventSystem";

const VideoTimeDisplay: React.FC = () => {
  const dispatch = useDispatch();
  const currentTime = useSelector(selectCurrentTime);

  const formatTime = (timeMs: number): string => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number): string => num.toString().padStart(2, "0");

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  useEffect(() => {
    const cleanup = addCustomEventListener(
      "VIDEO_TIME_UPDATE",
      ({ currentTimeMs }) => {
        dispatch(setCurrentTime(currentTimeMs));
      }
    );

    const initialTime =
      (window as any).videoManager?.getCurrentVideoTimeMs() || 0;
    dispatch(setCurrentTime(initialTime));

    return cleanup;
  }, [dispatch]);

  return (
    <div className="mb-4 p-3 bg-muted/10 border border-border rounded-lg">
      <p className="text-muted-foreground">
        Current Time:{" "}
        <span className="font-mono font-medium text-foreground">
          {formatTime(currentTime)}
        </span>
        <span className="text-xs text-muted-foreground ml-2">
          ({Math.round(currentTime)}ms)
        </span>
      </p>
    </div>
  );
};

export default VideoTimeDisplay;
