import React from "react";
import Button from "@/components/ui/Button";
import ElementColorPicker from "@/components/ElementColorPicker";
import VideoTimeDisplay from "@/components/VideoTimeDisplay";
import TimeRangeInputs from "@/components/TimeRangeInputs";
import { useCanvasEvents } from "@/hooks/useCanvasEvents";
import AddElements from "@/components/AddElements";
import DeleteElementButton from "@/components/DeleteElementButton";
import InstructionEditor from "@/components/Instructions/InstructionEditor";
import { useInstructionsEvents } from "@/hooks/useInstructionsEvents";

const EditPage: React.FC = () => {
  useCanvasEvents();
  useInstructionsEvents();

  const saveElements = () => {
    window.dispatchEvent(new CustomEvent("SAVE_ELEMENTS"));
  };

  return (
    <div className="flex flex-col gap-4 bg-background p-4 rounded-lg shadow-lg border border-foreground">
      <VideoTimeDisplay />
      <InstructionEditor />
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
