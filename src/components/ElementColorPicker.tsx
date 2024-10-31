import React from "react";
import { SketchPicker } from "react-color";
import { Palette, Square } from "lucide-react";

interface ElementColorPickerProps {
  selectedElement: any;
  onColorChange: (color: string, type: "fill" | "stroke" | "text") => void;
}

const ElementColorPicker: React.FC<ElementColorPickerProps> = ({
  selectedElement,
  onColorChange,
}) => {
  if (!selectedElement) {
    return (
      <div className="mb-6 p-4 border border-border rounded-lg bg-muted/10">
        <p className="text-sm text-muted-foreground text-center">
          Select an element to customize its colors
        </p>
      </div>
    );
  }

  const isText = selectedElement.type === "textbox";

  return (
    <div className="mb-6 p-4 border border-border rounded-lg bg-muted/10">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Palette size={20} />
        Element Properties
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-muted-foreground flex items-center gap-2">
            <Square size={14} className="fill-current" />
            Fill Color
          </label>
          <div className="sketch-picker-wrapper">
            <SketchPicker
              color={selectedElement.fill || "#000000"}
              onChange={(color) => onColorChange(color.hex, "fill")}
              width="100%"
              presetColors={[]}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-muted-foreground flex items-center gap-2">
            <Square size={14} />
            Stroke Color
          </label>
          <div className="sketch-picker-wrapper">
            <SketchPicker
              color={selectedElement.stroke || "#000000"}
              onChange={(color) => onColorChange(color.hex, "stroke")}
              width="100%"
              presetColors={[]}
            />
          </div>
        </div>

        {isText && (
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Square size={14} />
              Text Color
            </label>
            <div className="sketch-picker-wrapper">
              <SketchPicker
                color={selectedElement.fill || "#000000"}
                onChange={(color) => onColorChange(color.hex, "text")}
                width="100%"
                presetColors={[]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElementColorPicker;
