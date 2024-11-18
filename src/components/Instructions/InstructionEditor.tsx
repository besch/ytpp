import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  selectCurrentTime,
  setCurrentTime,
  setEditingInstruction,
  selectEditingInstruction,
  selectInstructions,
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
      useOverlayDuration: false,
      muteOverlayVideo: false,
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
        const pauseInstruction = editingInstruction as PauseInstruction;
        setValue("pauseDuration", pauseInstruction.pauseDuration);
        setValue(
          "useOverlayDuration",
          pauseInstruction.useOverlayDuration || false
        );
        setValue(
          "muteOverlayVideo",
          pauseInstruction.muteOverlayVideo || false
        );

        if (pauseInstruction.overlayVideo) {
          setValue("overlayVideo", {
            url: pauseInstruction.overlayVideo.url,
            duration: pauseInstruction.overlayVideo.duration,
            name: `Overlay Video (${Math.round(
              pauseInstruction.overlayVideo.duration
            )}s)`,
          });
        }
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

  // Sync form inputs with currentTime when not editing
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

  // Load media file data when editing
  useEffect(() => {
    if (isEditing && editingInstruction?.type === "pause") {
      const pauseInstruction = editingInstruction as PauseInstruction;
      if (pauseInstruction.overlayVideo) {
        setValue("overlayVideo", {
          url: pauseInstruction.overlayVideo.url,
          duration: pauseInstruction.overlayVideo.duration,
          name: `Overlay Video (${Math.round(
            pauseInstruction.overlayVideo.duration
          )}s)`,
        });
      }
    }
  }, [isEditing, editingInstruction, setValue]);

  // Disable pauseDuration input based on useOverlayDuration
  useEffect(() => {
    if (watch("useOverlayDuration")) {
      // If useOverlayDuration is checked, disable pauseDuration input
      setValue("pauseDuration", watch("overlayVideo")?.duration || 0);
    }
  }, [watch("useOverlayDuration"), watch("overlayVideo"), setValue]);

  const handleBack = () => {
    dispatch(setEditingInstruction(null));
  };

  const handleSaveInstructions = async (updatedInstructions: Instruction[]) => {
    if (!currentTimeline) return;

    try {
      const updatedTimeline = {
        ...currentTimeline,
        instructions: updatedInstructions,
      };

      const savedTimeline = await api.timelines.update(
        currentTimeline.id,
        updatedTimeline
      );
      dispatch(setCurrentTimeline(savedTimeline));
      dispatchCustomEvent("SET_TIMELINE", { timeline: savedTimeline });
    } catch (error) {
      console.error("Failed to save instructions:", error);
    }
  };

  const onSubmit = async (data: any) => {
    const triggerTime = parseTimeInput(data);
    let newInstruction: Instruction;

    if (selectedType === "pause") {
      let overlayVideo =
        editingInstruction?.type === "pause"
          ? (editingInstruction as PauseInstruction).overlayVideo
          : null;

      if (data.overlayVideo?.file) {
        try {
          const file = new File(
            [data.overlayVideo.file],
            data.overlayVideo.name,
            {
              type: data.overlayVideo.type,
            }
          );

          const mediaURL = await api.timelines.uploadMedia(
            file,
            currentTimeline!.id
          );

          overlayVideo = {
            url: mediaURL.url,
            duration: Number(data.overlayVideo.duration),
            name: data.overlayVideo.name,
          };
        } catch (error) {
          console.error("Failed to upload overlay video:", error);
          return;
        }
      } else if (data.overlayVideo) {
        overlayVideo = data.overlayVideo;
      }

      newInstruction = {
        id: editingInstruction?.id || Date.now().toString(),
        type: "pause",
        triggerTime,
        pauseDuration: Number(data.pauseDuration),
        useOverlayDuration: data.useOverlayDuration,
        muteOverlayVideo: data.muteOverlayVideo,
        overlayVideo,
      } as PauseInstruction;
    } else if (selectedType === "skip") {
      const skipToTime = parseTimeInput({
        hours: data.skipToHours,
        minutes: data.skipToMinutes,
        seconds: data.skipToSeconds,
      });

      newInstruction = {
        id: editingInstruction?.id || Date.now().toString(),
        type: "skip",
        triggerTime,
        skipToTime,
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
      await handleSaveInstructions(updatedInstructions);
    } catch (error) {
      console.error("Failed to save instruction:", error);
      return;
    }

    dispatch(setCurrentTime(triggerTime));
    reset();
    dispatch(setEditingInstruction(null));
  };

  const handleDeleteOverlayVideo = async () => {
    const mediaURL = watch("overlayVideo")?.url;
    if (mediaURL) {
      try {
        await api.timelines.deleteMedia(mediaURL);
        setValue("overlayVideo", null);

        // Update instructions by setting overlayVideo to null
        if (editingInstruction?.id) {
          const updatedInstructions = instructions.map((instruction) =>
            instruction.id === editingInstruction.id
              ? { ...instruction, overlayVideo: null }
              : instruction
          );

          await handleSaveInstructions(updatedInstructions);
        }
      } catch (error) {
        console.error("Failed to delete overlay video:", error);
      }
    } else {
      setValue("overlayVideo", null);
    }
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
          <InstructionsList />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <h3 className="text-lg font-medium">
            {isEditing ? "Edit Instruction" : "Add Instruction"}
          </h3>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register("useOverlayDuration")}
                  id="useOverlayDuration"
                  disabled={!watch("overlayVideo")}
                />
                <label htmlFor="useOverlayDuration" className="text-sm">
                  Use Overlay Video Duration
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register("muteOverlayVideo")}
                  id="muteOverlayVideo"
                />
                <label htmlFor="muteOverlayVideo" className="text-sm">
                  Mute Overlay Video
                </label>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">
                  Pause Duration (seconds)
                </label>
                <Input
                  type="number"
                  {...register("pauseDuration", {
                    required: !watch("useOverlayDuration"),
                    min: 0,
                  })}
                  disabled={watch("useOverlayDuration")}
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>{watch("overlayVideo").name}</span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteOverlayVideo}
                      >
                        Delete
                      </Button>
                    </div>
                    <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
                      <video
                        src={watch("overlayVideo").url}
                        className="w-full h-full object-contain"
                        controls
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                ) : (
                  <VideoUpload
                    onVideoSelected={(videoData) => {
                      setValue("pauseDuration", Math.ceil(videoData.duration));
                      setValue("overlayVideo", {
                        file: videoData.file,
                        url: videoData.url,
                        duration: videoData.duration,
                        name: videoData.name,
                        type: videoData.type,
                      });
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

  return <div className="p-6">{renderForm()}</div>;
};

export default InstructionEditor;
