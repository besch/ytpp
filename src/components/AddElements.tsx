import React from "react";
import { Circle, Square, Type, Triangle, Minus, Image } from "lucide-react";
import Button from "@/components/ui/Button";

const AddElements: React.FC = () => {
  const addElement = (elementType: string) => {
    if (elementType === "gif") {
      // Open file picker for GIF
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/gif";
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const gifUrl = e.target?.result as string;
            window.dispatchEvent(
              new CustomEvent("ADD_ELEMENT", {
                detail: { elementType: "gif", gifUrl },
              })
            );
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      window.dispatchEvent(
        new CustomEvent("ADD_ELEMENT", {
          detail: { elementType },
        })
      );
    }
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
        <Button
          onClick={() => addElement("gif")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Image size={18} />
        </Button>
      </div>
    </>
  );
};

export default AddElements;
