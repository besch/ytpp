import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm, FormProvider } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
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
import { api } from "@/lib/api";
import {
  Instruction,
  SkipInstruction,
  TimeInput as TimeInputInterface,
  OverlayInstruction,
  TextOverlayInstruction,
} from "@/types";
import InstructionsList from "./InstructionsList";
import { MediaPosition } from "./MediaPositioner";
import OverlayInstructionForm from "./OverlayInstructionForm";
import SkipInstructionForm from "./SkipInstructionForm";
import TextOverlayInstructionForm from "./TextOverlayInstructionForm";

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

  const methods = useForm<any>({
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

      methods.setValue("hours", hours, { shouldValidate: false });
      methods.setValue("minutes", minutes, { shouldValidate: false });
      methods.setValue("seconds", seconds, { shouldValidate: false });

      if (editingInstruction.type === "overlay") {
        const overlayInstruction = editingInstruction as OverlayInstruction;
        methods.setValue(
          "pauseMainVideo",
          overlayInstruction.pauseMainVideo || false
        );
        methods.setValue("pauseDuration", overlayInstruction.pauseDuration);
        methods.setValue(
          "useOverlayDuration",
          overlayInstruction.useOverlayDuration || false
        );
        methods.setValue(
          "muteOverlayMedia",
          overlayInstruction.muteOverlayMedia || false
        );
        methods.setValue(
          "overlayDuration",
          overlayInstruction.overlayMedia?.duration || 5
        );

        const overlayMedia = overlayInstruction.overlayMedia;
        if (overlayMedia) {
          methods.setValue("overlayMedia", {
            url: overlayMedia.url,
            duration: overlayMedia.duration,
            name: overlayMedia.name,
            type: overlayMedia.type || "video/mp4",
            position: overlayMedia.position,
          });
          methods.setValue(
            "overlayMediaType",
            (overlayMedia.type || "video/mp4").startsWith("video/")
              ? "video"
              : "image"
          );
        } else {
          methods.setValue("overlayMedia", null);
        }
      } else if (editingInstruction.type === "skip") {
        const skipToTime =
          (editingInstruction as SkipInstruction).skipToTime / 1000;
        const skipHours = Math.floor(skipToTime / 3600);
        const skipMinutes = Math.floor((skipToTime % 3600) / 60);
        const skipSeconds = Math.floor(skipToTime % 60);

        methods.setValue("skipToHours", skipHours);
        methods.setValue("skipToMinutes", skipMinutes);
        methods.setValue("skipToSeconds", skipSeconds);
      } else if (editingInstruction.type === "text-overlay") {
        const textOverlayInstruction =
          editingInstruction as TextOverlayInstruction;

        // Set text overlay values
        methods.setValue("textOverlay", {
          text: textOverlayInstruction.textOverlay.text,
          style: {
            fontFamily: textOverlayInstruction.textOverlay.style.fontFamily,
            fontSize: textOverlayInstruction.textOverlay.style.fontSize,
            color: textOverlayInstruction.textOverlay.style.color,
            backgroundColor:
              textOverlayInstruction.textOverlay.style.backgroundColor ||
              "#000000",
            fontWeight: textOverlayInstruction.textOverlay.style.fontWeight,
            fontStyle:
              textOverlayInstruction.textOverlay.style.fontStyle || "normal",
            transparentBackground:
              textOverlayInstruction.textOverlay.style.transparentBackground ||
              false,
          },
          position: textOverlayInstruction.textOverlay.position || {
            x: 32,
            y: 18,
            width: 160,
            height: 90,
          },
        });

        methods.setValue("duration", textOverlayInstruction.duration);
        methods.setValue("pauseMainVideo", textOverlayInstruction.pauseMainVideo || false);
      }
    }
  }, [isEditing, editingInstruction, methods]);

  // Sync form inputs with currentTime when not editing
  useEffect(() => {
    if (!isEditing && selectedType === null) {
      const totalSeconds = currentTime / 1000;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);

      methods.setValue("hours", hours);
      methods.setValue("minutes", minutes);
      methods.setValue("seconds", seconds);
    }
  }, [currentTime, isEditing, selectedType, methods]);

  // Disable pauseDuration input based on useOverlayDuration
  useEffect(() => {
    if (methods.watch("useOverlayDuration")) {
      // If useOverlayDuration is checked, disable pauseDuration input
      methods.setValue(
        "pauseDuration",
        methods.watch("overlayMedia")?.duration || 0
      );
    }
  }, [
    methods.watch("useOverlayDuration"),
    methods.watch("overlayMedia"),
    methods,
  ]);

  // Add this new effect to watch for trigger time updates
  useEffect(() => {
    const subscription = methods.watch((value, { name, type }) => {
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
  }, [methods.watch, isEditing, editingInstruction, instructions]);

  const handleBack = () => {
    // Reset form values including media state
    methods.reset({
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
    } else if (selectedType === "text-overlay") {
      newInstruction = {
        id: editingInstruction?.id || Date.now().toString(),
        type: "text-overlay",
        triggerTime,
        textOverlay: data.textOverlay,
        duration: Number(data.duration),
        pauseMainVideo: data.pauseMainVideo,
      } as TextOverlayInstruction;
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
    methods.reset();
    dispatch(setEditingInstruction(null));
  };

  const handleDeleteOverlayMedia = async () => {
    const mediaURL = methods.watch("overlayMedia")?.url;
    if (mediaURL) {
      try {
        await api.timelines.deleteMedia(mediaURL);
      } catch (error) {
        console.error("Failed to delete overlay media:", error);
      }
    }

    methods.setValue("overlayMedia", null);

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

    methods.setValue("hours", hours);
    methods.setValue("minutes", minutes);
    methods.setValue("seconds", seconds);
  };

  const handleSkipToTimeChange = (time: number) => {
    const totalSeconds = time / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    methods.setValue("skipToHours", hours);
    methods.setValue("skipToMinutes", minutes);
    methods.setValue("skipToSeconds", seconds);
  };

  // Add this effect to reset form when editingInstruction changes
  useEffect(() => {
    if (!editingInstruction) {
      // Reset form values when not editing
      methods.reset({
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
  }, [editingInstruction, currentTime, methods]);

  useEffect(() => {
    const overlayMedia = methods.watch("overlayMedia");
    if (overlayMedia?.type?.startsWith("video/")) {
      methods.setValue("useOverlayDuration", true);
    }
  }, [methods.watch("overlayMedia"), methods]);

  const handleMediaPositionChange = (position: MediaPosition) => {
    const overlayMedia = methods.watch("overlayMedia");
    if (overlayMedia) {
      methods.setValue("overlayMedia", {
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

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Trigger Time
              </label>
              <TimeInput
                value={parseTimeInput({
                  hours: methods.watch("hours") || 0,
                  minutes: methods.watch("minutes") || 0,
                  seconds: methods.watch("seconds") || 0,
                })}
                onChange={handleTimeChange}
              />
            </div>

            {selectedType === "overlay" && (
              <OverlayInstructionForm
                onMediaDelete={handleDeleteOverlayMedia}
                onMediaSelected={(mediaData) => {
                  methods.setValue(
                    "overlayDuration",
                    Math.ceil(mediaData.duration ?? 5)
                  );
                  methods.setValue("overlayMedia", {
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
                  methods.setValue(
                    "overlayMediaType",
                    mediaData.type.startsWith("video/") ? "video" : "image"
                  );
                }}
                onPositionChange={handleMediaPositionChange}
              />
            )}

            {selectedType === "skip" && (
              <SkipInstructionForm onTimeChange={handleSkipToTimeChange} />
            )}

            {selectedType === "text-overlay" && (
              <TextOverlayInstructionForm
                onPositionChange={(position) => {
                  methods.setValue("textOverlay.position", position);
                }}
              />
            )}

            <Button type="submit" className="w-full">
              {isEditing ? "Update Instruction" : "Add Instruction"}
            </Button>
          </form>
        </FormProvider>
      </div>
    );
  };

  return <div className="p-6">{renderForm()}</div>;
};

export default InstructionEditor;
