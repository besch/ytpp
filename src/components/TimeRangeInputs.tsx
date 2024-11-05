import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectSelectedElement, updateElement } from "@/store/timelineSlice";
import Input from "@/components/ui/Input";

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

    window.dispatchEvent(
      new CustomEvent("UPDATE_ELEMENT_TIME", {
        detail: {
          elementId: selectedElement.id,
          from: value,
          to: selectedElement.timeRange.to,
        },
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

    window.dispatchEvent(
      new CustomEvent("UPDATE_ELEMENT_TIME", {
        detail: {
          elementId: selectedElement.id,
          from: selectedElement.timeRange.from,
          to: value,
        },
      })
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Time Range</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Start Time (ms)
          </label>
          <Input
            type="number"
            value={selectedElement.timeRange.from}
            onChange={handleFromChange}
            min="0"
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">End Time (ms)</label>
          <Input
            type="number"
            value={selectedElement.timeRange.to}
            onChange={handleToChange}
            min="0"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default TimeRangeInputs;
