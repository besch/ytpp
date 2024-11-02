import React, { useEffect, useState } from "react";
import { Circle, Square, Type } from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import ElementColorPicker from "@/components/ElementColorPicker";
import { OverlayManager } from "../extension/content/OverlayManager";
import VideoTimeDisplay from "@/components/VideoTimeDisplay";

const EditPage: React.FC = () => {
  const [selectedElement, setSelectedElement] = useState<any>(null);

  useEffect(() => {
    const handleSaveSuccess = (event: CustomEvent) => {
      toast.success(event.detail.message);
    };

    const handleElementSelected = (event: CustomEvent) => {
      setSelectedElement(event.detail.element);
    };

    const handleSelectionCleared = () => {
      setSelectedElement(null);
    };

    const handleUpdateElementTime = (event: CustomEvent) => {
      const { from, to } = event.detail;
      OverlayManager.updateElementTime(selectedElement, from, to);
    };

    window.addEventListener("SAVE_SUCCESS", handleSaveSuccess as EventListener);
    window.addEventListener(
      "FORWARDED_ELEMENT_SELECTED",
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
        "SAVE_SUCCESS",
        handleSaveSuccess as EventListener
      );
      window.removeEventListener(
        "FORWARDED_ELEMENT_SELECTED",
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
  }, [selectedElement]);

  const addElement = (elementType: string) => {
    window.dispatchEvent(
      new CustomEvent("ADD_ELEMENT", {
        detail: { elementType },
      })
    );
  };

  const handleColorChange = (
    color: string,
    type: "fill" | "stroke" | "text"
  ) => {
    window.dispatchEvent(
      new CustomEvent("UPDATE_ELEMENT_COLOR", {
        detail: { color, type },
      })
    );
  };

  const saveElements = () => {
    window.dispatchEvent(new CustomEvent("SAVE_ELEMENTS"));
  };

  return (
    <div className="flex flex-col gap-4 bg-background p-4 rounded-lg shadow-lg">
      <VideoTimeDisplay />
      <ElementColorPicker
        selectedElement={selectedElement}
        onColorChange={handleColorChange}
      />

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
