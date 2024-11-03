import React, { useEffect } from "react";
import { Circle, Square, Type } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedElementId } from "@/store/timelineSlice";
import Button from "@/components/ui/Button";
import ElementColorPicker from "@/components/ElementColorPicker";
import { OverlayManager } from "../extension/content/OverlayManager";
import VideoTimeDisplay from "@/components/VideoTimeDisplay";
import TimeRangeInputs from "@/components/TimeRangeInputs";
import { RootState } from "@/store";

const EditPage: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedElementId, elements } = useSelector(
    (state: RootState) => state.timeline
  );

  useEffect(() => {
    const handleElementSelected = (event: CustomEvent) => {
      dispatch(setSelectedElementId(event.detail.element?.id || null));
    };

    const handleSelectionCleared = () => {
      dispatch(setSelectedElementId(null));
    };

    const handleUpdateElementTime = (event: CustomEvent) => {
      const { from, to } = event.detail;
      OverlayManager.updateElementTime(event.detail.element, from, to);
    };

    window.addEventListener(
      "ELEMENT_SELECTED",
      handleElementSelected as EventListener
    );
    window.addEventListener(
      "SELECTION_CLEARED",
      handleSelectionCleared as EventListener
    );
    window.addEventListener(
      "UPDATE_ELEMENT_TIME",
      handleUpdateElementTime as EventListener
    );

    return () => {
      window.removeEventListener(
        "ELEMENT_SELECTED",
        handleElementSelected as EventListener
      );
      window.removeEventListener(
        "SELECTION_CLEARED",
        handleSelectionCleared as EventListener
      );
      window.removeEventListener(
        "UPDATE_ELEMENT_TIME",
        handleUpdateElementTime as EventListener
      );
    };
  }, [dispatch]);

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
        {elements.length}
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
