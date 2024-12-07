import React from "react";
import { TimeInput } from "../ui/TimeInput";
import { useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import { seekToTime } from "@/store/timelineSlice";

interface SkipInstructionFormProps {
  onTimeChange: (time: number) => void;
}

const SkipInstructionForm: React.FC<SkipInstructionFormProps> = ({
  onTimeChange,
}) => {
  const { watch } = useFormContext();
  const dispatch = useDispatch();

  const parseTimeInput = (data: any) => {
    return (
      (Number(data.hours) * 3600 +
        Number(data.minutes) * 60 +
        Number(data.seconds)) *
        1000 +
      Number(data.milliseconds || 0)
    );
  };

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
    dispatch(seekToTime(time));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm text-muted-foreground">Skip to Time</label>
      <TimeInput value={skipToTime} onChange={handleTimeChange} />
    </div>
  );
};

export default SkipInstructionForm;
