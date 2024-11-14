import React from "react";
import { useSelector } from "react-redux";
import { selectSelectedElement } from "@/store/timelineSlice";
import TimeRangeInputs from "@/components/TimeRangeInputs";
import ElementColorPicker from "@/components/ElementColorPicker";
import DeleteElementButton from "@/components/DeleteElementButton";

const TimelineProperties: React.FC = () => {
  const selectedElement = useSelector(selectSelectedElement);

  if (!selectedElement) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Select an element to edit its properties
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TimeRangeInputs />
      <ElementColorPicker />
      <div className="pt-4 border-t border-border">
        <DeleteElementButton className="w-full" />
      </div>
    </div>
  );
};

export default TimelineProperties;
