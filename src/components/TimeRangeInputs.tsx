import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectSelectedElement, updateElement } from "@/store/timelineSlice";

const TimeRangeInputs: React.FC = () => {
  const dispatch = useDispatch();
  const selectedElement = useSelector(selectSelectedElement);

  if (!selectedElement) return null;

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    dispatch(
      updateElement({
        id: selectedElement.id,
        timeRange: { from: value, to: selectedElement.timeRange.to },
      })
    );
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    dispatch(
      updateElement({
        id: selectedElement.id,
        timeRange: { from: selectedElement.timeRange.from, to: value },
      })
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted-foreground">From (ms):</label>
        <input
          type="number"
          value={selectedElement.timeRange.from}
          onChange={handleFromChange}
          className="px-3 py-2 border border-border rounded bg-background text-foreground"
          min="0"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted-foreground">To (ms):</label>
        <input
          type="number"
          value={selectedElement.timeRange.to}
          onChange={handleToChange}
          className="px-3 py-2 border border-border rounded bg-background text-foreground"
          min="0"
        />
      </div>
    </div>
  );
};

export default TimeRangeInputs;
