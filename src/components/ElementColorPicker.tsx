import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { ChromePicker, ColorResult } from "react-color";
import { selectSelectedElement, updateElement } from "@/store/timelineSlice";

const ElementColorPicker: React.FC = () => {
  const dispatch = useDispatch();
  const selectedElement = useSelector(selectSelectedElement);

  if (!selectedElement) {
    return null;
  }

  const handleColorChange = (color: ColorResult) => {
    dispatch(
      updateElement({
        id: selectedElement.id,
        style: {
          ...selectedElement.style,
          fill: color.hex,
        },
      })
    );

    window.dispatchEvent(
      new CustomEvent("UPDATE_ELEMENT_COLOR", {
        detail: {
          color: color.hex,
          type: "fill",
        },
      })
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Element Color</h3>
      <div className="p-3 bg-muted/10 rounded-lg border border-border">
        <ChromePicker
          color={selectedElement.style.fill}
          onChange={handleColorChange}
          disableAlpha={true}
          className="w-full !shadow-none"
        />
      </div>
    </div>
  );
};

export default ElementColorPicker;
