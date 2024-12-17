import React, { useState, useRef } from "react";
import { Edit2, Trash2, Check, X, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePopper } from "react-popper";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { setCurrentTimeline } from "@/store/timelineSlice";
import { useAPI } from "@/hooks/useAPI";
import type { Timeline } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface TimelineDropdownMenuProps {
  currentTimeline: Timeline;
  isOwner: boolean;
}

const TimelineDropdownMenu: React.FC<TimelineDropdownMenuProps> = ({
  currentTimeline,
  isOwner,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const api = useAPI();

  const [isRenamingTimeline, setIsRenamingTimeline] = useState(false);
  const [isDeletingTimeline, setIsDeletingTimeline] = useState(false);
  const [newTimelineTitle, setNewTimelineTitle] = useState("");

  const referenceElement = useRef<HTMLButtonElement>(null);
  const popperElement = useRef<HTMLDivElement>(null);
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

  const deleteTimelineMutation = useMutation({
    mutationFn: async () => {
      return api.timelines.delete(currentTimeline.id);
    },
    onSuccess: () => {
      setIsDeletingTimeline(false);
      queryClient.invalidateQueries({ queryKey: ["timelines"] });
      navigate("/timelines");
    },
    onError: (error: Error) => {
      setIsDeletingTimeline(false);
    },
  });

  const updateTimelineMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      return api.timelines.update(currentTimeline.id, { title: newTitle });
    },
    onSuccess: (savedTimeline) => {
      if (savedTimeline) {
        dispatch(setCurrentTimeline(savedTimeline));
        queryClient.invalidateQueries({ queryKey: ["timelines"] });
        setIsRenamingTimeline(false);
      }
    },
    onError: (error: Error) => {
      console.error("Failed to update timeline:", error);
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

  if (!isOwner) return null;

  return (
    <>
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

      {(deleteTimelineMutation.isPending ||
        updateTimelineMutation.isPending) && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </>
  );
};

export default TimelineDropdownMenu;
