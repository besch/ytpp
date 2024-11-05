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
    <div className="flex flex-col gap-6 bg-background p-6 rounded-lg shadow-lg border border-border">
      <div className="space-y-6">
        {/* Video Time Section */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Video Time
          </h2>
          <VideoTimeDisplay />
        </section>

        {/* Element Controls Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Element Controls
          </h2>
          <div className="grid grid-cols-1 gap-4 p-4 bg-muted/5 rounded-lg border border-border">
            <TimeRangeInputs />
            <ElementColorPicker />
            <AddElements />
          </div>
        </section>

        {/* Instructions Section */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Instructions
          </h2>
          <InstructionEditor />
        </section>

        {/* Actions Section */}
        <section className="flex justify-between items-center pt-4 border-t border-border">
          <DeleteElementButton />
          <Button onClick={saveElements} size="lg" className="px-8">
            Save All Changes
          </Button>
        </section>
      </div>
    </div>
  );
};

export default EditPage;
