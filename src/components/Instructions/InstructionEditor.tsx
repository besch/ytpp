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
  selectCurrentTimeline,
  setCurrentTimeline,
} from "@/store/timelineSlice";
import { TimeInput } from "../ui/TimeInput";
import { dispatchCustomEvent } from "@/lib/eventSystem";
import VideoUpload from "@/components/VideoUpload";
import { api } from "@/lib/api";
import { Instruction, PauseInstruction, SkipInstruction } from "@/types";
import InstructionsList from "./InstructionsList";
import { TimeInput as TimeInputInterface } from "@/types";

const InstructionEditor: React.FC = () => {
  const dispatch = useDispatch();
  const currentTime = useSelector(selectCurrentTime);
  const editingInstruction = useSelector(selectEditingInstruction);
  const instructions = useSelector(selectInstructions);
  const currentTimeline = useSelector(selectCurrentTimeline);

  const isEditing = editingInstruction !== null && "id" in editingInstruction;
  const selectedType = editingInstruction?.type || null;

  const parseTimeInput = (data: TimeInputInterface) => {
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

  const handleSaveInstructions = async () => {
    if (!currentTimeline) return;

    try {
      const updatedTimeline = await api.timelines.update(currentTimeline.id, {
        instructions: instructions.map((instruction) => ({
          ...instruction,
          videoId:
            new URLSearchParams(window.location.search).get("v") || "default", // Get videoId from URL
        })),
      });

      dispatch(setCurrentTimeline(updatedTimeline));
    } catch (error) {
      console.error("Failed to save instructions:", error);
    }
  };

  const onSubmit = async (data: any) => {
    const triggerTime = parseTimeInput(data);
    const instructionId = editingInstruction?.id || Date.now().toString();
    let newInstruction: Instruction;

    if (selectedType === "pause") {
      let overlayVideo = null;
      if (data.overlayVideo) {
        try {
          const file = new File(
            [data.overlayVideo],
            `overlay-${Date.now()}.mp4`,
            {
              type: data.overlayVideo.type,
            }
          );

          const mediaFile = await api.timelines.uploadMedia(
            file,
            currentTimeline!.id,
            instructionId
          );

          overlayVideo = {
            id: mediaFile.id,
            url: mediaFile.url,
            duration: data.pauseDuration,
          };
        } catch (error) {
          console.error("Failed to upload overlay video:", error);
          return;
        }
      }

      newInstruction = {
        id: instructionId,
        videoId:
          new URLSearchParams(window.location.search).get("v") || "default",
        type: "pause",
        triggerTime,
        pauseDuration: Number(data.pauseDuration),
        overlayVideo,
      } as PauseInstruction;
    } else if (selectedType === "skip") {
      newInstruction = {
        id: instructionId,
        videoId:
          new URLSearchParams(window.location.search).get("v") || "default",
        type: "skip",
        triggerTime,
        skipToTime: parseTimeInput({
          hours: data.skipToHours,
          minutes: data.skipToMinutes,
          seconds: data.skipToSeconds,
        }),
      } as SkipInstruction;
    } else {
      return;
    }

    let updatedInstructions: Instruction[];
    if (isEditing) {
      updatedInstructions = instructions.map((i) =>
        i.id === newInstruction.id ? newInstruction : i
      );
    } else {
      updatedInstructions = [...instructions, newInstruction];
    }

    try {
      const updatedTimeline = {
        ...currentTimeline!,
        instructions: updatedInstructions,
      };

      const savedTimeline = await api.timelines.update(
        currentTimeline!.id,
        updatedTimeline
      );
      dispatch(setCurrentTimeline(savedTimeline));
      dispatchCustomEvent("SET_TIMELINE", { timeline: savedTimeline });
    } catch (error) {
      console.error("Failed to save instruction:", error);
    }

    dispatch(setCurrentTime(triggerTime));
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

  const handleDeleteOverlayVideo = () => {
    setValue("overlayVideo", null); // Clear the overlay video from the form
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
                {watch("overlayVideo") ? (
                  <div className="flex items-center gap-2">
                    <span>{watch("overlayVideo").name}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteOverlayVideo}
                    >
                      Delete
                    </Button>
                  </div>
                ) : (
                  <VideoUpload
                    onVideoSelected={(videoData) => {
                      setValue("pauseDuration", Math.ceil(videoData.duration));
                      setValue("overlayVideo", videoData);
                    }}
                    currentVideo={watch("overlayVideo")}
                  />
                )}
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
