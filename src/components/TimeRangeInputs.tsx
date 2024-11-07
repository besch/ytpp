import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectSelectedElement, updateElement } from "@/store/timelineSlice";
import { TimeInput } from "@/components/ui/TimeInput";

const TimeRangeInputs: React.FC = () => {
  const dispatch = useDispatch();
  const selectedElement = useSelector(selectSelectedElement);

  if (!selectedElement) return null;

  const handleFromChange = (value: number) => {
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

  const handleToChange = (value: number) => {
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
      <div className="d-flex">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Start Time</label>
          <TimeInput
            value={selectedElement.timeRange.from}
            onChange={handleFromChange}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">End Time</label>
          <TimeInput
            value={selectedElement.timeRange.to}
            onChange={handleToChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default TimeRangeInputs;
