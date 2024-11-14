import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectSelectedElement,
  selectCurrentTimeline,
  updateElement,
} from "@/store/timelineSlice";
import { TimeInput } from "@/components/ui/TimeInput";
import DeleteElementButton from "./DeleteElementButton";
import { dispatchCustomEvent } from "@/lib/eventSystem";

const TimeRangeInputs: React.FC = () => {
  const dispatch = useDispatch();
  const currentTimeline = useSelector(selectCurrentTimeline);
  const selectedElement = useSelector(selectSelectedElement);

  if (!selectedElement) return null;

  const handleFromChange = (value: number) => {
    if (!currentTimeline?.id || !selectedElement) return;

    dispatchCustomEvent("UPDATE_ELEMENT_TIME", {
      timelineId: currentTimeline.id,
      elementId: selectedElement.id,
      from: value,
      to: selectedElement.timeRange.to,
    });
  };

  const handleToChange = (value: number) => {
    if (!currentTimeline?.id || !selectedElement) return;

    dispatchCustomEvent("UPDATE_ELEMENT_TIME", {
      timelineId: currentTimeline.id,
      elementId: selectedElement.id,
      from: selectedElement.timeRange.from,
      to: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-foreground">Time Range</h3>
        <DeleteElementButton />
      </div>
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
