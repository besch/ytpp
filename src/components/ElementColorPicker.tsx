import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { ChromePicker, ColorResult } from "react-color";
import { selectSelectedElement, updateElement } from "@/store/timelineSlice";
import { RootState } from "@/store";

const ElementColorPicker: React.FC = () => {
  const dispatch = useDispatch();
  const selectedElement = useSelector(selectSelectedElement);
  const { selectedElementId, elements } = useSelector(
    (state: RootState) => state.timeline
  );

  console.log("selectedElement", selectedElement, selectedElementId, elements);

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

    // Keep the existing canvas update functionality
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
    <div>
      <ChromePicker
        color={selectedElement.style.fill}
        onChange={handleColorChange}
        disableAlpha={true}
      />
    </div>
  );
};

export default ElementColorPicker;
