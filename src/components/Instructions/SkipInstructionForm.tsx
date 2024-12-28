import React, { useEffect } from "react";
import { TimeInput } from "../ui/TimeInput";
import { useFormContext } from "react-hook-form";
import { useVideoManager } from "@/hooks/useVideoManager";
import { parseTimeInput } from "@/lib/time";
import config from "@/lib/config";

interface SkipInstructionFormProps {
  onTimeChange: (time: number) => void;
}

const SkipInstructionForm: React.FC<SkipInstructionFormProps> = ({
  onTimeChange,
}) => {
  const { watch, setValue } = useFormContext();
  const videoManager = useVideoManager();

  // Calculate the current skipToTime value
  const skipToTime = parseTimeInput({
    hours: watch("skipToHours") || 0,
    minutes: watch("skipToMinutes") || 0,
    seconds: watch("skipToSeconds") || 0,
    milliseconds: watch("skipToMilliseconds") || 0,
  });

  // Handle time changes
  const handleTimeChange = (time: number) => {
    onTimeChange(time);
    // Update the timeline position to preview the skip location
    if (videoManager) {
      videoManager.seekTo(time);
    }
  };

  // Set initial skip time when the form is first rendered
  useEffect(() => {
    if (skipToTime === 0) {
      const triggerTime = parseTimeInput({
        hours: watch("hours") || 0,
        minutes: watch("minutes") || 0,
        seconds: watch("seconds") || 0,
        milliseconds: watch("milliseconds") || 0,
      });

      const newSkipTime = triggerTime + config.defaultSkipDuration;
      const totalSeconds = Math.floor(newSkipTime / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      const milliseconds = newSkipTime % 1000;

      setValue("skipToHours", hours);
      setValue("skipToMinutes", minutes);
      setValue("skipToSeconds", seconds);
      setValue("skipToMilliseconds", milliseconds);
    }
  }, []);

  return (
    <div className="space-y-2">
      <label className="text-sm text-muted-foreground">Skip to Time</label>
      <TimeInput value={skipToTime} onChange={handleTimeChange} />
    </div>
  );
};

export default SkipInstructionForm;
