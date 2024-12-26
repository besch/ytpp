import React from "react";
import Button from "@/components/ui/Button";
import { ImageIcon, Scissors, Type } from "lucide-react";

interface InstructionTypeSelectProps {
  onSelect: (type: string) => void;
}

const InstructionTypeSelect: React.FC<InstructionTypeSelectProps> = ({
  onSelect,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2 flex flex-col">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => onSelect("overlay")}
        >
          <ImageIcon className="h-4 w-4" />
          Media Instruction
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => onSelect("skip")}
        >
          <Scissors className="h-4 w-4" />
          Skip Instruction
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => onSelect("text-overlay")}
        >
          <Type className="h-4 w-4" />
          Text Overlay
        </Button>
      </div>
    </div>
  );
};

export default InstructionTypeSelect;
