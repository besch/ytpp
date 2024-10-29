import React, { useEffect } from "react";
import { Circle, Square, Type } from "lucide-react";
import Button from "@/components/ui/Button";

const EditPage: React.FC = () => {
  const addElement = (elementType: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id!, {
          action: "ADD_ELEMENT",
          elementType,
        });
      }
    });
  };

  const saveElements = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id!, { action: "SAVE_ELEMENTS" });
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 bg-background p-4 rounded-lg shadow-lg">
      <h2 className="text-lg font-semibold text-foreground">Add Elements</h2>
      <div className="flex gap-2">
        <Button
          onClick={() => addElement("rectangle")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Square size={18} />
          Rectangle
        </Button>
        <Button
          onClick={() => addElement("circle")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Circle size={18} />
          Circle
        </Button>
        <Button
          onClick={() => addElement("text")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Type size={18} />
          Text
        </Button>
      </div>
      <Button onClick={saveElements} className="mt-2">
        Save Elements
      </Button>
    </div>
  );
};

export default EditPage;
