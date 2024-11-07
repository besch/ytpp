import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ChromePicker, ColorResult } from "react-color";
import { selectSelectedElement, updateElement } from "@/store/timelineSlice";
import { dispatchCustomEvent } from "@/lib/eventSystem";

const ElementColorPicker: React.FC = React.memo(() => {
  const dispatch = useDispatch();
  const selectedElement = useSelector(
    selectSelectedElement,
    (prev, next) =>
      prev?.id === next?.id && prev?.style?.fill === next?.style?.fill
  );

  const handleColorChange = useCallback(
    (color: ColorResult) => {
      if (!selectedElement) return;

      dispatch(
        updateElement({
          id: selectedElement.id,
          style: {
            ...selectedElement.style,
            fill: color.hex,
          },
        })
      );

      dispatchCustomEvent("UPDATE_ELEMENT_COLOR", {
        color: color.hex,
        type: "fill",
      });
    },
    [dispatch, selectedElement]
  );

  if (!selectedElement) {
    return null;
  }

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
});

export default ElementColorPicker;
