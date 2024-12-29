import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useAPI } from "@/hooks/useAPI";
import {
  selectCurrentTimeline,
  setCurrentTimeline,
} from "@/store/timelineSlice";
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
import TimelineNameDialog from "../Timeline/TimelineNameDialog";

interface TimelineDropdownMenuProps {
  isOwner: boolean;
}

const TimelineDropdownMenu: React.FC<TimelineDropdownMenuProps> = ({
  isOwner,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const api = useAPI();
  const timeline = useSelector(selectCurrentTimeline);

  const [isRenamingTimeline, setIsRenamingTimeline] = useState(false);
  const [isDeletingTimeline, setIsDeletingTimeline] = useState(false);
  const [newTimelineTitle, setNewTimelineTitle] = useState("");

  const deleteTimelineMutation = useMutation({
    mutationFn: async () => {
      return api.timelines.delete(timeline!.id);
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
      return api.timelines.update(timeline!.id, { title: newTitle });
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
    setNewTimelineTitle(timeline?.title || "");
    setIsRenamingTimeline(true);
  };

  const handleRenameSubmit = async (title: string) => {
    await updateTimelineMutation.mutateAsync(title);
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

      <TimelineNameDialog
        open={isRenamingTimeline}
        onClose={() => setIsRenamingTimeline(false)}
        onSubmit={handleRenameSubmit}
        title="Rename Timeline"
        value={newTimelineTitle}
        onChange={setNewTimelineTitle}
        isLoading={updateTimelineMutation.isPending}
        submitLabel="Save"
      />

      <ConfirmationDialog
        open={isDeletingTimeline}
        onClose={() =>
          !deleteTimelineMutation.isPending && setIsDeletingTimeline(false)
        }
        onConfirm={handleConfirmDelete}
        title="Delete Timeline"
        description="Are you sure you want to delete this timeline?"
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteTimelineMutation.isPending}
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
