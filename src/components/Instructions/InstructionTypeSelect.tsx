import React from "react";
import { Pause, SkipForward } from "lucide-react";
import Button from "@/components/ui/Button";

interface InstructionType {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const instructionTypes: InstructionType[] = [
  {
    id: "pause",
    label: "Pause",
    icon: Pause,
    description: "Pause the video for a specified duration",
  },
  {
    id: "skip",
    label: "Skip",
    icon: SkipForward,
    description: "Skip to a specific time in the video",
  },
];

interface InstructionTypeSelectProps {
  onSelect: (type: string) => void;
}

const InstructionTypeSelect: React.FC<InstructionTypeSelectProps> = ({
  onSelect,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {instructionTypes.map((type) => {
        const Icon = type.icon;
        return (
          <Button
            key={type.id}
            variant="outline"
            className="flex flex-col items-center gap-2 p-4 h-auto"
            onClick={() => onSelect(type.id)}
          >
            <Icon size={24} />
            <span className="font-medium">{type.label}</span>
            <span className="text-xs text-muted-foreground text-center">
              {type.description}
            </span>
          </Button>
        );
      })}
    </div>
  );
};

export default InstructionTypeSelect;
