import React, { useEffect, useState } from "react";
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
  seekToTime,
  removeInstruction,
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
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { isEqual } from "lodash";
import { Trash2 } from "lucide-react";

const InstructionEditor: React.FC = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const currentTime = useSelector(selectCurrentTime);
  const editingInstruction = useSelector(selectEditingInstruction);
  const instructions = useSelector(selectInstructions);
  const currentTimeline = useSelector(selectCurrentTimeline);
  const navigate = useNavigate();
  const { id: timelineId } = useParams();

  const isEditing = editingInstruction !== null && "id" in editingInstruction;
  const selectedType = editingInstruction?.type || null;

  const parseTimeInput = (data: TimeInputInterface) => {
    return (
      (Number(data.hours) * 3600 +
        Number(data.minutes) * 60 +
        Number(data.seconds)) *
        1000 +
      Number(data.milliseconds || 0)
    );
  };

  const methods = useForm<any>({
    defaultValues: {
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
      overlayDuration: 5,
      useOverlayDuration: false,
      muteOverlayMedia: false,
      pauseMainVideo: false,
      overlayMediaType: "video",
      skipToHours: 0,
      skipToMinutes: 0,
      skipToSeconds: 0,
      skipToMilliseconds: 0,
    },
  });

  const [formChanged, setFormChanged] = useState(false);
  const [initialValues, setInitialValues] = useState<any>(null);

  useEffect(() => {
    if (isEditing && editingInstruction) {
      const totalSeconds = Math.floor(editingInstruction.triggerTime / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      const milliseconds = editingInstruction.triggerTime % 1000;

      methods.setValue("hours", hours, { shouldValidate: false });
      methods.setValue("minutes", minutes, { shouldValidate: false });
      methods.setValue("seconds", seconds, { shouldValidate: false });
      methods.setValue("milliseconds", milliseconds, { shouldValidate: false });

      if (editingInstruction.type === "overlay") {
        const overlayInstruction = editingInstruction as OverlayInstruction;
        methods.setValue(
          "pauseMainVideo",
          overlayInstruction.pauseMainVideo || false
        );
        methods.setValue(
          "overlayDuration",
          overlayInstruction.overlayDuration || 5
        );
        methods.setValue(
          "muteOverlayMedia",
          overlayInstruction.muteOverlayMedia || false
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
        methods.setValue("skipToMilliseconds", skipToTime % 1000);
      } else if (editingInstruction.type === "text-overlay") {
        const textOverlayInstruction =
          editingInstruction as TextOverlayInstruction;

        // Set text overlay values with all properties
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
            // Add new properties
            textAlign:
              textOverlayInstruction.textOverlay.style.textAlign || "center",
            opacity: textOverlayInstruction.textOverlay.style.opacity || 1,
            animation:
              textOverlayInstruction.textOverlay.style.animation || "none",
            textShadow:
              textOverlayInstruction.textOverlay.style.textShadow || false,
            borderRadius:
              textOverlayInstruction.textOverlay.style.borderRadius || 0,
            padding: textOverlayInstruction.textOverlay.style.padding || 8,
          },
          position: textOverlayInstruction.textOverlay.position || {
            x: 32,
            y: 18,
            width: 160,
            height: 90,
          },
        });

        methods.setValue(
          "overlayDuration",
          textOverlayInstruction.overlayDuration
        );
        methods.setValue(
          "pauseMainVideo",
          textOverlayInstruction.pauseMainVideo
        );
      }
    } else if (selectedType) {
      // Initialize new instruction with current time
      const totalSeconds = Math.floor(currentTime / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      const milliseconds = currentTime % 1000;

      methods.setValue("hours", hours, { shouldValidate: false });
      methods.setValue("minutes", minutes, { shouldValidate: false });
      methods.setValue("seconds", seconds, { shouldValidate: false });
      methods.setValue("milliseconds", milliseconds, { shouldValidate: false });
    }
  }, [isEditing, editingInstruction, selectedType, currentTime, methods]);

  // Sync form inputs with currentTime when not editing
  useEffect(() => {
    if (!isEditing && selectedType === null) {
      const totalSeconds = Math.floor(currentTime / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      const milliseconds = currentTime % 1000;

      methods.setValue("hours", hours);
      methods.setValue("minutes", minutes);
      methods.setValue("seconds", seconds);
      methods.setValue("milliseconds", milliseconds);
    }
  }, [currentTime, isEditing, selectedType, methods]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const subscription = methods.watch((value, { name, type }) => {
      // Only update if it's a time-related field
      if (name?.match(/^(hours|minutes|seconds|milliseconds)$/)) {
        // Clear any existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Set a new timeout to batch updates
        timeoutId = setTimeout(() => {
          const triggerTime = parseTimeInput({
            hours: value.hours || 0,
            minutes: value.minutes || 0,
            seconds: value.seconds || 0,
            milliseconds: value.milliseconds || 0,
          });

          // Only update Redux state, don't save to database
          dispatch(seekToTime(triggerTime));
        }, 300); // Wait 300ms before sending update
      }
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [methods.watch, dispatch]);

  const handleBack = () => {
    // Prefetch timelines before navigating
    queryClient.prefetchQuery({
      queryKey: ["timelines", window.location.href.split("&")[0]],
      queryFn: () => api.timelines.getAll(window.location.href.split("&")[0]),
    });

    methods.reset({
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
      pauseDuration: 0,
      useOverlayDuration: false,
      muteOverlayMedia: false,
      overlayMedia: null,
      skipToHours: 0,
      skipToMinutes: 0,
      skipToSeconds: 0,
      skipToMilliseconds: 0,
      overlayMediaType: "video",
    });
    dispatch(setEditingInstruction(null));
    navigate(`/timeline/${timelineId}`);
  };

  // Mutation for saving instructions
  const saveInstructionsMutation = useMutation({
    mutationFn: async (updatedInstructions: Instruction[]) => {
      if (!currentTimeline) throw new Error("No timeline selected");

      const updatedTimeline = {
        ...currentTimeline,
        instructions: updatedInstructions,
      };

      return api.timelines.update(currentTimeline.id, updatedTimeline);
    },
    onSuccess: (savedTimeline) => {
      dispatch(setCurrentTimeline(savedTimeline));
      queryClient.invalidateQueries({ queryKey: ["timelines"] });
    },
    onError: (error) => {
      console.error("Failed to save instructions:", error);
    },
  });

  // Mutation for media upload
  const uploadMediaMutation = useMutation({
    mutationFn: async ({
      file,
      timelineId,
    }: {
      file: File;
      timelineId: string;
    }) => {
      return api.timelines.uploadMedia(file, timelineId);
    },
    onError: (error) => {
      console.error("Failed to upload media:", error);
    },
  });

  // Mutation for media deletion
  const deleteMediaMutation = useMutation({
    mutationFn: (url: string) => api.timelines.deleteMedia(url),
    onError: (error) => {
      console.error("Failed to delete media:", error);
    },
  });

  // Update the title mutation
  const updateTitleMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      return api.timelines.update(id, { title });
    },
    onSuccess: (savedTimeline) => {
      dispatch(setCurrentTimeline(savedTimeline));
      queryClient.invalidateQueries({ queryKey: ["timelines"] });
    },
    onError: (error) => {
      console.error("Failed to update timeline title:", error);
    },
  });

  // Add this mutation near your other mutations
  const deleteInstructionMutation = useMutation({
    mutationFn: async (instruction: Instruction) => {
      if (instruction.type === "overlay") {
        const overlayInstruction = instruction as OverlayInstruction;
        if (overlayInstruction.overlayMedia?.url) {
          await api.timelines.deleteMedia(overlayInstruction.overlayMedia.url);
        }
      }

      const updatedInstructions = instructions.filter(
        (inst) => inst.id !== instruction.id
      );

      return api.timelines.update(currentTimeline!.id, {
        ...currentTimeline!,
        instructions: updatedInstructions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timelines"] });
    }
  });

  const handleSaveInstructions = async (updatedInstructions: Instruction[]) => {
    await saveInstructionsMutation.mutateAsync(updatedInstructions);
  };

  const handleDeleteOverlayMedia = () => {
    const mediaURL = methods.watch("overlayMedia")?.url;
    if (
      !mediaURL ||
      !editingInstruction ||
      editingInstruction.type !== "overlay"
    )
      return;

    // Store the URL to be deleted when saving
    const mediaToDelete = mediaURL;

    // Update form state
    methods.setValue("overlayMedia", null);
    methods.setValue("useOverlayDuration", false);
    methods.setValue("overlayDuration", 5);

    // Update Redux state
    dispatch(
      setEditingInstruction({
        ...editingInstruction,
        overlayMedia: null,
        useOverlayDuration: false,
      } as OverlayInstruction)
    );

    // Store the URL to be deleted in the form data
    methods.setValue("mediaToDelete", mediaToDelete);
  };

  const onSubmit = async (data: any) => {
    try {
      const triggerTime = parseTimeInput({
        hours: data.hours || 0,
        minutes: data.minutes || 0,
        seconds: data.seconds || 0,
        milliseconds: data.milliseconds || 0,
      });

      let newInstruction: Instruction;

      if (selectedType === "text-overlay") {
        newInstruction = {
          id: editingInstruction?.id || Date.now().toString(),
          type: "text-overlay",
          triggerTime,
          textOverlay: {
            text: data.textOverlay.text,
            style: {
              fontFamily: data.textOverlay.style.fontFamily,
              fontSize: Number(data.textOverlay.style.fontSize),
              color: data.textOverlay.style.color,
              backgroundColor: data.textOverlay.style.backgroundColor,
              fontWeight: data.textOverlay.style.fontWeight,
              fontStyle: data.textOverlay.style.fontStyle,
              transparentBackground:
                data.textOverlay.style.transparentBackground,
              // Add new properties
              textAlign: data.textOverlay.style.textAlign,
              opacity: Number(data.textOverlay.style.opacity),
              animation: data.textOverlay.style.animation,
              textShadow: data.textOverlay.style.textShadow,
              borderRadius: Number(data.textOverlay.style.borderRadius),
              padding: Number(data.textOverlay.style.padding),
            },
            position: data.textOverlay.position,
          },
          overlayDuration: Number(data.overlayDuration),
          pauseMainVideo: data.pauseMainVideo,
          pauseDuration: data.pauseMainVideo
            ? Number(data.pauseDuration)
            : undefined,
        } as TextOverlayInstruction;
      } else if (selectedType === "overlay") {
        let overlayMedia = data.overlayMedia;
        let mediaURL;

        // Handle media deletion first if there's a file to delete
        if (data.mediaToDelete && !data.mediaToDelete.startsWith("blob:")) {
          try {
            await deleteMediaMutation.mutateAsync(data.mediaToDelete);
          } catch (error) {
            console.error("Failed to delete old media:", error);
          }
        }

        // If there's a new file to upload
        if (data.overlayMedia?.file) {
          try {
            const uploadResult = await uploadMediaMutation.mutateAsync({
              file: data.overlayMedia.file,
              timelineId: currentTimeline!.id,
            });
            mediaURL = uploadResult.url;

            overlayMedia = {
              url: mediaURL,
              duration: data.overlayMedia.duration,
              name: data.overlayMedia.name,
              type: data.overlayMedia.type,
              position: data.overlayMedia.position,
            };
          } catch (error) {
            console.error("Failed to upload new media:", error);
            return;
          }
        }

        // If media was deleted and no new file was uploaded
        if (data.mediaToDelete && !data.overlayMedia?.file) {
          overlayMedia = null;
        }

        newInstruction = {
          id: editingInstruction?.id || Date.now().toString(),
          type: "overlay",
          triggerTime,
          overlayMedia,
          overlayDuration: data.overlayDuration,
          pauseMainVideo: data.pauseMainVideo,
          muteOverlayMedia: data.muteOverlayMedia || false,
        } as OverlayInstruction;
      } else if (selectedType === "skip") {
        const skipToTime = parseTimeInput({
          hours: data.skipToHours || 0,
          minutes: data.skipToMinutes || 0,
          seconds: data.skipToSeconds || 0,
          milliseconds: data.skipToMilliseconds || 0,
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

      // Save to database
      await handleSaveInstructions(updatedInstructions);

      dispatch(setCurrentTime(triggerTime));

      // Reset form state but don't navigate away
      setFormChanged(false);
      setInitialValues(data);

      // If this was a new instruction, update the editing state to reflect we're now editing it
      if (!isEditing) {
        dispatch(setEditingInstruction(newInstruction));
      }
    } catch (error) {
      console.error("Failed to save instruction:", error);
    }
  };

  const handleSkipToTimeChange = (time: number) => {
    const totalSeconds = Math.floor(time / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = time % 1000;

    methods.setValue("skipToHours", hours);
    methods.setValue("skipToMinutes", minutes);
    methods.setValue("skipToSeconds", seconds);
    methods.setValue("skipToMilliseconds", milliseconds);
  };

  // Add this effect to reset form when editingInstruction changes
  useEffect(() => {
    if (!editingInstruction) {
      // Reset form values when not editing
      methods.reset({
        hours: Math.floor(currentTime / 1000 / 3600),
        minutes: Math.floor(((currentTime / 1000) % 3600) / 60),
        seconds: Math.floor((currentTime / 1000) % 60),
        milliseconds: 0,
        pauseDuration: 0,
        useOverlayDuration: false,
        muteOverlayMedia: false,
        overlayMedia: null,
        skipToHours: 0,
        skipToMinutes: 0,
        skipToSeconds: 0,
        skipToMilliseconds: 0,
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
      setFormChanged(true);
    }
  };

  const handleTimeChange = (time: number) => {
    const totalSeconds = Math.floor(time / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = time % 1000;

    methods.setValue("hours", hours);
    methods.setValue("minutes", minutes);
    methods.setValue("seconds", seconds);
    methods.setValue("milliseconds", milliseconds);

    dispatch(seekToTime(time));
  };

  // Add this effect to store initial values when editing starts
  useEffect(() => {
    if (isEditing && editingInstruction) {
      const values = methods.getValues();

      // For text overlay instructions, we need to store the complete structure
      if (editingInstruction.type === "text-overlay") {
        const textOverlayInstruction =
          editingInstruction as TextOverlayInstruction;
        setInitialValues({
          ...values,
          triggerTime: editingInstruction.triggerTime,
          textOverlay: {
            text: textOverlayInstruction.textOverlay.text,
            style: {
              ...textOverlayInstruction.textOverlay.style,
            },
            position: textOverlayInstruction.textOverlay.position,
          },
          overlayDuration: textOverlayInstruction.overlayDuration,
          pauseMainVideo: textOverlayInstruction.pauseMainVideo,
        });
      } else {
        setInitialValues(values);
      }
      setFormChanged(false);
    }
  }, [isEditing, editingInstruction, methods]);

  // Update the form change detection
  useEffect(() => {
    if (!initialValues) return;

    const subscription = methods.watch((value) => {
      const currentValues = methods.getValues();

      // Special handling for text overlay instructions
      if (selectedType === "text-overlay") {
        // Check if any text overlay related fields have changed
        const hasTextOverlayChanges =
          methods.formState.dirtyFields._formChanged ||
          methods.formState.dirtyFields.textOverlay ||
          methods.formState.dirtyFields.duration ||
          methods.formState.dirtyFields.pauseMainVideo ||
          methods.formState.dirtyFields.pauseDuration;

        setFormChanged(hasTextOverlayChanges);
      } else if (selectedType === "overlay") {
        // For overlay instructions, also check mediaToDelete
        const hasChanges =
          !isEqual(currentValues, initialValues) ||
          currentValues.mediaToDelete !== undefined;
        setFormChanged(hasChanges);
      } else {
        // For other instruction types, use the existing comparison
        const hasChanges = !isEqual(currentValues, initialValues);
        setFormChanged(hasChanges);
      }
    });

    return () => subscription.unsubscribe();
  }, [methods, initialValues, selectedType]);

  // Update the handleCancel function
  const handleCancel = () => {
    if (initialValues) {
      // Reset the form with the initial values
      methods.reset(initialValues, {
        keepDefaultValues: true,
      });

      // For text overlay instructions, we need to explicitly reset nested fields
      if (selectedType === "text-overlay") {
        const textOverlay = initialValues.textOverlay;
        if (textOverlay) {
          methods.setValue("textOverlay", {
            text: textOverlay.text,
            style: {
              fontFamily: textOverlay.style.fontFamily,
              fontSize: textOverlay.style.fontSize,
              color: textOverlay.style.color,
              backgroundColor: textOverlay.style.backgroundColor,
              fontWeight: textOverlay.style.fontWeight,
              fontStyle: textOverlay.style.fontStyle,
              transparentBackground: textOverlay.style.transparentBackground,
              textAlign: textOverlay.style.textAlign,
              opacity: textOverlay.style.opacity,
              animation: textOverlay.style.animation,
              textShadow: textOverlay.style.textShadow,
              borderRadius: textOverlay.style.borderRadius,
              padding: textOverlay.style.padding,
            },
            position: textOverlay.position,
          });
        }

        // Reset trigger time fields
        const totalSeconds = Math.floor(initialValues.triggerTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const milliseconds = initialValues.triggerTime % 1000;

        methods.setValue("hours", hours);
        methods.setValue("minutes", minutes);
        methods.setValue("seconds", seconds);
        methods.setValue("milliseconds", milliseconds);

        // Reset other fields
        methods.setValue("duration", initialValues.duration);
        methods.setValue("pauseMainVideo", initialValues.pauseMainVideo);
        methods.setValue("pauseDuration", initialValues.pauseDuration);
      }

      methods.setValue("_formChanged", undefined, { shouldDirty: false });
      setFormChanged(false);
    }
  };

  const handleDelete = async () => {
    if (!editingInstruction || !currentTimeline) return;

    try {
      await deleteInstructionMutation.mutateAsync(editingInstruction);
      dispatch(setEditingInstruction(null));
      dispatch(removeInstruction(editingInstruction.id));
      navigate(`/timeline/${timelineId}`);
    } catch (error) {
      console.error("Failed to delete instruction:", error);
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
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-medium">
            {isEditing ? "Edit Instruction" : "Add Instruction"}
          </h1>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-lg text-muted-foreground">
                Trigger Time
              </label>
              <TimeInput
                value={parseTimeInput({
                  hours: methods.watch("hours") || 0,
                  minutes: methods.watch("minutes") || 0,
                  seconds: methods.watch("seconds") || 0,
                  milliseconds: methods.watch("milliseconds") || 0,
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
                  setFormChanged(true);
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

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={!formChanged}>
                {isEditing ? "Update Instruction" : "Add Instruction"}
              </Button>
              {isEditing && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancel}
                    disabled={!formChanged}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="px-3"
                    onClick={handleDelete}
                  >
                    <Trash2 size={16} />
                  </Button>
                </>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    );
  };

  return (
    <div className="p-6">
      {renderForm()}
      {(saveInstructionsMutation.isPending ||
        uploadMediaMutation.isPending ||
        deleteMediaMutation.isPending ||
        updateTitleMutation.isPending ||
        deleteInstructionMutation.isPending) && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </div>
  );
};

export default InstructionEditor;
