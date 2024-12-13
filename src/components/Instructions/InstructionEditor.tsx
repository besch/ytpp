import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
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
import { useAPI } from "@/hooks/useAPI";
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
import { useSkipInstructionForm } from "@/hooks/forms/useSkipInstructionForm";
import { useOverlayInstructionForm } from "@/hooks/forms/useOverlayInstructionForm";
import { useTextOverlayInstructionForm } from "@/hooks/forms/useTextOverlayInstructionForm";

const InstructionEditor: React.FC = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const currentTime = useSelector(selectCurrentTime);
  const editingInstruction = useSelector(selectEditingInstruction);
  const instructions = useSelector(selectInstructions);
  const currentTimeline = useSelector(selectCurrentTimeline);
  const navigate = useNavigate();
  const { id: timelineId } = useParams();
  const api = useAPI();

  const isEditing = editingInstruction !== null && "id" in editingInstruction;
  const selectedType = editingInstruction?.type || null;

  const methods = useForm<any>({
    defaultValues: {
      hours: Math.floor(currentTime / 1000 / 3600),
      minutes: Math.floor(((currentTime / 1000) % 3600) / 60),
      seconds: Math.floor((currentTime / 1000) % 60),
      milliseconds: currentTime % 1000,
      overlayDuration: 5,
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
    },
  });

  const handleSaveInstructions = async (updatedInstructions: Instruction[]) => {
    await saveInstructionsMutation.mutateAsync(updatedInstructions);
  };

  const handleInstructionSubmit = async (newInstruction: Instruction) => {
    try {
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

      dispatch(setCurrentTime(newInstruction.triggerTime));

      // Reset form state but don't navigate away
      setFormChanged(false);
      setInitialValues(methods.getValues());

      // If this was a new instruction, update the editing state to reflect we're now editing it
      if (!isEditing) {
        dispatch(setEditingInstruction(newInstruction));
      }
    } catch (error) {
      console.error("Failed to save instruction:", error);
    }
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
        overlayDuration: 5,
        textOverlay: null,
      });
      setFormChanged(false);
      setInitialValues(null);
    }
  }, [editingInstruction, currentTime, methods]);

  // Add this effect to update form values when editingInstruction changes
  useEffect(() => {
    if (isEditing && editingInstruction) {
      // Update trigger time fields
      const triggerTotalSeconds = Math.floor(
        editingInstruction.triggerTime / 1000
      );
      const triggerHours = Math.floor(triggerTotalSeconds / 3600);
      const triggerMinutes = Math.floor((triggerTotalSeconds % 3600) / 60);
      const triggerSeconds = Math.floor(triggerTotalSeconds % 60);
      const triggerMilliseconds = editingInstruction.triggerTime % 1000;

      methods.setValue("hours", triggerHours, { shouldDirty: false });
      methods.setValue("minutes", triggerMinutes, { shouldDirty: false });
      methods.setValue("seconds", triggerSeconds, { shouldDirty: false });
      methods.setValue("milliseconds", triggerMilliseconds, {
        shouldDirty: false,
      });

      // If it's a skip instruction, update skipTo time fields
      if (editingInstruction.type === "skip") {
        const skipToTotalSeconds = Math.floor(
          editingInstruction.skipToTime / 1000
        );
        const skipToHours = Math.floor(skipToTotalSeconds / 3600);
        const skipToMinutes = Math.floor((skipToTotalSeconds % 3600) / 60);
        const skipToSeconds = Math.floor(skipToTotalSeconds % 60);
        const skipToMilliseconds = editingInstruction.skipToTime % 1000;

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

      // Update initial values to prevent unnecessary form changes
      setInitialValues(methods.getValues());
      setFormChanged(false);
    }
  }, [
    isEditing,
    editingInstruction?.triggerTime,
    editingInstruction?.type === "skip" ? editingInstruction.skipToTime : null,
  ]);

  return (
    <div className="p-6 overflow-x-hidden">
      <FormProvider {...methods}>
        <InstructionForm
          isEditing={isEditing}
          editingInstruction={editingInstruction}
          selectedType={selectedType}
          currentTime={currentTime}
          onSubmit={handleInstructionSubmit}
          onBack={handleBack}
          onDelete={handleDelete}
          onTimeChange={handleTimeChange}
          onSkipToTimeChange={handleSkipToTimeChange}
          onMediaPositionChange={handleMediaPositionChange}
          onMediaDelete={handleDeleteOverlayMedia}
          onCancel={handleCancel}
          formChanged={formChanged}
          uploadMedia={async (file: File) => {
            const uploadResult = await uploadMediaMutation.mutateAsync({
              file,
              timelineId: currentTimeline!.id,
            });
            return uploadResult.url;
          }}
        />
      </FormProvider>
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

// Create a new component for the form content
interface InstructionFormProps {
  isEditing: boolean;
  editingInstruction: Instruction | null;
  selectedType: string | null;
  currentTime: number;
  onSubmit: (instruction: Instruction) => Promise<void>;
  onBack: () => void;
  onDelete: () => void;
  onTimeChange: (time: number) => void;
  onSkipToTimeChange: (time: number) => void;
  onMediaPositionChange: (position: MediaPosition) => void;
  onMediaDelete: () => void;
  onCancel: () => void;
  formChanged: boolean;
  uploadMedia: (file: File) => Promise<string>;
}

const InstructionForm: React.FC<InstructionFormProps> = ({
  isEditing,
  editingInstruction,
  selectedType,
  currentTime,
  onSubmit,
  onBack,
  onDelete,
  onTimeChange,
  onSkipToTimeChange,
  onMediaPositionChange,
  onMediaDelete,
  onCancel,
  formChanged,
  uploadMedia,
}) => {
  const methods = useFormContext();
  const skipForm = useSkipInstructionForm(currentTime);
  const overlayForm = useOverlayInstructionForm();
  const textOverlayForm = useTextOverlayInstructionForm();
  const [isInitialized, setIsInitialized] = useState(false);
  const previousInstructionId = useRef<string | null>(null);
  const currentTimeline = useSelector(selectCurrentTimeline);
  const navigate = useNavigate();

  // Reset form when switching between instructions
  useEffect(() => {
    if (editingInstruction?.id !== previousInstructionId.current) {
      // Reset form state
      methods.reset({
        hours: Math.floor(currentTime / 1000 / 3600),
        minutes: Math.floor(((currentTime / 1000) % 3600) / 60),
        seconds: Math.floor((currentTime / 1000) % 60),
        milliseconds: currentTime % 1000,
        overlayDuration: 5,
        useOverlayDuration: false,
        muteOverlayMedia: false,
        pauseMainVideo: false,
        overlayMedia: null,
        textOverlay: null,
        skipToHours: Math.floor((currentTime + 3000) / 1000 / 3600),
        skipToMinutes: Math.floor((((currentTime + 3000) / 1000) % 3600) / 60),
        skipToSeconds: Math.floor(((currentTime + 3000) / 1000) % 60),
        skipToMilliseconds: (currentTime + 3000) % 1000,
      });

      setIsInitialized(false);
      previousInstructionId.current = editingInstruction?.id || null;
    }
  }, [editingInstruction?.id, currentTime, methods]);

  // Handle form initialization
  useEffect(() => {
    if (!isInitialized && isEditing && editingInstruction) {
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
        overlayForm.initializeForm(editingInstruction);
      } else if (editingInstruction.type === "skip") {
        skipForm.initializeForm(editingInstruction);
      } else if (editingInstruction.type === "text-overlay") {
        textOverlayForm.initializeForm(editingInstruction);
      }

      setIsInitialized(true);
    }
  }, [
    isInitialized,
    isEditing,
    editingInstruction,
    methods,
    overlayForm,
    skipForm,
    textOverlayForm,
  ]);

  // Reset initialization when editing instruction changes
  useEffect(() => {
    if (!isEditing || !editingInstruction) {
      setIsInitialized(false);
      previousInstructionId.current = null;
    }
  }, [isEditing, editingInstruction]);

  const parseTimeInput = (data: TimeInputInterface) => {
    return (
      (Number(data.hours) * 3600 +
        Number(data.minutes) * 60 +
        Number(data.seconds)) *
        1000 +
      Number(data.milliseconds || 0)
    );
  };

  const handleSubmit = async (data: any) => {
    try {
      let newInstruction: Instruction;
      const id = editingInstruction?.id || Date.now().toString();

      if (selectedType === "text-overlay") {
        newInstruction = textOverlayForm.buildInstruction(data, id);
      } else if (selectedType === "overlay") {
        newInstruction = await overlayForm.buildInstruction(
          data,
          id,
          uploadMedia
        );
      } else if (selectedType === "skip") {
        newInstruction = skipForm.buildInstruction(data, id);
      } else {
        return;
      }

      await onSubmit(newInstruction);
    } catch (error) {
      console.error("Failed to build instruction:", error);
    }
  };

  if (!selectedType && !isEditing) {
    return (
      <div className="space-y-4">
        <InstructionsList />
      </div>
    );
  }

  if (!selectedType && !isEditing) {
    navigate(`/timeline/${currentTimeline?.id}`);
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          label="Delete Instruction"
        >
          <Trash2 size={16} />
        </Button>
      </div>

      <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className="text-lg text-muted-foreground">Trigger Time</label>
          <TimeInput
            value={parseTimeInput({
              hours: methods.watch("hours") || 0,
              minutes: methods.watch("minutes") || 0,
              seconds: methods.watch("seconds") || 0,
              milliseconds: methods.watch("milliseconds") || 0,
            })}
            onChange={onTimeChange}
          />
        </div>

        {selectedType === "overlay" && (
          <OverlayInstructionForm
            onMediaDelete={onMediaDelete}
            onMediaSelected={overlayForm.handleMediaSelected}
            onPositionChange={onMediaPositionChange}
          />
        )}

        {selectedType === "skip" && (
          <SkipInstructionForm onTimeChange={onSkipToTimeChange} />
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
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={!formChanged}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default InstructionEditor;
