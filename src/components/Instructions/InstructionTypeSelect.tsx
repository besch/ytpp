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
      <h3 className="text-lg font-medium">Select Instruction Type</h3>
      <div className="space-y-2">
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => onSelect("overlay")}
        >
          Media Instruction
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => onSelect("skip")}
        >
          Skip Instruction
        </Button>
        <Button
          variant="outline"
          size="lg"
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
