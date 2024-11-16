import React from "react";
import { Circle, Square, Type, Triangle, Image } from "lucide-react";
import Button from "@/components/ui/Button";
import { dispatchCustomEvent } from "@/lib/eventSystem";
import { useSelector } from "react-redux";
import { selectCurrentTimeline } from "@/store/timelineSlice";

const AddElements: React.FC = () => {
  const currentTimeline = useSelector(selectCurrentTimeline);

  const addElement = (elementType: string) => {
    if (!currentTimeline?.id) return;

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
            dispatchCustomEvent("ADD_ELEMENT", {
              timelineId: currentTimeline.id,
              elementType: "gif",
              gifUrl,
            });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      dispatchCustomEvent("ADD_ELEMENT", {
        timelineId: currentTimeline.id,
        elementType,
      });
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {elements.map(({ type, icon: Icon, label }) => (
          <Button
            key={type}
            onClick={() => addElement(type)}
            variant="outline"
            className="flex flex-col items-center gap-2 p-4 h-auto"
            title={label}
          >
            <Icon size={24} />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AddElements;
