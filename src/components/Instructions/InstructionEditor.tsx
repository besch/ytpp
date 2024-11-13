import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { ArrowLeft, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  selectCurrentTime,
  setCurrentTime,
  addInstruction,
  updateInstruction,
  selectEditingInstruction,
  selectInstructions,
  setEditingInstruction,
  removeInstruction,
} from "@/store/timelineSlice";
import {
  PauseInstruction,
  SkipInstruction,
  Instruction,
  TimeInput as TimeInputType,
} from "@/types";
import InstructionsList from "./InstructionsList";
import { TimeInput } from "../ui/TimeInput";
import { dispatchCustomEvent } from "@/lib/eventSystem";
import VideoUpload from "@/components/VideoUpload";
import { storage } from "@/lib/storage"; // Ensure you have a storage utility

const InstructionEditor: React.FC = () => {
  const dispatch = useDispatch();
  const currentTime = useSelector(selectCurrentTime);
  const editingInstruction = useSelector(selectEditingInstruction);
  const instructions = useSelector(selectInstructions);

  const isEditing = editingInstruction !== null && "id" in editingInstruction;
  const selectedType = editingInstruction?.type || null;

  const parseTimeInput = (data: TimeInputType) => {
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
    setValue,
    reset,
    watch,
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
    dispatchCustomEvent("SAVE_INSTRUCTIONS", {
      instructions,
    });
  };

  const onSubmit = async (data: any) => {
    const triggerTime = parseTimeInput(data);
    const instructionId = editingInstruction?.id || Date.now().toString();
    let newInstruction: Instruction;

    if (selectedType === "pause") {
      let overlayVideo = null;
      if (data.overlayVideo) {
        // Convert the uploaded video file to a Blob URL and store it
        const response = await fetch(data.overlayVideo.url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        overlayVideo = {
          url: blobUrl,
          duration: data.pauseDuration,
        };

        // Save the overlay video URL to storage with instructionId
        await storage.set(`overlayVideo_${instructionId}`, overlayVideo);
      }

      newInstruction = {
        id: instructionId,
        type: "pause",
        triggerTime,
        pauseDuration: Number(data.pauseDuration),
        overlayVideo, // Attach the overlay video
      } as PauseInstruction;
    } else if (selectedType === "skip") {
      const skipToTime =
        (Number(data.skipToHours) * 3600 +
          Number(data.skipToMinutes) * 60 +
          Number(data.skipToSeconds)) *
        1000;

      newInstruction = {
        id: instructionId,
        type: "skip",
        triggerTime,
        skipToTime,
      } as SkipInstruction;
    } else {
      return; // Exit if type is neither 'pause' nor 'skip'
    }

    if (isEditing) {
      dispatch(updateInstruction(newInstruction));
    } else {
      dispatch(addInstruction(newInstruction));
    }

    dispatch(setCurrentTime(triggerTime));

    // Update storage immediately after adding/updating instruction
    const updatedInstructions = isEditing
      ? instructions.map((i) =>
          i.id === newInstruction.id ? newInstruction : i
        )
      : [...instructions, newInstruction];

    await storage.set("instructions", updatedInstructions);

    reset();
    dispatch(setEditingInstruction(null));
  };

  const handleTimeChange = (time: number) => {
    const totalSeconds = time / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    setValue("hours", hours);
    setValue("minutes", minutes);
    setValue("seconds", seconds);
  };

  const handleSkipToTimeChange = (time: number) => {
    const totalSeconds = time / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    setValue("skipToHours", hours);
    setValue("skipToMinutes", minutes);
    setValue("skipToSeconds", seconds);
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
            <TimeInput
              value={parseTimeInput({
                hours: watch("hours"),
                minutes: watch("minutes"),
                seconds: watch("seconds"),
              })}
              onChange={handleTimeChange}
            />
          </div>

          {selectedType === "pause" && (
            <div className="space-y-4">
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

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Overlay Video
                </label>
                <VideoUpload
                  onVideoSelected={(videoData) => {
                    setValue("pauseDuration", Math.ceil(videoData.duration));
                    setValue("overlayVideo", videoData);
                  }}
                  currentVideo={watch("overlayVideo")}
                />
              </div>
            </div>
          )}

          {selectedType === "skip" && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Skip to Time
              </label>
              <TimeInput
                value={parseTimeInput({
                  hours: watch("skipToHours"),
                  minutes: watch("skipToMinutes"),
                  seconds: watch("skipToSeconds"),
                })}
                onChange={handleSkipToTimeChange}
              />
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
