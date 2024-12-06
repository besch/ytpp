import React from "react";
import Input from "./Input";

interface TimeInputProps {
  value: number; // milliseconds
  onChange: (milliseconds: number) => void;
  className?: string;
  showLabels?: boolean;
}

export const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  className,
  showLabels = true,
}) => {
  // Convert milliseconds to hours, minutes, seconds, milliseconds
  const totalSeconds = Math.floor(value / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = value % 1000;

  const handleChange = (
    type: "hours" | "minutes" | "seconds" | "milliseconds",
    newValue: number
  ) => {
    let totalMs = value;
    const msInHour = 3600000;
    const msInMinute = 60000;
    const msInSecond = 1000;

    switch (type) {
      case "hours":
        totalMs =
          newValue * msInHour +
          minutes * msInMinute +
          seconds * msInSecond +
          milliseconds;
        break;
      case "minutes":
        totalMs =
          hours * msInHour +
          newValue * msInMinute +
          seconds * msInSecond +
          milliseconds;
        break;
      case "seconds":
        totalMs =
          hours * msInHour +
          minutes * msInMinute +
          newValue * msInSecond +
          milliseconds;
        break;
      case "milliseconds":
        totalMs =
          hours * msInHour +
          minutes * msInMinute +
          seconds * msInSecond +
          newValue;
        break;
    }

    onChange(totalMs);
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      <div className="flex flex-col w-[40px]">
        {showLabels && (
          <label className="text-xs text-muted-foreground mb-1">Hours</label>
        )}
        <Input
          type="number"
          placeholder="HH"
          value={hours}
          onChange={(e) => handleChange("hours", parseInt(e.target.value) || 0)}
          min={0}
        />
      </div>
      <div className="flex flex-col w-[40px]">
        {showLabels && (
          <label className="text-xs text-muted-foreground mb-1">Min</label>
        )}
        <Input
          type="number"
          placeholder="MM"
          value={minutes}
          onChange={(e) =>
            handleChange("minutes", parseInt(e.target.value) || 0)
          }
          min={0}
          max={59}
        />
      </div>
      <div className="flex flex-col w-[40px]">
        {showLabels && (
          <label className="text-xs text-muted-foreground mb-1">Sec</label>
        )}
        <Input
          type="number"
          placeholder="SS"
          value={seconds}
          onChange={(e) =>
            handleChange("seconds", parseInt(e.target.value) || 0)
          }
          min={0}
          max={59}
        />
      </div>
      <div className="flex flex-col w-[50px]">
        {showLabels && (
          <label className="text-xs text-muted-foreground mb-1">ms</label>
        )}
        <Input
          type="number"
          placeholder="MS"
          value={milliseconds}
          onChange={(e) =>
            handleChange("milliseconds", parseInt(e.target.value) || 0)
          }
          min={0}
          max={999}
          step={1}
        />
      </div>
    </div>
  );
};
