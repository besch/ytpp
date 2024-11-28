import React from "react";
import Button from "@/components/ui/Button";

interface InstructionTypeSelectProps {
  onSelect: (type: string) => void;
}

const InstructionTypeSelect: React.FC<InstructionTypeSelectProps> = ({
  onSelect,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onSelect("overlay")}
        >
          Media Instruction
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onSelect("skip")}
        >
          Skip Instruction
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onSelect("text-overlay")}
        >
          Text Overlay
        </Button>
      </div>
    </div>
  );
};

export default InstructionTypeSelect;
