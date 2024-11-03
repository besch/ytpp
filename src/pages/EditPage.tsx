import React from "react";
import { useSelector } from "react-redux";
import Button from "@/components/ui/Button";
import ElementColorPicker from "@/components/ElementColorPicker";
import VideoTimeDisplay from "@/components/VideoTimeDisplay";
import TimeRangeInputs from "@/components/TimeRangeInputs";
import { RootState } from "@/store";
import { useCanvasEvents } from "@/hooks/useCanvasEvents";
import AddElements from "@/components/AddElements";
import DeleteElementButton from "@/components/DeleteElementButton";

const EditPage: React.FC = () => {
  useCanvasEvents();
  const { selectedElementId, elements } = useSelector(
    (state: RootState) => state.timeline
  );

  const saveElements = () => {
    window.dispatchEvent(new CustomEvent("SAVE_ELEMENTS"));
  };

  return (
    <div className="flex flex-col gap-4 bg-background p-4 rounded-lg shadow-lg">
      <div className="text-sm text-muted-foreground">
        Selected: {selectedElementId || "None"}
        <p>{elements.length}</p>
      </div>
      <VideoTimeDisplay />
      <TimeRangeInputs />
      <ElementColorPicker />
      <AddElements />
      <div className="flex justify-between items-center mt-2">
        <DeleteElementButton />
        <Button onClick={saveElements} className="mt-2">
          Save Elements
        </Button>
      </div>
    </div>
  );
};

export default EditPage;
