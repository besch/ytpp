import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { MoreVertical, Edit2, Trash2, Copy, Type, X } from "lucide-react";
import { useAPI } from "@/hooks/useAPI";
import {
  removeInstruction,
  setEditingInstruction,
  setCurrentTimeline,
  renameInstruction,
  seekToTime,
} from "@/store/timelineSlice";
import {
  Instruction,
  OverlayInstruction,
  SkipInstruction,
  Timeline,
} from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/DropdownMenu";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import Dialog from "../ui/Dialog";

interface InstructionDropdownMenuProps {
  instruction: Instruction;
  timelineId: number;
  instructions: Instruction[];
  currentTimelineId: number;
  hideEdit?: boolean;
  onDeleteSuccess?: () => void;
  timeline: Timeline;
}

const styles = {
  inputContainer: {
    marginBottom: "24px",
    paddingRight: "24px",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    backgroundColor: "rgb(17 24 39)",
    border: "1px solid #4B5563",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  },
  icon: {
    width: "14px",
    height: "14px",
    marginRight: "6px",
  },
  button: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    transition: "background-color 200ms",
  },
  cancelButton: {
    backgroundColor: "transparent",
    color: "#9CA3AF",
    border: "1px solid #4B5563",
    "&:hover": {
      backgroundColor: "rgba(75, 85, 99, 0.3)",
    },
  },
  confirmButton: {
    backgroundColor: "#2563EB",
    color: "#ffffff",
    border: "none",
    "&:hover": {
      backgroundColor: "#4F46E5",
    },
  },
} as const;

const InstructionDropdownMenu: React.FC<InstructionDropdownMenuProps> = ({
  instruction,
  timelineId,
  instructions,
  currentTimelineId,
  hideEdit,
  onDeleteSuccess,
  timeline,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const api = useAPI();
  const [isDeletingInstruction, setIsDeletingInstruction] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(instruction.name || "");
  const [isRenamingLoading, setIsRenamingLoading] = useState(false);

  const deleteInstructionMutation = useMutation({
    mutationFn: async () => {
      if (
        instruction?.type === "overlay" &&
        (instruction as OverlayInstruction).overlayMedia?.url
      ) {
        try {
          await api.timelines.deleteMedia(
            (instruction as OverlayInstruction).overlayMedia!.url,
            Number(currentTimelineId)
          );
        } catch (error) {
          console.warn("Failed to delete media file:", error);
        }
      }

      const updatedInstructions = instructions.filter(
        (inst) => inst.id !== instruction.id
      );
      return api.timelines.update(Number(currentTimelineId), {
        instructions: updatedInstructions,
      });
    },
    onSuccess: () => {
      setIsDeletingInstruction(false);
      dispatch(removeInstruction(instruction.id));
    },
    onError: (error: Error) => {
      setIsDeletingInstruction(false);
    },
  });

  const cloneInstructionMutation = useMutation({
    mutationFn: async () => {
      const response = await api.instructions.clone(
        currentTimelineId.toString(),
        instruction
      );

      // Convert API response to Instruction type
      const clonedInstruction = response.data as Instruction;
      const updatedInstructions = [...instructions, clonedInstruction];

      dispatch(
        setCurrentTimeline({
          ...timeline,
          instructions: updatedInstructions,
        })
      );
      return clonedInstruction;
    },
    onError: (error: Error) => {
      console.error("Failed to clone instruction:", error);
    },
  });

  const handleEdit = () => {
    dispatch(setEditingInstruction(instruction));
    dispatch(seekToTime(instruction.triggerTime));
    navigate(`/timeline/${timelineId}/instruction/${instruction.id}`);
  };

  const handleDelete = () => {
    setIsDeletingInstruction(true);
  };

  const handleConfirmDelete = async () => {
    await deleteInstructionMutation.mutateAsync();
    dispatch(setEditingInstruction(null));
    onDeleteSuccess?.();
    navigate(`/timeline/${timelineId}`);
  };

  const handleClone = async () => {
    await cloneInstructionMutation.mutateAsync();
  };

  const handleRename = () => {
    setNewName(instruction.name || `${instruction.type} Instruction`);
    setIsRenaming(true);
  };

  const handleConfirmRename = async () => {
    setIsRenamingLoading(true);
    const updatedInstructions = instructions.map((inst) =>
      inst.id === instruction.id ? { ...inst, name: newName } : inst
    );

    try {
      const savedTimeline = await api.timelines.update(
        Number(currentTimelineId),
        {
          instructions: updatedInstructions,
        }
      );
      dispatch(setCurrentTimeline(savedTimeline));
      dispatch(renameInstruction({ id: instruction.id, name: newName }));
      setIsRenaming(false);
    } catch (error) {
      console.error("Failed to rename instruction:", error);
    } finally {
      setIsRenamingLoading(false);
    }
  };

  const getButtonStyle = (baseStyle: any) => ({
    ...styles.button,
    ...baseStyle,
    "&:hover": {
      ...baseStyle["&:hover"],
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!hideEdit && (
            <DropdownMenuItem onClick={handleEdit}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleRename}>
            <Type className="w-4 h-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleClone}>
            <Copy className="w-4 h-4 mr-2" />
            Clone
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationDialog
        open={isDeletingInstruction}
        onClose={() => setIsDeletingInstruction(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Instruction"
        description="Are you sure you want to delete this instruction?"
        confirmLabel="Delete"
        variant="destructive"
      />

      <Dialog
        open={isRenaming}
        onClose={() => !isRenamingLoading && setIsRenaming(false)}
        title="Rename Instruction"
      >
        <div>
          <div style={styles.inputContainer}>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`${instruction.type} Instruction`}
              style={styles.input}
              disabled={isRenamingLoading}
            />
          </div>
          <div style={styles.buttonGroup}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRenaming(false)}
              style={getButtonStyle(styles.cancelButton)}
              disabled={isRenamingLoading}
            >
              <X style={styles.icon} />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmRename}
              style={getButtonStyle(styles.confirmButton)}
              disabled={isRenamingLoading}
            >
              Save
            </Button>
          </div>
          {isRenamingLoading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
              }}
            >
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>
      </Dialog>

      {(deleteInstructionMutation.isPending ||
        cloneInstructionMutation.isPending) && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </>
  );
};

export default InstructionDropdownMenu;
