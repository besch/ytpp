import React, { useRef } from "react";
import { Edit2, Trash2, Copy, MoreVertical, X, Type } from "lucide-react";
import { useDispatch } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePopper } from "react-popper";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  setEditingInstruction,
  seekToTime,
  setInstructions,
  setCurrentTimeline,
  renameInstruction,
} from "@/store/timelineSlice";
import { useAPI } from "@/hooks/useAPI";
import type { Instruction, SkipInstruction, OverlayInstruction } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Input from "@/components/ui/Input";

interface InstructionDropdownMenuProps {
  instruction: Instruction;
  timelineId: string;
  instructions: Instruction[];
  currentTimelineId: string;
  hideEdit?: boolean;
  onDeleteSuccess?: () => void;
}

const InstructionDropdownMenu: React.FC<InstructionDropdownMenuProps> = ({
  instruction,
  timelineId,
  instructions,
  currentTimelineId,
  hideEdit,
  onDeleteSuccess,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const api = useAPI();
  const [isDeletingInstruction, setIsDeletingInstruction] =
    React.useState(false);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [newName, setNewName] = React.useState(instruction.name || "");

  const deleteReferenceElement = useRef<HTMLButtonElement>(null);
  const deletePopperElement = useRef<HTMLDivElement>(null);
  const renameReferenceElement = useRef<HTMLButtonElement>(null);
  const renamePopperElement = useRef<HTMLDivElement>(null);

  const { styles: deleteStyles, attributes: deleteAttributes } = usePopper(
    deleteReferenceElement.current,
    deletePopperElement.current,
    {
      placement: "bottom-start",
      modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
    }
  );

  const { styles: renameStyles, attributes: renameAttributes } = usePopper(
    renameReferenceElement.current,
    renamePopperElement.current,
    {
      placement: "bottom-start",
      modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
    }
  );

  const deleteInstructionMutation = useMutation({
    mutationFn: async () => {
      try {
        if (
          instruction?.type === "overlay" &&
          (instruction as OverlayInstruction).overlayMedia?.url
        ) {
          try {
            await api.timelines.deleteMedia(
              (instruction as OverlayInstruction).overlayMedia!.url
            );
          } catch (error) {
            console.warn("Failed to delete media file:", error);
          }
        }

        const updatedInstructions = instructions.filter(
          (inst) => inst.id !== instruction.id
        );

        const updatedTimeline = await api.timelines.update(currentTimelineId, {
          instructions: updatedInstructions,
        });

        return updatedTimeline;
      } catch (error) {
        console.error("Failed to delete instruction:", error);
        throw error;
      }
    },
    onSuccess: (savedTimeline) => {
      dispatch(setCurrentTimeline(savedTimeline));
      queryClient.invalidateQueries({ queryKey: ["timelines"] });
      setIsDeletingInstruction(false);
    },
    onError: (error) => {
      console.error("Failed to delete instruction:", error);
      setIsDeletingInstruction(false);
    },
  });

  const cloneInstructionMutation = useMutation({
    mutationFn: async () => {
      const clonedInstruction = {
        ...instruction,
        id: Date.now().toString(),
        triggerTime: instruction.triggerTime + 3000,
      };

      if (instruction.type === "skip") {
        (clonedInstruction as SkipInstruction).skipToTime += 3000;
      } else if (instruction.type === "overlay") {
        const overlayInst = instruction as OverlayInstruction;
        if (overlayInst.overlayMedia?.url) {
          const clonedMedia = await api.timelines.cloneMedia(
            overlayInst.overlayMedia.url,
            currentTimelineId
          );

          (clonedInstruction as OverlayInstruction).overlayMedia = {
            ...(clonedInstruction as OverlayInstruction).overlayMedia!,
            url: clonedMedia.url,
          };
        }
      }

      const updatedInstructions = [...instructions, clonedInstruction];
      return api.timelines.update(currentTimelineId, {
        instructions: updatedInstructions,
      });
    },
    onSuccess: (savedTimeline) => {
      dispatch(setCurrentTimeline(savedTimeline));
      queryClient.invalidateQueries({ queryKey: ["timelines"] });
    },
    onError: (error) => {
      console.error("Failed to clone instruction:", error);
      dispatch(setInstructions(instructions));
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
    const updatedInstructions = instructions.map((inst) =>
      inst.id === instruction.id ? { ...inst, name: newName } : inst
    );

    try {
      const savedTimeline = await api.timelines.update(currentTimelineId, {
        instructions: updatedInstructions,
      });
      dispatch(setCurrentTimeline(savedTimeline));
      dispatch(renameInstruction({ id: instruction.id, name: newName }));
      setIsRenaming(false);
    } catch (error) {
      console.error("Failed to rename instruction:", error);
    }
  };

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
          <DropdownMenuItem onClick={handleClone}>
            <Copy className="w-4 h-4 mr-2" />
            Clone
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={handleDelete}
            ref={deleteReferenceElement}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRename} ref={renameReferenceElement}>
            <Type className="w-4 h-4 mr-2" />
            Rename
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isDeletingInstruction && (
        <div
          ref={deletePopperElement}
          style={deleteStyles.popper}
          {...deleteAttributes.popper}
          className="z-50 bg-background border border-border rounded-md shadow-md p-4 animate-fade-in"
        >
          <div className="space-y-4">
            <p>Are you sure you want to delete this instruction?</p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeletingInstruction(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {isRenaming && (
        <div
          ref={renamePopperElement}
          style={renameStyles.popper}
          {...renameAttributes.popper}
          className="z-50 bg-background border border-border rounded-md shadow-md p-4 animate-fade-in"
        >
          <div className="space-y-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`${instruction.type} Instruction`}
              className="w-full"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRenaming(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmRename}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

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
