import React, { useEffect } from "react";
import { Circle, Square, Type } from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";

const EditPage: React.FC = () => {
  useEffect(() => {
    const handleSaveSuccess = (event: CustomEvent) => {
      toast.success(event.detail.message);
    };

    window.addEventListener("SAVE_SUCCESS", handleSaveSuccess as EventListener);

    return () => {
      window.removeEventListener(
        "SAVE_SUCCESS",
        handleSaveSuccess as EventListener
      );
    };
  }, []);

  const addElement = (elementType: string) => {
    window.dispatchEvent(
      new CustomEvent("ADD_ELEMENT", {
        detail: { elementType },
      })
    );
  };

  const saveElements = () => {
    window.dispatchEvent(new CustomEvent("SAVE_ELEMENTS"));
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
