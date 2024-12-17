import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { MoreVertical, Edit2, Trash2, X, Check } from "lucide-react";
import { useAPI } from "@/hooks/useAPI";
import { setCurrentTimeline } from "@/store/timelineSlice";
import { Timeline } from "@/types";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/DropdownMenu";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import Dialog from "@/components/ui/Dialog";

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
  };

  const handleRenameTimeline = () => {
    setNewTimelineTitle(currentTimeline?.title || "");
    setIsRenamingTimeline(true);
  };

  const handleRenameSubmit = async () => {
    if (newTimelineTitle.trim() !== "") {
      await updateTimelineMutation.mutateAsync(newTimelineTitle.trim());
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
          <DropdownMenuItem onClick={handleRenameTimeline}>
            <Edit2 className="w-4 h-4 mr-2" />
            Rename Timeline
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={handleDeleteTimeline}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Timeline
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={isRenamingTimeline}
        onClose={() => setIsRenamingTimeline(false)}
        title="Rename Timeline"
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
      </Dialog>

      <ConfirmationDialog
        open={isDeletingTimeline}
        onClose={() => setIsDeletingTimeline(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Timeline"
        description="Are you sure you want to delete this timeline?"
        confirmLabel="Delete"
        variant="destructive"
      />

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
