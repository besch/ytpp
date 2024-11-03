import React, { useEffect } from "react";
import { Circle, Square, Type } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedElementId } from "@/store/timelineSlice";
import Button from "@/components/ui/Button";
import ElementColorPicker from "@/components/ElementColorPicker";
import VideoTimeDisplay from "@/components/VideoTimeDisplay";
import TimeRangeInputs from "@/components/TimeRangeInputs";
import { RootState } from "@/store";
import { useCanvasEvents } from "@/hooks/useCanvasEvents";

const EditPage: React.FC = () => {
  useCanvasEvents();
  const { selectedElementId, elements } = useSelector(
    (state: RootState) => state.timeline
  );

  const addElement = (elementType: string) => {
    window.dispatchEvent(
      new CustomEvent("ADD_ELEMENT", {
        detail: { elementType },
      })
    );
  };

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
      <h2 className="text-lg font-semibold text-foreground">Add Elements</h2>
      <div className="flex gap-2">
        <Button
          onClick={() => addElement("rectangle")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Square size={18} />
          Rectangle
        </Button>
        <Button
          onClick={() => addElement("circle")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Circle size={18} />
          Circle
        </Button>
        <Button
          onClick={() => addElement("text")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Type size={18} />
          Text
        </Button>
      </div>
      <Button onClick={saveElements} className="mt-2">
        Save Elements
      </Button>
    </div>
  );
};

export default EditPage;
