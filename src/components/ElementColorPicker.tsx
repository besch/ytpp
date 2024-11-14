import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ChromePicker, ColorResult } from "react-color";
import { selectSelectedElement, updateElement } from "@/store/timelineSlice";
import { dispatchCustomEvent } from "@/lib/eventSystem";
import { selectCurrentTimeline } from "@/store/timelineSlice";

const ElementColorPicker: React.FC = React.memo(() => {
  const dispatch = useDispatch();
  const currentTimeline = useSelector(selectCurrentTimeline);
  const selectedElement = useSelector(selectSelectedElement);

  const handleColorChange = useCallback(
    (color: ColorResult) => {
      if (!selectedElement || !currentTimeline?.id) return;

      dispatchCustomEvent("UPDATE_ELEMENT_COLOR", {
        timelineId: currentTimeline.id,
        elementId: selectedElement.id,
        color: color.hex,
        type: "fill",
      });
    },
    [currentTimeline?.id, selectedElement]
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
