import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectSelectedElement,
  selectCurrentTimeline,
  updateElement,
  setCurrentTimeline,
} from "@/store/timelineSlice";
import { TimeInput } from "@/components/ui/TimeInput";
import DeleteElementButton from "./DeleteElementButton";
import { dispatchCustomEvent } from "@/lib/eventSystem";
import { api } from "@/lib/api";

const TimeRangeInputs: React.FC = () => {
  const dispatch = useDispatch();
  const currentTimeline = useSelector(selectCurrentTimeline);
  const selectedElement = useSelector(selectSelectedElement);

  if (!selectedElement) return null;

  const handleFromChange = async (value: number) => {
    if (!currentTimeline?.id || !selectedElement) return;

    const updatedElement = {
      ...selectedElement,
      timeRange: {
        ...selectedElement.timeRange,
        from: value,
      },
    };

    const updatedTimeline = {
      ...currentTimeline,
      elements: currentTimeline.elements.map((el) =>
        el.id === selectedElement.id ? updatedElement : el
      ),
    };

    try {
      const savedTimeline = await api.timelines.update(
        currentTimeline.id,
        updatedTimeline
      );
      dispatch(setCurrentTimeline(savedTimeline));
      dispatchCustomEvent("SET_TIMELINE", { timeline: savedTimeline });
    } catch (error) {
      console.error("Failed to update timeline:", error);
    }
  };

  const handleToChange = async (value: number) => {
    if (!currentTimeline?.id || !selectedElement) return;

    const updatedElement = {
      ...selectedElement,
      timeRange: {
        ...selectedElement.timeRange,
        to: value,
      },
    };

    const updatedTimeline = {
      ...currentTimeline,
      elements: currentTimeline.elements.map((el) =>
        el.id === selectedElement.id ? updatedElement : el
      ),
    };

    try {
      const savedTimeline = await api.timelines.update(
        currentTimeline.id,
        updatedTimeline
      );
      dispatch(setCurrentTimeline(savedTimeline));
      dispatchCustomEvent("SET_TIMELINE", { timeline: savedTimeline });
    } catch (error) {
      console.error("Failed to update timeline:", error);
    }
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
