import React, { useState, useEffect } from "react";

const VideoTimeDisplay: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<number>(0);

  const formatTime = (timeMs: number): string => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number): string => num.toString().padStart(2, "0");

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  useEffect(() => {
    // Update time handler
    const handleTimeUpdate = (event: CustomEvent) => {
      setCurrentTime(event.detail.currentTimeMs);
    };

    // Add event listener
    window.addEventListener(
      "VIDEO_TIME_UPDATE",
      handleTimeUpdate as EventListener
    );

    // Initial time set
    const initialTime =
      (window as any).videoManager?.getCurrentVideoTimeMs() || 0;
    setCurrentTime(initialTime);

    // Cleanup
    return () => {
      window.removeEventListener(
        "VIDEO_TIME_UPDATE",
        handleTimeUpdate as EventListener
      );
    };
  }, []);

  return (
    <div className="mb-4 p-3 bg-muted/10 border border-border rounded-lg">
      <p className="text-sm text-muted-foreground">
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
