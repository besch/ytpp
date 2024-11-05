import React from "react";
import { Circle, Square, Type, Triangle, Image } from "lucide-react";
import Button from "@/components/ui/Button";

const AddElements: React.FC = () => {
  const addElement = (elementType: string) => {
    if (elementType === "gif") {
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

  const elements = [
    { type: "rectangle", icon: Square, label: "Rectangle" },
    { type: "circle", icon: Circle, label: "Circle" },
    { type: "text", icon: Type, label: "Text" },
    { type: "triangle", icon: Triangle, label: "Triangle" },
    { type: "gif", icon: Image, label: "GIF" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Add Elements</h3>
      <div className="grid grid-cols-5 gap-2">
        {elements.map(({ type, icon: Icon, label }) => (
          <Button
            key={type}
            onClick={() => addElement(type)}
            variant="outline"
            className="flex flex-col items-center gap-2 p-3 h-auto"
            title={label}
          >
            <Icon size={20} />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AddElements;
