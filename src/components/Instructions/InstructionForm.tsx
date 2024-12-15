import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useFormContext } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import { selectCurrentTimeline } from "@/store/timelineSlice";
import { TimeInput } from "../ui/TimeInput";
import { Instruction, TimeInput as TimeInputInterface } from "@/types";
import InstructionsList from "./InstructionsList";
import { MediaPosition } from "./MediaPositioner";
import OverlayInstructionForm from "./OverlayInstructionForm";
import SkipInstructionForm from "./SkipInstructionForm";
import TextOverlayInstructionForm from "./TextOverlayInstructionForm";
import { useNavigate } from "react-router-dom";
import { useSkipInstructionForm } from "@/hooks/forms/useSkipInstructionForm";
import { useOverlayInstructionForm } from "@/hooks/forms/useOverlayInstructionForm";
import { useTextOverlayInstructionForm } from "@/hooks/forms/useTextOverlayInstructionForm";
import InstructionDropdownMenu from "./InstructionDropdownMenu";

interface InstructionFormProps {
  isEditing: boolean;
  editingInstruction: Instruction | null;
  selectedType: string | null;
  currentTime: number;
  onSubmit: (instruction: Instruction) => Promise<void>;
  onBack: () => void;
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

  useEffect(() => {
    if (!selectedType && !isEditing) {
      navigate(`/timeline/${currentTimeline?.id}`);
    }
  }, [selectedType, isEditing, currentTimeline, navigate]);

  if (!selectedType && !isEditing) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        {isEditing && editingInstruction && currentTimeline && (
          <InstructionDropdownMenu
            instruction={editingInstruction}
            timelineId={currentTimeline.id}
            instructions={currentTimeline.instructions}
            currentTimelineId={currentTimeline.id}
            hideEdit={true}
          />
        )}
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

export default InstructionForm;
