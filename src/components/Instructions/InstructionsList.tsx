import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Plus,
  Edit2,
  Trash2,
  Play,
  Check,
  X,
  Copy,
  MoreVertical,
} from "lucide-react";
import Button from "@/components/ui/Button";
import {
  selectInstructions,
  setEditingInstruction,
  removeInstruction,
  selectCurrentTimeline,
  selectEditingInstruction,
  seekToTime,
  setInstructions,
  setCurrentTimeline,
} from "@/store/timelineSlice";
import { selectIsTimelineOwner } from "@/store/authSlice";
import type { Instruction, SkipInstruction, OverlayInstruction } from "@/types";
import { formatTime } from "@/lib/time";
import InstructionTypeSelect from "./InstructionTypeSelect";
import { useAPI } from "@/hooks/useAPI";
import { RootState } from "@/store";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { toast } from "react-toastify";
import { usePopper } from "react-popper";

const InstructionsList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: timelineId } = useParams();
  const currentTimeline = useSelector(selectCurrentTimeline);
  const instructions = useSelector(selectInstructions);
  const editingInstruction = useSelector(selectEditingInstruction);
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const isOwner = useSelector((state: RootState) =>
    selectIsTimelineOwner(state, currentTimeline)
  );
  const queryClient = useQueryClient();
  const api = useAPI();
  const [isRenamingTimeline, setIsRenamingTimeline] = useState(false);
  const [newTimelineTitle, setNewTimelineTitle] = useState("");
  const referenceElement = useRef<HTMLButtonElement>(null);
  const popperElement = useRef<HTMLDivElement>(null);
  const [isDeletingTimeline, setIsDeletingTimeline] = useState(false);
  const deleteReferenceElement = useRef<HTMLButtonElement>(null);
  const deletePopperElement = useRef<HTMLDivElement>(null);

  const { styles, attributes } = usePopper(
    referenceElement.current,
    popperElement.current,
    {
      placement: "bottom-start",
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [0, 8],
          },
        },
      ],
    }
  );

  const { styles: deleteStyles, attributes: deleteAttributes } = usePopper(
    deleteReferenceElement.current,
    deletePopperElement.current,
    {
      placement: "bottom-start",
      modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
    }
  );

  useEffect(() => {
    if (editingInstruction) {
      setShowTypeSelect(false);
    }
  }, [editingInstruction]);

  const handleAddNew = () => {
    setShowTypeSelect(true);
  };

  const handleTypeSelect = (type: string) => {
    dispatch(setEditingInstruction({ type } as Instruction));
    setShowTypeSelect(false);
    navigate(`/timeline/${timelineId}/instruction`);
  };

  const handleEdit = (instruction: Instruction) => {
    dispatch(setEditingInstruction(instruction));
    dispatch(seekToTime(instruction.triggerTime));
    navigate(`/timeline/${timelineId}/instruction/${instruction.id}`);
  };

  const deleteInstructionMutation = useMutation({
    mutationFn: async ({
      id,
      instruction,
    }: {
      id: string;
      instruction: Instruction;
    }) => {
      if (instruction?.type === "overlay" && instruction.overlayMedia?.url) {
        await api.timelines.deleteMedia(instruction.overlayMedia.url);
      }

      const updatedInstructions = instructions.filter((inst) => inst.id !== id);
      return api.timelines.update(currentTimeline!.id, {
        instructions: updatedInstructions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timelines"] });
    },
  });

  const cloneInstructionMutation = useMutation({
    mutationFn: async (instruction: Instruction) => {
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
            currentTimeline!.id
          );

          (clonedInstruction as OverlayInstruction).overlayMedia = {
            ...(clonedInstruction as OverlayInstruction).overlayMedia!,
            url: clonedMedia.url,
          };
        }
      }

      const updatedInstructions = [...instructions, clonedInstruction];
      return api.timelines.update(currentTimeline!.id, {
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

  const handleDelete = async (id: string) => {
    const instruction = instructions.find((inst) => inst.id === id);
    if (!instruction) return;

    dispatch(removeInstruction(id));
    await deleteInstructionMutation.mutateAsync({ id, instruction });
  };

  const handleClone = async (instruction: Instruction) => {
    await cloneInstructionMutation.mutateAsync(instruction);
  };

  const getInstructionDescription = (instruction: Instruction): string => {
    if (instruction.type === "skip") {
      return `Skips to ${formatTime(
        (instruction as SkipInstruction).skipToTime
      )}`;
    } else if (instruction.type === "overlay") {
      const overlayInstruction = instruction as OverlayInstruction;
      let description = `Displays ${
        overlayInstruction.overlayMedia?.name || "overlay media"
      }`;
      return description;
    }
    return "";
  };

  const deleteTimelineMutation = useMutation({
    mutationFn: async () => {
      if (!currentTimeline) return;
      return api.timelines.delete(currentTimeline.id);
    },
    onSuccess: () => {
      setIsDeletingTimeline(false);
      queryClient.invalidateQueries({ queryKey: ["timelines"] });
      navigate("/timelines");
    },
    onError: (error) => {
      setIsDeletingTimeline(false);
    },
  });

  const updateTimelineMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      if (!currentTimeline) return;
      return api.timelines.update(currentTimeline.id, { title: newTitle });
    },
    onSuccess: (savedTimeline) => {
      if (savedTimeline) {
        dispatch(setCurrentTimeline(savedTimeline));
        queryClient.invalidateQueries({ queryKey: ["timelines"] });
      }
    },
    onError: (error) => {
      console.error("Failed to update timeline:", error);
      toast.error("Failed to update timeline");
    },
  });

  const handleDeleteTimeline = () => {
    setIsDeletingTimeline(true);
  };

  const handleConfirmDelete = async () => {
    await deleteTimelineMutation.mutateAsync();
    setIsDeletingTimeline(false);
  };

  const handleRenameTimeline = () => {
    setNewTimelineTitle(currentTimeline?.title || "");
    setIsRenamingTimeline(true);
  };

  const handleRenameSubmit = async () => {
    if (newTimelineTitle.trim() !== "") {
      await updateTimelineMutation.mutateAsync(newTimelineTitle.trim());
      setIsRenamingTimeline(false);
    }
  };

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">{currentTimeline?.title}</h1>
        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              {showTypeSelect ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTypeSelect(false)}
                >
                  Cancel
                </Button>
              ) : (
                <>
                  <Button onClick={handleAddNew}>
                    <Plus className="w-4 h-4 mr-4" />
                    Add Instruction
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={handleRenameTimeline}
                        ref={referenceElement}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Rename Timeline
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={handleDeleteTimeline}
                        ref={deleteReferenceElement}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Timeline
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showTypeSelect && isOwner ? (
        <InstructionTypeSelect onSelect={handleTypeSelect} />
      ) : instructions.length > 0 ? (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {instructions
            .slice()
            .sort((a, b) => a.triggerTime - b.triggerTime)
            .map((instruction) => (
              <div
                key={instruction.id}
                className="p-3 bg-muted/10 border border-border rounded-lg hover:bg-muted/20 flex items-center justify-between"
              >
                <div>
                  <h1 className="font-medium capitalize">
                    {instruction.type} Instruction
                  </h1>
                  <p className="text-sm text-muted-foreground ml-2">
                    at {formatTime(instruction.triggerTime)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getInstructionDescription(instruction)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      dispatch(seekToTime(instruction.triggerTime))
                    }
                  >
                    <Play size={16} />
                  </Button>
                  {isOwner && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClone(instruction)}
                      >
                        <Copy size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(instruction)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(instruction.id)}
                      >
                        <Trash2 size={16} className="text-white" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No instructions yet. {isOwner && "Click the button above to add one."}
        </div>
      )}

      {(deleteInstructionMutation.isPending ||
        cloneInstructionMutation.isPending ||
        deleteTimelineMutation.isPending ||
        updateTimelineMutation.isPending) && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {isRenamingTimeline && (
        <div
          ref={popperElement}
          style={styles.popper}
          {...attributes.popper}
          className="z-50 bg-background border border-border rounded-md shadow-md p-4 animate-fade-in"
        >
          <div className="space-y-4">
            <input
              type="text"
              value={newTimelineTitle}
              onChange={(e) => setNewTimelineTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              placeholder="Timeline title"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRenamingTimeline(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleRenameSubmit}>
                <Check className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {isDeletingTimeline && (
        <div
          ref={deletePopperElement}
          style={deleteStyles.popper}
          {...deleteAttributes.popper}
          className="z-50 bg-background border border-border rounded-md shadow-md p-4 animate-fade-in"
        >
          <div className="space-y-4">
            <p>Are you sure you want to delete this timeline?</p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeletingTimeline(false)}
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
    </div>
  );
};

export default InstructionsList;
