import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm, FormProvider } from "react-hook-form";
import {
  selectCurrentTime,
  setCurrentTime,
  setEditingInstruction,
  selectEditingInstruction,
  selectInstructions,
  selectCurrentTimeline,
  updateInstruction,
} from "@/store/timelineSlice";
import { useAPI } from "@/hooks/useAPI";
import { useVideoManager } from "@/hooks/useVideoManager";
import {
  InstructionResponse,
  InstructionWithOriginalTimes,
  Instruction,
} from "@/types";
import { MediaPosition } from "./MediaPositioner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { isEqual } from "lodash";
import InstructionForm from "./InstructionForm";
import config from "@/lib/config";
import { VideoManager } from "@/lib/VideoManager";

const getInstructionTitle = (type: string): string => {
  switch (type) {
    case "pause":
      return "Pause";
    case "skip":
      return "Skip";
    case "overlay":
      return "Media";
    case "text-overlay":
      return "Text";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

const InstructionEditor: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const api = useAPI();
  const queryClient = useQueryClient();
  const currentTime = useSelector(selectCurrentTime);
  const editingInstruction = useSelector(
    selectEditingInstruction
  ) as InstructionWithOriginalTimes | null;
  const instructions = useSelector(selectInstructions);
  const currentTimeline = useSelector(selectCurrentTimeline);
  const { id: timelineId } = useParams();
  const videoManager = useVideoManager();

  const isEditing = editingInstruction !== null && "id" in editingInstruction;
  const selectedType = editingInstruction?.data?.type || null;

  const methods = useForm<any>({
    defaultValues: {
      hours: Math.floor(currentTime / 1000 / 3600),
      minutes: Math.floor(((currentTime / 1000) % 3600) / 60),
      seconds: Math.floor((currentTime / 1000) % 60),
      milliseconds: currentTime % 1000,
      useOverlayDuration: false,
      muteOverlayMedia: false,
      pauseMainVideo: false,
      overlayMediaType: "video",
      skipToHours: Math.floor((currentTime + 3000) / 1000 / 3600),
      skipToMinutes: Math.floor((((currentTime + 3000) / 1000) % 3600) / 60),
      skipToSeconds: Math.floor(((currentTime + 3000) / 1000) % 60),
      skipToMilliseconds: (currentTime + 3000) % 1000,
    },
  });

  const [formChanged, setFormChanged] = useState(false);
  const [initialValues, setInitialValues] = useState<any>(null);
  const [originalTriggerTime, setOriginalTriggerTime] = useState<number | null>(
    null
  );
  const [originalSkipToTime, setOriginalSkipToTime] = useState<number | null>(
    null
  );

  // Add mutation for instruction updates
  const updateInstructionMutation = useMutation({
    mutationFn: async (instruction: Instruction) => {
      if (isEditing) {
        return api.instructions.update(instruction.id!, instruction);
      } else {
        return api.instructions.create(
          currentTimeline!.id.toString(),
          instruction
        );
      }
    },
  });

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

    if (videoManager) {
      videoManager.seekTo(time);
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

  // Mutation for media upload
  const uploadMediaMutation = useMutation({
    mutationFn: async ({
      file,
      timelineId,
    }: {
      file: File;
      timelineId: number;
    }) => {
      return api.timelines.uploadMedia(file, timelineId);
    },
    onError: (error) => {
      console.error("Failed to upload media:", error);
    },
  });

  // Mutation for media deletion
  const deleteMediaMutation = useMutation({
    mutationFn: (url: string) =>
      api.timelines.deleteMedia(url, Number(timelineId)),
    onError: (error) => {
      console.error("Failed to delete media:", error);
    },
  });

  const handleInstructionSubmit = async (
    newInstruction: InstructionResponse
  ) => {
    try {
      // Clean up any active instances of this instruction in VideoManager
      const videoManager = (window as any).videoManager as
        | VideoManager
        | undefined;
      if (videoManager && editingInstruction?.id) {
        videoManager.hideInstruction(editingInstruction.id);
      }

      // Remove _originalTriggerTime before saving
      const { _originalTriggerTime, ...baseInstruction } =
        newInstruction as InstructionWithOriginalTimes;

      // Ensure type is properly narrowed
      const instructionToSave = {
        ...baseInstruction,
        data: {
          ...baseInstruction.data,
          type: baseInstruction.data.type as
            | "overlay"
            | "text-overlay"
            | "skip",
        },
      } as Instruction;

      await updateInstructionMutation.mutateAsync(instructionToSave);

      dispatch(setCurrentTime(instructionToSave.data.triggerTime));

      // Reset form state
      setFormChanged(false);
      setInitialValues(methods.getValues());

      // Reset editing state and redirect to instruction list
      dispatch(setEditingInstruction(null));

      // Invalidate queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ["instructions"] });

      navigate(`/timeline/${timelineId}`);
    } catch (error) {
      console.error("Failed to save instruction:", error);
    }
  };

  const handleDeleteOverlayMedia = () => {
    const mediaURL = methods.watch("overlayMedia")?.url;
    if (
      !mediaURL ||
      !editingInstruction ||
      editingInstruction.data.type !== "overlay"
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
        data: {
          ...editingInstruction.data,
          overlayMedia: undefined,
          useOverlayDuration: false,
        },
      } as InstructionResponse)
    );

    // Store the URL to be deleted in the form data
    methods.setValue("mediaToDelete", mediaToDelete);
  };

  // Add this effect to store initial values when editing starts
  useEffect(() => {
    if (isEditing && editingInstruction) {
      const values = methods.getValues();

      // For text overlay instructions, we need to store the complete structure
      if (editingInstruction.data.type === "text-overlay") {
        const textOverlayInstruction =
          editingInstruction as InstructionWithOriginalTimes;
        setInitialValues({
          ...values,
          triggerTime: editingInstruction.data.triggerTime,
          textOverlay: {
            text: textOverlayInstruction!.data!.textOverlay!.text,
            style: {
              ...textOverlayInstruction!.data!.textOverlay!.style,
            },
            position: textOverlayInstruction!.data!.textOverlay!.position,
          },
          overlayDuration: textOverlayInstruction!.data!.overlayDuration,
          pauseMainVideo: textOverlayInstruction!.data!.pauseMainVideo,
          pauseDuration: textOverlayInstruction!.data!.pauseDuration,
        });
      } else {
        setInitialValues(values);
      }
      setFormChanged(false);
    }
  }, [isEditing, editingInstruction, methods]);

  // Update the form change detection
  useEffect(() => {
    if (!initialValues) {
      // For new instructions, we should enable the button
      if (selectedType && !isEditing) {
        setFormChanged(true);
        return;
      }
      return;
    }

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
  }, [methods, initialValues, selectedType, isEditing]);

  // Update the handleCancel function
  const handleCancel = () => {
    if (
      editingInstruction &&
      (originalTriggerTime !== null || originalSkipToTime !== null)
    ) {
      let updatedInstruction: InstructionResponse = {
        ...editingInstruction,
        data: {
          ...editingInstruction.data,
        },
      };

      if (originalTriggerTime !== null) {
        updatedInstruction.data.triggerTime = originalTriggerTime;
      }

      if (
        originalSkipToTime !== null &&
        updatedInstruction.data.type === "skip"
      ) {
        updatedInstruction.data.skipToTime = originalSkipToTime;
      }

      dispatch(updateInstruction(updatedInstruction));
      dispatch(setEditingInstruction(null));
      navigate(`/timeline/${timelineId}`);
      return;
    }

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

        // Reset trigger time fields using editingInstruction's triggerTime
        if (editingInstruction) {
          const totalSeconds = Math.floor(
            editingInstruction.data.triggerTime / 1000
          );
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = Math.floor(totalSeconds % 60);
          const milliseconds = editingInstruction.data.triggerTime % 1000;

          methods.setValue("hours", hours);
          methods.setValue("minutes", minutes);
          methods.setValue("seconds", seconds);
          methods.setValue("milliseconds", milliseconds);
        }

        // Reset other fields
        methods.setValue("overlayDuration", initialValues.overlayDuration);
        methods.setValue("pauseMainVideo", initialValues.pauseMainVideo);
        methods.setValue("pauseDuration", initialValues.pauseDuration);
      }

      methods.setValue("_formChanged", undefined, { shouldDirty: false });
      setFormChanged(false);
    }
  };

  const handleBack = () => {
    dispatch(setEditingInstruction(null));
    navigate(`/timeline/${timelineId}`);
  };

  // Add this effect to update form time values when currentTime changes and we're not editing
  useEffect(() => {
    if (!isEditing) {
      const hours = Math.floor(currentTime / 1000 / 3600);
      const minutes = Math.floor(((currentTime / 1000) % 3600) / 60);
      const seconds = Math.floor((currentTime / 1000) % 60);
      const milliseconds = currentTime % 1000;

      methods.setValue("hours", hours);
      methods.setValue("minutes", minutes);
      methods.setValue("seconds", seconds);
      methods.setValue("milliseconds", milliseconds);
    }
  }, [currentTime, isEditing, methods]);

  // Add this effect to reset form when editingInstruction becomes null
  useEffect(() => {
    if (!editingInstruction) {
      // Reset form with current time values
      const hours = Math.floor(currentTime / 1000 / 3600);
      const minutes = Math.floor(((currentTime / 1000) % 3600) / 60);
      const seconds = Math.floor((currentTime / 1000) % 60);
      const milliseconds = currentTime % 1000;

      // Calculate skip time (current time + 3 seconds)
      const skipTime = currentTime + 3000;
      const skipHours = Math.floor(skipTime / 1000 / 3600);
      const skipMinutes = Math.floor(((skipTime / 1000) % 3600) / 60);
      const skipSeconds = Math.floor((skipTime / 1000) % 60);
      const skipMilliseconds = skipTime % 1000;

      methods.reset({
        hours,
        minutes,
        seconds,
        milliseconds,
        pauseDuration: 0,
        useOverlayDuration: false,
        muteOverlayMedia: false,
        overlayMedia: null,
        skipToHours: skipHours,
        skipToMinutes: skipMinutes,
        skipToSeconds: skipSeconds,
        skipToMilliseconds: skipMilliseconds,
        overlayMediaType: "video",
        overlayDuration: config.defaultOverlayDuration,
        textOverlay: null,
      });
      setFormChanged(false);
      setInitialValues(null);
    }
  }, [editingInstruction, currentTime, methods]);

  // Update the effect that handles editingInstruction changes
  useEffect(() => {
    if (isEditing && editingInstruction) {
      // Store original times if they exist from drag operation
      if ("_originalTriggerTime" in editingInstruction) {
        setOriginalTriggerTime(editingInstruction._originalTriggerTime ?? null);
      } else {
        // Set original time on first edit
        setOriginalTriggerTime(editingInstruction.data.triggerTime);
      }

      if (
        "_originalSkipToTime" in editingInstruction &&
        editingInstruction.data.type === "skip"
      ) {
        setOriginalSkipToTime(editingInstruction._originalSkipToTime ?? null);
      } else if (editingInstruction.data.type === "skip") {
        // Set original skip time on first edit
        setOriginalSkipToTime(editingInstruction.data.skipToTime ?? null);
      }

      // Update trigger time fields
      const triggerTotalSeconds = Math.floor(
        editingInstruction.data.triggerTime / 1000
      );
      const triggerHours = Math.floor(triggerTotalSeconds / 3600);
      const triggerMinutes = Math.floor((triggerTotalSeconds % 3600) / 60);
      const triggerSeconds = Math.floor(triggerTotalSeconds % 60);
      const triggerMilliseconds = editingInstruction.data.triggerTime % 1000;

      methods.setValue("hours", triggerHours, { shouldDirty: false });
      methods.setValue("minutes", triggerMinutes, { shouldDirty: false });
      methods.setValue("seconds", triggerSeconds, { shouldDirty: false });
      methods.setValue("milliseconds", triggerMilliseconds, {
        shouldDirty: false,
      });

      // If it's a skip instruction, update skipTo time fields
      if (editingInstruction.data.type === "skip") {
        const skipToTotalSeconds = Math.floor(
          editingInstruction.data.skipToTime! / 1000
        );
        const skipToHours = Math.floor(skipToTotalSeconds / 3600);
        const skipToMinutes = Math.floor((skipToTotalSeconds % 3600) / 60);
        const skipToSeconds = Math.floor(skipToTotalSeconds % 60);
        const skipToMilliseconds = editingInstruction.data.skipToTime! % 1000;

        methods.setValue("skipToHours", skipToHours, { shouldDirty: false });
        methods.setValue("skipToMinutes", skipToMinutes, {
          shouldDirty: false,
        });
        methods.setValue("skipToSeconds", skipToSeconds, {
          shouldDirty: false,
        });
        methods.setValue("skipToMilliseconds", skipToMilliseconds, {
          shouldDirty: false,
        });
      }

      // Check if times have changed from original values
      const hasTimeChanges =
        (originalTriggerTime !== null &&
          originalTriggerTime !== editingInstruction.data.triggerTime) ||
        (originalSkipToTime !== null &&
          editingInstruction.data.type === "skip" &&
          originalSkipToTime !== editingInstruction.data.skipToTime);

      setFormChanged(hasTimeChanges);
      setInitialValues(methods.getValues());
    }
  }, [isEditing, editingInstruction, originalTriggerTime, originalSkipToTime]);

  return (
    <div className="p-6 overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          {isEditing ? "Edit" : "New"}{" "}
          {selectedType ? getInstructionTitle(selectedType) : ""} Instruction
        </h1>
      </div>
      <FormProvider {...methods}>
        <InstructionForm
          isEditing={isEditing}
          editingInstruction={editingInstruction}
          selectedType={selectedType}
          currentTime={currentTime}
          onSubmit={handleInstructionSubmit}
          onBack={handleBack}
          onTimeChange={handleTimeChange}
          onSkipToTimeChange={handleSkipToTimeChange}
          onMediaPositionChange={handleMediaPositionChange}
          onMediaDelete={handleDeleteOverlayMedia}
          onCancel={handleCancel}
          formChanged={formChanged}
          uploadMedia={async (file: File) => {
            const uploadResult = await uploadMediaMutation.mutateAsync({
              file,
              timelineId: Number(currentTimeline!.id),
            });
            return uploadResult.url;
          }}
        />
      </FormProvider>
      {(uploadMediaMutation.isPending ||
        deleteMediaMutation.isPending ||
        updateInstructionMutation.isPending) && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </div>
  );
};

export default InstructionEditor;
