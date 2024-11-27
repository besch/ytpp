import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { ArrowLeft, Music } from "lucide-react";
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
import MediaUpload from "@/components/MediaUpload";
import { api } from "@/lib/api";
import {
  Instruction,
  SkipInstruction,
  TimeInput as TimeInputInterface,
  OverlayInstruction,
} from "@/types";
import InstructionsList from "./InstructionsList";
import MediaPositioner, { MediaPosition } from "./MediaPositioner";

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
      overlayDuration: 5,
      useOverlayDuration: false,
      muteOverlayMedia: false,
      pauseMainVideo: false,
      overlayMediaType: "video",
      skipToHours: 0,
      skipToMinutes: 0,
      skipToSeconds: 0,
    },
  });

  useEffect(() => {
    if (isEditing && editingInstruction) {
      const totalSeconds = editingInstruction.triggerTime / 1000;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);

      setValue("hours", hours, { shouldValidate: false });
      setValue("minutes", minutes, { shouldValidate: false });
      setValue("seconds", seconds, { shouldValidate: false });

      if (editingInstruction.type === "overlay") {
        const overlayInstruction = editingInstruction as OverlayInstruction;
        setValue("pauseMainVideo", overlayInstruction.pauseMainVideo || false);
        setValue("pauseDuration", overlayInstruction.pauseDuration);
        setValue(
          "useOverlayDuration",
          overlayInstruction.useOverlayDuration || false
        );
        setValue(
          "muteOverlayMedia",
          overlayInstruction.muteOverlayMedia || false
        );

        const overlayMedia = overlayInstruction.overlayMedia;
        if (overlayMedia) {
          setValue("overlayMedia", {
            url: overlayMedia.url,
            duration: overlayMedia.duration,
            name: overlayMedia.name,
            type: overlayMedia.type || "video/mp4",
            position: overlayMedia.position,
          });
          setValue(
            "overlayMediaType",
            (overlayMedia.type || "video/mp4").startsWith("video/")
              ? "video"
              : "image"
          );
        } else {
          setValue("overlayMedia", null);
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
    }
  }, [isEditing, editingInstruction, setValue]);

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

  // Disable pauseDuration input based on useOverlayDuration
  useEffect(() => {
    if (watch("useOverlayDuration")) {
      // If useOverlayDuration is checked, disable pauseDuration input
      setValue("pauseDuration", watch("overlayMedia")?.duration || 0);
    }
  }, [watch("useOverlayDuration"), watch("overlayMedia"), setValue]);

  // Add this new effect to watch for trigger time updates
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      // Only update if hours, minutes, or seconds changes
      if (name?.match(/^(hours|minutes|seconds)$/)) {
        const triggerTime = parseTimeInput({
          hours: value.hours || 0,
          minutes: value.minutes || 0,
          seconds: value.seconds || 0,
        });

        if (isEditing && editingInstruction) {
          // Create updated instruction with new trigger time
          const updatedInstruction = {
            ...editingInstruction,
            triggerTime,
          };

          // Update the instruction in the timeline
          const updatedInstructions = instructions.map((i) =>
            i.id === editingInstruction.id ? updatedInstruction : i
          );

          // Save the updated instructions
          handleSaveInstructions(updatedInstructions);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, isEditing, editingInstruction, instructions]);

  const handleBack = () => {
    // Reset form values including media state
    reset({
      hours: 0,
      minutes: 0,
      seconds: 0,
      pauseDuration: 0,
      useOverlayDuration: false,
      muteOverlayMedia: false,
      overlayMedia: null,
      skipToHours: 0,
      skipToMinutes: 0,
      skipToSeconds: 0,
      overlayMediaType: "video",
    });
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
    } catch (error) {
      console.error("Failed to save instructions:", error);
    }
  };

  const onSubmit = async (data: any) => {
    const triggerTime = parseTimeInput(data);
    let newInstruction: Instruction;

    if (selectedType === "overlay") {
      let overlayMedia =
        editingInstruction?.type === "overlay"
          ? (editingInstruction as OverlayInstruction).overlayMedia
          : null;

      if (data.overlayMedia?.file) {
        try {
          const file = new File(
            [data.overlayMedia.file],
            data.overlayMedia.name,
            {
              type: data.overlayMedia.type,
            }
          );

          const mediaURL = await api.timelines.uploadMedia(
            file,
            currentTimeline!.id
          );

          overlayMedia = {
            url: mediaURL.url,
            duration: Number(data.overlayDuration),
            name: data.overlayMedia.name,
            type: data.overlayMedia.type,
            position: data.overlayMedia.position,
          };
        } catch (error) {
          console.error("Failed to upload overlay media:", error);
          return;
        }
      } else if (data.overlayMedia) {
        overlayMedia = {
          ...data.overlayMedia,
          duration: Number(data.overlayDuration),
          position: data.overlayMedia.position,
        };
      }

      newInstruction = {
        id: editingInstruction?.id || Date.now().toString(),
        type: "overlay",
        triggerTime,
        overlayMedia,
        useOverlayDuration: data.useOverlayDuration,
        muteOverlayMedia: data.muteOverlayMedia,
        pauseMainVideo: data.pauseMainVideo,
        pauseDuration: Number(data.pauseDuration),
      } as OverlayInstruction;
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

  const handleDeleteOverlayMedia = async () => {
    const mediaURL = watch("overlayMedia")?.url;
    if (mediaURL) {
      try {
        await api.timelines.deleteMedia(mediaURL);
      } catch (error) {
        console.error("Failed to delete overlay media:", error);
      }
    }

    setValue("overlayMedia", null);

    // Update instructions by setting overlayMedia to null if we're editing
    if (editingInstruction?.id) {
      const updatedInstructions = instructions.map((instruction) =>
        instruction.id === editingInstruction.id
          ? { ...instruction, overlayMedia: null }
          : instruction
      );

      try {
        await handleSaveInstructions(updatedInstructions);
      } catch (error) {
        console.error("Failed to update instruction:", error);
      }
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

  // Add this effect to reset form when editingInstruction changes
  useEffect(() => {
    if (!editingInstruction) {
      // Reset form values when not editing
      reset({
        hours: Math.floor(currentTime / 1000 / 3600),
        minutes: Math.floor(((currentTime / 1000) % 3600) / 60),
        seconds: Math.floor((currentTime / 1000) % 60),
        pauseDuration: 0,
        useOverlayDuration: false,
        muteOverlayMedia: false,
        overlayMedia: null,
        skipToHours: 0,
        skipToMinutes: 0,
        skipToSeconds: 0,
        overlayMediaType: "video",
      });
    }
  }, [editingInstruction, currentTime, reset]);

  useEffect(() => {
    const overlayMedia = watch("overlayMedia");
    if (overlayMedia?.type?.startsWith("video/")) {
      setValue("useOverlayDuration", true);
    }
  }, [watch("overlayMedia"), setValue]);

  const handleMediaPositionChange = (position: MediaPosition) => {
    const overlayMedia = watch("overlayMedia");
    if (overlayMedia) {
      setValue("overlayMedia", {
        ...overlayMedia,
        position,
      });

      // If we're editing, update the instruction immediately
      if (editingInstruction?.id) {
        const updatedInstructions = instructions.map((instruction) =>
          instruction.id === editingInstruction.id
            ? {
                ...instruction,
                overlayMedia: {
                  ...overlayMedia,
                  position,
                },
              }
            : instruction
        );

        handleSaveInstructions(updatedInstructions);
      }
    }
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
                hours: watch("hours") || 0,
                minutes: watch("minutes") || 0,
                seconds: watch("seconds") || 0,
              })}
              onChange={handleTimeChange}
            />
          </div>

          {selectedType === "overlay" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Overlay Media
                </label>
                {watch("overlayMedia") ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>{watch("overlayMedia").name}</span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteOverlayMedia}
                      >
                        Delete
                      </Button>
                    </div>

                    {!watch("overlayMedia").type.startsWith("audio/") && (
                      <MediaPositioner
                        media={watch("overlayMedia")}
                        onPositionChange={handleMediaPositionChange}
                        initialPosition={watch("overlayMedia").position}
                      />
                    )}

                    <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
                      {watch("overlayMedia").type.startsWith("video/") ? (
                        <video
                          src={watch("overlayMedia").url}
                          className="w-full h-full object-contain"
                          controls
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : watch("overlayMedia").type.startsWith("audio/") ? (
                        <div className="flex flex-col items-center justify-center h-full">
                          <Music
                            size={48}
                            className="text-muted-foreground mb-2"
                          />
                          <audio
                            src={watch("overlayMedia").url}
                            controls
                            className="w-3/4"
                            preload="metadata"
                          >
                            Your browser does not support the audio tag.
                          </audio>
                        </div>
                      ) : (
                        <img
                          src={watch("overlayMedia").url}
                          className="w-full h-full object-contain"
                          alt="Overlay Media"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <MediaUpload
                    onMediaSelected={(mediaData) => {
                      setValue(
                        "overlayDuration",
                        Math.ceil(mediaData.duration ?? 5)
                      );
                      setValue("overlayMedia", {
                        file: mediaData.file,
                        url: mediaData.url,
                        duration: mediaData.duration ?? 5,
                        name: mediaData.name,
                        type: mediaData.type,
                        position: {
                          x: 32,
                          y: 18,
                          width: 160,
                          height: 90,
                        },
                      });
                      setValue(
                        "overlayMediaType",
                        mediaData.type.startsWith("video/") ? "video" : "image"
                      );
                    }}
                    currentMedia={watch("overlayMedia")}
                  />
                )}
              </div>

              {watch("overlayMedia") && (
                <>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register("pauseMainVideo")}
                      id="pauseMainVideo"
                    />
                    <label htmlFor="pauseMainVideo" className="text-sm">
                      Pause Main Video
                    </label>
                  </div>

                  {watch("pauseMainVideo") && (
                    <>
                      {(watch("overlayMedia").type.startsWith("video/") ||
                        watch("overlayMedia").type === "image/gif") && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            {...register("useOverlayDuration")}
                            id="useOverlayDuration"
                          />
                          <label htmlFor="useOverlayDuration" className="text-sm">
                            Pause for ful media file duration
                          </label>
                        </div>
                      )}

                      {!watch("useOverlayDuration") && (
                        <div>
                          <label className="text-sm text-muted-foreground">
                            Pause Duration (seconds)
                          </label>
                          <Input
                            type="number"
                            step="0.1"
                            {...register("pauseDuration", {
                              required: true,
                              min: 0,
                              valueAsNumber: true,
                            })}
                            disabled={watch("useOverlayDuration")}
                          />
                          {errors.pauseDuration && (
                            <span className="text-xs text-destructive">
                              This field is required
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {watch("overlayMedia").type.startsWith("video/") && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...register("muteOverlayMedia")}
                        id="muteOverlayMedia"
                      />
                      <label htmlFor="muteOverlayMedia" className="text-sm">
                        Mute Overlay Media
                      </label>
                    </div>
                  )}
                </>
              )}

              {!watch("useOverlayDuration") && watch("overlayMedia") && (
                <div>
                  <label className="text-sm text-muted-foreground">
                    Overlay Duration (seconds)
                  </label>
                  <Input
                    type="number"
                    {...register("overlayDuration", {
                      required: true,
                      min: 1,
                    })}
                  />
                  {errors.overlayDuration && (
                    <span className="text-xs text-destructive">
                      This field is required
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedType === "skip" && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Skip to Time
              </label>
              <TimeInput
                value={parseTimeInput({
                  hours: watch("skipToHours") || 0,
                  minutes: watch("skipToMinutes") || 0,
                  seconds: watch("skipToSeconds") || 0,
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
