import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { ArrowLeft, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { selectCurrentTime, setCurrentTime } from "@/store/timelineSlice";
import {
  addInstruction,
  updateInstruction,
  selectEditingInstruction,
  selectInstructions,
  setEditingInstruction,
  removeInstruction,
} from "@/store/instructionsSlice";
import {
  PauseInstruction,
  SkipInstruction,
  Instruction,
  TimeInput,
} from "@/types";
import InstructionsList from "./InstructionsList";

const InstructionEditor: React.FC = () => {
  const dispatch = useDispatch();
  const currentTime = useSelector(selectCurrentTime);
  const editingInstruction = useSelector(selectEditingInstruction);
  const instructions = useSelector(selectInstructions);

  const isEditing = editingInstruction !== null && "id" in editingInstruction;
  const selectedType = editingInstruction?.type || null;

  const parseTimeInput = (data: TimeInput) => {
    return (
      (Number(data.hours) * 3600 +
        Number(data.minutes) * 60 +
        Number(data.seconds)) *
      1000
    );
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<any>({
    defaultValues: {
      hours: 0,
      minutes: 0,
      seconds: 0,
      pauseDuration: 0,
      skipToHours: 0,
      skipToMinutes: 0,
      skipToSeconds: 0,
    },
  });

  useEffect(() => {
    if (isEditing) {
      const totalSeconds = editingInstruction.triggerTime / 1000;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);

      setValue("hours", hours);
      setValue("minutes", minutes);
      setValue("seconds", seconds);

      if (editingInstruction.type === "pause") {
        setValue(
          "pauseDuration",
          (editingInstruction as PauseInstruction).pauseDuration
        );
      } else if (editingInstruction.type === "skip") {
        const skipToTime =
          (editingInstruction as SkipInstruction).skipToTime / 1000;
        const skipHours = Math.floor(skipToTime / 3600);
        const skipMinutes = Math.floor((skipToTime % 3600) / 60);
        const skipSeconds = Math.floor(skipToTime % 60);

        setValue("skipToHours", skipHours);
        setValue("skipToMinutes", skipMinutes);
        setValue("skipToSeconds", skipSeconds);
      }
    } else {
      const totalSeconds = currentTime / 1000;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);

      setValue("hours", hours);
      setValue("minutes", minutes);
      setValue("seconds", seconds);

      // For new skip instructions, set skipToTime to currentTime + 1 second
      if (selectedType === "skip") {
        const skipToSeconds = totalSeconds + 1; // Add 1 second
        const skipHours = Math.floor(skipToSeconds / 3600);
        const skipMinutes = Math.floor((skipToSeconds % 3600) / 60);
        const skipSeconds = Math.floor(skipToSeconds % 60);

        setValue("skipToHours", skipHours);
        setValue("skipToMinutes", skipMinutes);
        setValue("skipToSeconds", skipSeconds);
      }
    }
  }, [isEditing, editingInstruction, currentTime, selectedType, setValue]);

  // Add useEffect to sync form inputs with currentTime when not editing
  useEffect(() => {
    if (!isEditing && selectedType === null) {
      const totalSeconds = currentTime / 1000;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);

      setValue("hours", hours);
      setValue("minutes", minutes);
      setValue("seconds", seconds);
    }
  }, [currentTime, isEditing, selectedType, setValue]);

  const handleBack = () => {
    dispatch(setEditingInstruction(null));
  };

  const handleSaveInstructions = () => {
    window.dispatchEvent(
      new CustomEvent("SAVE_INSTRUCTIONS", {
        detail: { instructions },
      })
    );
  };

  const onSubmit = (data: any) => {
    const triggerTime = parseTimeInput(data);
    let newInstruction: Instruction;

    if (selectedType === "pause") {
      newInstruction = {
        id: editingInstruction?.id || Date.now().toString(),
        type: "pause",
        triggerTime,
        pauseDuration: Number(data.pauseDuration),
      } as PauseInstruction;
    } else if (selectedType === "skip") {
      const skipToTime =
        (Number(data.skipToHours) * 3600 +
          Number(data.skipToMinutes) * 60 +
          Number(data.skipToSeconds)) *
        1000;

      newInstruction = {
        id: editingInstruction?.id || Date.now().toString(),
        type: "skip",
        triggerTime,
        skipToTime,
      } as SkipInstruction;
    } else {
      return;
    }

    if (isEditing) {
      dispatch(updateInstruction(newInstruction));
    } else {
      dispatch(addInstruction(newInstruction));
    }

    dispatch(setCurrentTime(triggerTime));

    // Update storage immediately after adding/updating instruction
    window.dispatchEvent(
      new CustomEvent("SAVE_INSTRUCTIONS", {
        detail: {
          instructions: isEditing
            ? instructions.map((i) =>
                i.id === newInstruction.id ? newInstruction : i
              )
            : [...instructions, newInstruction],
        },
      })
    );

    reset();
    dispatch(setEditingInstruction(null));
  };

  const renderForm = () => {
    if (!selectedType && !isEditing) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Instructions</h3>
          </div>
          <InstructionsList />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-0 h-8 w-8"
            >
              <ArrowLeft size={20} />
            </Button>
            <h3 className="text-sm font-medium">
              {isEditing ? "Edit Instruction" : "Add Instruction"}
            </h3>
          </div>
          {isEditing && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (editingInstruction?.id) {
                  dispatch(removeInstruction(editingInstruction.id));
                  handleSaveInstructions();
                  dispatch(setEditingInstruction(null));
                }
              }}
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          )}
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Trigger Time
            </label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="HH"
                {...register("hours", { min: 0 })}
              />
              <Input
                type="number"
                placeholder="MM"
                {...register("minutes", { min: 0, max: 59 })}
              />
              <Input
                type="number"
                placeholder="SS"
                {...register("seconds", { min: 0, max: 59 })}
              />
            </div>
          </div>
          {selectedType === "pause" && (
            <div>
              <label className="text-sm text-muted-foreground">
                Pause Duration (seconds)
              </label>
              <Input
                type="number"
                {...register("pauseDuration", { required: true, min: 0 })}
              />
              {errors.pauseDuration && (
                <span className="text-xs text-destructive">
                  This field is required
                </span>
              )}
            </div>
          )}
          {selectedType === "skip" && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Skip to Time
              </label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="HH"
                  {...register("skipToHours", { min: 0 })}
                />
                <Input
                  type="number"
                  placeholder="MM"
                  {...register("skipToMinutes", { min: 0, max: 59 })}
                />
                <Input
                  type="number"
                  placeholder="SS"
                  {...register("skipToSeconds", { min: 0, max: 59 })}
                />
              </div>
            </div>
          )}
          <Button type="submit" className="w-full">
            {isEditing ? "Update Instruction" : "Add Instruction"}
          </Button>
        </form>
      </div>
    );
  };

  return <div className="p-4">{renderForm()}</div>;
};

export default InstructionEditor;
