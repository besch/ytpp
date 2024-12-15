import React, { useRef } from "react";
import { Edit2, Trash2, Copy, MoreVertical, X } from "lucide-react";
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
  removeInstruction,
  setEditingInstruction,
  seekToTime,
  setInstructions,
  setCurrentTimeline,
} from "@/store/timelineSlice";
import { useAPI } from "@/hooks/useAPI";
import type { Instruction, SkipInstruction, OverlayInstruction } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface InstructionDropdownMenuProps {
  instruction: Instruction;
  timelineId: string;
  instructions: Instruction[];
  currentTimelineId: string;
}

const InstructionDropdownMenu: React.FC<InstructionDropdownMenuProps> = ({
  instruction,
  timelineId,
  instructions,
  currentTimelineId,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const api = useAPI();
  const [isDeletingInstruction, setIsDeletingInstruction] =
    React.useState(false);

  const deleteReferenceElement = useRef<HTMLButtonElement>(null);
  const deletePopperElement = useRef<HTMLDivElement>(null);

  const { styles: deleteStyles, attributes: deleteAttributes } = usePopper(
    deleteReferenceElement.current,
    deletePopperElement.current,
    {
      placement: "bottom-start",
      modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
    }
  );

  const deleteInstructionMutation = useMutation({
    mutationFn: async () => {
      if (
        instruction?.type === "overlay" &&
        (instruction as OverlayInstruction).overlayMedia?.url
      ) {
        await api.timelines.deleteMedia(
          (instruction as OverlayInstruction).overlayMedia!.url
        );
      }

      const updatedInstructions = instructions.filter(
        (inst) => inst.id !== instruction.id
      );
      return api.timelines.update(currentTimelineId, {
        instructions: updatedInstructions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timelines"] });
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
    dispatch(removeInstruction(instruction.id));
    await deleteInstructionMutation.mutateAsync();
  };

  const handleClone = async () => {
    await cloneInstructionMutation.mutateAsync();
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
          <DropdownMenuItem onClick={handleClone}>
            <Copy className="w-4 h-4 mr-2" />
            Clone
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={handleDelete}
            ref={deleteReferenceElement}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
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
