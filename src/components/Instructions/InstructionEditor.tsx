import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { selectCurrentTime } from "@/store/timelineSlice";
import { addInstruction, selectInstructions } from "@/store/instructionsSlice";
import InstructionTypeSelect from "./InstructionTypeSelect";
import { PauseInstruction, SkipInstruction } from "@/types";
import InstructionsList from "./InstructionsList";

interface PauseFormData {
  pauseDuration: number;
}

interface SkipFormData {
  skipToTime: number;
}

const InstructionEditor: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const dispatch = useDispatch();
  const currentTime = useSelector(selectCurrentTime);
  const instructions = useSelector(selectInstructions);

  const {
    register: registerPause,
    handleSubmit: handlePauseSubmit,
    formState: { errors: pauseErrors },
    reset: resetPause,
  } = useForm<PauseFormData>();

  const {
    register: registerSkip,
    handleSubmit: handleSkipSubmit,
    formState: { errors: skipErrors },
    reset: resetSkip,
  } = useForm<SkipFormData>();

  const handleBack = () => {
    setSelectedType(null);
  };

  const handleSave = () => {
    window.dispatchEvent(
      new CustomEvent("SAVE_INSTRUCTIONS", {
        detail: { instructions },
      })
    );
  };

  const onSubmitPause = (data: PauseFormData) => {
    dispatch(
      addInstruction({
        id: Date.now().toString(),
        type: "pause",
        triggerTime: currentTime,
        pauseDuration: data.pauseDuration,
      })
    );
    resetPause();
    setSelectedType(null);
  };

  const onSubmitSkip = (data: SkipFormData) => {
    dispatch(
      addInstruction({
        id: Date.now().toString(),
        type: "skip",
        triggerTime: currentTime,
        skipToTime: data.skipToTime,
      })
    );
    resetSkip();
    setSelectedType(null);
  };

  const renderForm = () => {
    switch (selectedType) {
      case "pause":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-0 h-8 w-8"
              >
                <ArrowLeft size={20} />
              </Button>
              <h3 className="text-sm font-medium">Instruction List</h3>
            </div>
            <form
              onSubmit={handlePauseSubmit(onSubmitPause)}
              className="space-y-4"
            >
              <div>
                <label className="text-sm text-muted-foreground">
                  Pause Duration (ms)
                </label>
                <Input
                  type="number"
                  {...registerPause("pauseDuration", {
                    required: true,
                    min: 0,
                  })}
                />
                {pauseErrors.pauseDuration && (
                  <span className="text-xs text-destructive">
                    This field is required
                  </span>
                )}
              </div>
              <Button type="submit" className="w-full">
                Add Instruction
              </Button>
            </form>
          </div>
        );

      case "skip":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-0 h-8 w-8"
              >
                <ArrowLeft size={20} />
              </Button>
              <h3 className="text-sm font-medium">Add Skip Instruction</h3>
            </div>
            <form
              onSubmit={handleSkipSubmit(onSubmitSkip)}
              className="space-y-4"
            >
              <div>
                <label className="text-sm text-muted-foreground">
                  Skip to Time (ms)
                </label>
                <Input
                  type="number"
                  {...registerSkip("skipToTime", { required: true, min: 0 })}
                />
                {skipErrors.skipToTime && (
                  <span className="text-xs text-destructive">
                    This field is required
                  </span>
                )}
              </div>
              <Button type="submit" className="w-full">
                Add Instruction
              </Button>
            </form>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Instructions</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                Save Instructions
              </Button>
            </div>
            <InstructionsList />
            <div className="pt-4 border-t border-border">
              <InstructionTypeSelect
                onSelect={(type) => setSelectedType(type)}
              />
            </div>
          </div>
        );
    }
  };

  return <div className="p-4">{renderForm()}</div>;
};

export default InstructionEditor;
