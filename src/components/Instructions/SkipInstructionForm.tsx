import React from "react";
import { TimeInput } from "../ui/TimeInput";
import { useFormContext } from "react-hook-form";

interface SkipInstructionFormProps {
  onTimeChange: (time: number) => void;
}

const SkipInstructionForm: React.FC<SkipInstructionFormProps> = ({
  onTimeChange,
}) => {
  const { watch } = useFormContext();

  const parseTimeInput = (data: any) => {
    return (
      (Number(data.hours) * 3600 +
        Number(data.minutes) * 60 +
        Number(data.seconds)) *
      1000
    );
  };

  return (
    <div className="space-y-2">
      <label className="text-sm text-muted-foreground">Skip to Time</label>
      <TimeInput
        value={parseTimeInput({
          hours: watch("skipToHours") || 0,
          minutes: watch("skipToMinutes") || 0,
          seconds: watch("skipToSeconds") || 0,
        })}
        onChange={onTimeChange}
      />
    </div>
  );
};

export default SkipInstructionForm;
