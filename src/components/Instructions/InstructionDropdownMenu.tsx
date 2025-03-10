import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, Edit2, Trash2, Copy, Type, X } from "lucide-react";
import { useAPI } from "@/hooks/useAPI";
import {
  removeInstruction,
  setEditingInstruction,
  renameInstruction,
  seekToTime,
  addInstruction,
  selectCurrentTimeline,
} from "@/store/timelineSlice";
import { InstructionResponse, Instruction } from "@/types";
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
import { VideoManager } from "@/lib/VideoManager";

interface InstructionDropdownMenuProps {
  instruction: InstructionResponse;
  hideEdit?: boolean;
  onDeleteSuccess?: () => void;
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
  hideEdit,
  onDeleteSuccess,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const api = useAPI();
  const queryClient = useQueryClient();
  const timeline = useSelector(selectCurrentTimeline);
  if (!timeline) return null;
  const timelineId = timeline.id;
  const [isDeletingInstruction, setIsDeletingInstruction] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(instruction.data.name || "");
  const [isRenamingLoading, setIsRenamingLoading] = useState(false);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  const deleteInstructionMutation = useMutation({
    mutationFn: async () => {
      if (
        instruction.data.type === "overlay" &&
        instruction.data.overlayMedia?.url
      ) {
        try {
          await api.timelines.deleteMedia(
            instruction.data.overlayMedia.url,
            Number(timelineId)
          );
        } catch (error) {
          console.warn("Failed to delete media file:", error);
        }
      }

      // Delete the instruction using the instructions API
      await api.instructions.delete(instruction.id!);
      return instruction.id;
    },
    onSuccess: (deletedId) => {
      setIsDeletingInstruction(false);
      dispatch(removeInstruction(deletedId!));
      queryClient.invalidateQueries({
        queryKey: ["instructions", timelineId.toString()],
      });
      onDeleteSuccess?.();
      navigate(`/timeline/${timelineId}`);
    },
    onError: (error: Error) => {
      setIsDeletingInstruction(false);
    },
    onSettled: () => {
      setIsDeletingLoading(false);
    },
  });

  const cloneInstructionMutation = useMutation({
    mutationFn: async () => {
      const response = await api.instructions.clone(
        instruction.id!,
        instruction as Instruction
      );
      const clonedInstruction: InstructionResponse = {
        id: response.id,
        timeline_id: timelineId,
        data: {
          ...response.data,
          type: instruction.data.type,
        },
        created_at: response.created_at,
        updated_at: response.updated_at,
      };
      return clonedInstruction;
    },
    onSuccess: async (clonedInstruction: InstructionResponse) => {
      dispatch(addInstruction(clonedInstruction));
      await queryClient.invalidateQueries({
        queryKey: ["instructions", timelineId.toString()],
        exact: true,
      });
    },
    onError: (error: Error) => {
      console.error("Failed to clone instruction:", error);
    },
  });

  const handleEdit = () => {
    dispatch(setEditingInstruction(instruction));
    dispatch(seekToTime(instruction.data.triggerTime));
    navigate(`/timeline/${timelineId}/instruction/${instruction.id}`);
  };

  const handleDelete = () => {
    // Clean up any active instances of this instruction in VideoManager
    const videoManager = (window as any).videoManager as
      | VideoManager
      | undefined;
    if (videoManager && instruction.id) {
      videoManager.hideInstruction(instruction.id);
    }
    setIsDeletingInstruction(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeletingLoading(true);
    await deleteInstructionMutation.mutateAsync();
    dispatch(setEditingInstruction(null));
    onDeleteSuccess?.();
    navigate(`/timeline/${timelineId}`);
  };

  const handleClone = async () => {
    // Clean up any active instances of the original instruction before cloning
    const videoManager = (window as any).videoManager as
      | VideoManager
      | undefined;
    if (videoManager && instruction.id) {
      videoManager.hideInstruction(instruction.id);
    }
    await cloneInstructionMutation.mutateAsync();
  };

  const handleRename = () => {
    setNewName(instruction.data.name || `${instruction.data.type} Instruction`);
    setIsRenaming(true);
  };

  const handleConfirmRename = async () => {
    setIsRenamingLoading(true);
    try {
      // Clean up any active instances of this instruction in VideoManager
      const videoManager = (window as any).videoManager as
        | VideoManager
        | undefined;
      if (videoManager && instruction.id) {
        videoManager.hideInstruction(instruction.id);
      }

      const updatedInstruction = {
        ...instruction,
        data: {
          ...instruction.data,
          name: newName,
          type: instruction.data.type as "overlay" | "text-overlay" | "skip",
          overlayDuration: instruction.data.overlayDuration || 0,
          muteOverlayMedia: instruction.data.muteOverlayMedia || false,
        },
      };

      await api.instructions.update(
        instruction.id!,
        updatedInstruction as Instruction
      );
      dispatch(renameInstruction({ id: instruction.id!, name: newName }));
      queryClient.invalidateQueries({
        queryKey: ["instructions", timelineId.toString()],
      });
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
        onClose={() => !isDeletingLoading && setIsDeletingInstruction(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Instruction"
        description="Are you sure you want to delete this instruction?"
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeletingLoading}
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
              placeholder={`${instruction.data.type} Instruction`}
              style={styles.input}
              disabled={isRenamingLoading}
              autoFocus
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
