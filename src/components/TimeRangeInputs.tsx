import React from "react";

interface TimeRangeInputsProps {
  from: number;
  to: number;
  onFromChange: (value: number) => void;
  onToChange: (value: number) => void;
}

const TimeRangeInputs: React.FC<TimeRangeInputsProps> = ({
  from,
  to,
  onFromChange,
  onToChange,
}) => {
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onFromChange(value);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onToChange(value);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted-foreground">From (ms):</label>
        <input
          type="number"
          value={from}
          onChange={handleFromChange}
          className="px-3 py-2 border border-border rounded bg-background text-foreground"
          min="0"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted-foreground">To (ms):</label>
        <input
          type="number"
          value={to}
          onChange={handleToChange}
          className="px-3 py-2 border border-border rounded bg-background text-foreground"
          min="0"
        />
      </div>
    </div>
  );
};

export default TimeRangeInputs;
