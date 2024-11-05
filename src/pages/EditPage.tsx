import React, { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import ElementColorPicker from "@/components/ElementColorPicker";
import TimeRangeInputs from "@/components/TimeRangeInputs";
import { useCanvasEvents } from "@/hooks/useCanvasEvents";
import AddElements from "@/components/AddElements";
import DeleteElementButton from "@/components/DeleteElementButton";
import InstructionEditor from "@/components/Instructions/InstructionEditor";
import { useInstructionsEvents } from "@/hooks/useInstructionsEvents";
import { Layers, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { selectSelectedElement } from "@/store/timelineSlice";

type Tab = {
  id: string;
  label: string;
  icon: React.ElementType;
  content: React.ReactNode;
  disabled?: boolean;
};

const EditPage: React.FC = () => {
  useCanvasEvents();
  useInstructionsEvents();
  const [activeTab, setActiveTab] = useState("elements");
  const selectedElement = useSelector(selectSelectedElement);

  useEffect(() => {
    if (selectedElement) {
      setActiveTab("properties");
    } else if (activeTab === "properties") {
      setActiveTab("elements");
    }
  }, [selectedElement]);

  const saveElements = () => {
    window.dispatchEvent(new CustomEvent("SAVE_ELEMENTS"));
  };

  const tabs: Tab[] = [
    {
      id: "elements",
      label: "Elements",
      icon: Layers,
      content: <AddElements />,
    },
    {
      id: "properties",
      label: "Properties",
      icon: Settings,
      disabled: !selectedElement,
      content: selectedElement ? (
        <div className="space-y-6">
          <TimeRangeInputs />
          <ElementColorPicker />
          <div className="pt-4 border-t border-border space-y-4">
            <DeleteElementButton className="w-full" />
            <Button onClick={saveElements} size="lg" className="w-full">
              Save All Changes
            </Button>
          </div>
        </div>
      ) : null,
    },
    {
      id: "instructions",
      label: "Instructions",
      icon: Clock,
      content: <InstructionEditor />,
    },
  ];

  return (
    <div className="flex flex-col gap-6 bg-background p-6 rounded-lg shadow-lg border border-border h-full">
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Vertical Tabs */}
        <div className="flex flex-col gap-2 border-r border-border pr-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/50 text-muted-foreground",
                  tab.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-6">
            {tabs.find((tab) => tab.id === activeTab)?.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPage;
