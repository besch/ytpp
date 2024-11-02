import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ChromePicker, ColorResult } from "react-color";
import {
  selectSelectedElementStyle,
  selectSelectedElement,
  setElementColor,
} from "@/store/timelineSlice";

const ElementColorPicker: React.FC = () => {
  const dispatch = useDispatch();
  const elementStyle = useSelector(selectSelectedElementStyle);
  const selectedElementId = useSelector(selectSelectedElement);
  const [currentColor, setCurrentColor] = useState<string>(elementStyle.fill);

  useEffect(() => {
    if (elementStyle.fill) {
      setCurrentColor(elementStyle.fill);
    }
  }, [elementStyle]);

  useEffect(() => {
    // Listen for selection events
    const handleElementSelected = (event: CustomEvent) => {
      const { element } = event.detail;
      if (element && element.fill) {
        setCurrentColor(element.fill);
      }
    };

    const handleSelectionCleared = () => {
      setCurrentColor("#000000"); // Reset to default color
    };

    window.addEventListener(
      "FORWARDED_ELEMENT_SELECTED",
      handleElementSelected as EventListener
    );
    window.addEventListener(
      "SELECTION_CLEARED",
      handleSelectionCleared as EventListener
    );

    return () => {
      window.removeEventListener(
        "FORWARDED_ELEMENT_SELECTED",
        handleElementSelected as EventListener
      );
      window.removeEventListener(
        "SELECTION_CLEARED",
        handleSelectionCleared as EventListener
      );
    };
  }, []);

  const handleColorChange = (color: ColorResult, type: "fill" | "stroke") => {
    setCurrentColor(color.hex);

    window.dispatchEvent(
      new CustomEvent("UPDATE_ELEMENT_COLOR", {
        detail: {
          color: color.hex,
          type: type,
        },
      })
    );
  };

  if (!selectedElementId) {
    return null;
  }

  return (
    <div>
      <ChromePicker
        color={currentColor}
        onChange={(color) => handleColorChange(color, "fill")}
        disableAlpha={true}
      />
    </div>
  );
};

export default ElementColorPicker;
