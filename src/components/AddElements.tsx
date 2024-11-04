import React from "react";
import { Circle, Square, Type, Triangle, Minus } from "lucide-react";
import Button from "@/components/ui/Button";

const AddElements: React.FC = () => {
  const addElement = (elementType: string) => {
    window.dispatchEvent(
      new CustomEvent("ADD_ELEMENT", {
        detail: { elementType },
      })
    );
  };

  return (
    <>
      <h2 className="text-lg font-semibold text-foreground">Add Elements</h2>
      <div className="flex gap-2">
        <Button
          onClick={() => addElement("rectangle")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Square size={18} />
        </Button>
        <Button
          onClick={() => addElement("circle")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Circle size={18} />
        </Button>
        <Button
          onClick={() => addElement("text")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Type size={18} />
        </Button>
        <Button
          onClick={() => addElement("triangle")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Triangle size={18} />
        </Button>
      </div>
    </>
  );
};

export default AddElements;
