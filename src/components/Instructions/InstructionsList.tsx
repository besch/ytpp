import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectInstructions,
  removeInstruction,
} from "@/store/instructionsSlice";
import { Clock, Pause, SkipForward, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { PauseInstruction, SkipInstruction } from "@/types";
import { setCurrentTime } from "@/store/timelineSlice";

const InstructionsList: React.FC = () => {
  const instructions = useSelector(selectInstructions);
  const dispatch = useDispatch();

  const handleDelete = (instructionId: string) => {
    dispatch(removeInstruction(instructionId));
  };

  const getInstructionIcon = (type: string) => {
    switch (type) {
      case "pause":
        return <Pause size={16} className="text-muted-foreground" />;
      case "skip":
        return <SkipForward size={16} className="text-muted-foreground" />;
      default:
        return null;
    }
  };

  const handleInstructionClick = (triggerTime: number) => {
    dispatch(setCurrentTime(triggerTime));
  };

  return (
    <div className="space-y-2">
      {instructions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No instructions added yet.
        </p>
      ) : (
        instructions.map((instruction) => (
          <div
            key={instruction.id}
            className="flex items-center justify-between p-3 bg-muted/10 rounded-md hover:bg-muted/20 transition-colors cursor-pointer"
            onClick={() => handleInstructionClick(instruction.triggerTime)}
          >
            <div className="flex items-center gap-3">
              {getInstructionIcon(instruction.type)}
              <div>
                <p className="text-sm font-medium">
                  {instruction.type === "pause"
                    ? `Pause for ${
                        (instruction as PauseInstruction).pauseDuration
                      }ms`
                    : `Skip to ${
                        (instruction as SkipInstruction).skipToTime
                      }ms`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Trigger at: {instruction.triggerTime}ms
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(instruction.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))
      )}
    </div>
  );
};

export default InstructionsList;
