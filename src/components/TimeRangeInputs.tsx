import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectTimeRange, setTimeRange } from "@/store/timelineSlice";

const TimeRangeInputs: React.FC = () => {
  const dispatch = useDispatch();
  const { from, to } = useSelector(selectTimeRange);

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    dispatch(setTimeRange({ from: value, to }));
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    dispatch(setTimeRange({ from, to: value }));
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
