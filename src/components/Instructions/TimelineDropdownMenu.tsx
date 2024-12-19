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
import Input from "@/components/ui/Input";

interface TimelineDropdownMenuProps {
  currentTimeline: Timeline;
  isOwner: boolean;
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
  const [isRenamingLoading, setIsRenamingLoading] = useState(false);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

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
    onSettled: () => {
      setIsDeletingLoading(false);
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
    setIsDeletingLoading(true);
    await deleteTimelineMutation.mutateAsync();
  };

  const handleRenameTimeline = () => {
    setNewTimelineTitle(currentTimeline?.title || "");
    setIsRenamingTimeline(true);
  };

  const handleRenameSubmit = async () => {
    if (newTimelineTitle.trim() !== "") {
      setIsRenamingLoading(true);
      try {
        await updateTimelineMutation.mutateAsync(newTimelineTitle.trim());
      } finally {
        setIsRenamingLoading(false);
      }
    }
  };

  const getButtonStyle = (baseStyle: any) => ({
    ...styles.button,
    ...baseStyle,
    "&:hover": {
      ...baseStyle["&:hover"],
    },
  });

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
        onClose={() => !isRenamingLoading && setIsRenamingTimeline(false)}
        title="Rename Timeline"
      >
        <div>
          <div style={styles.inputContainer}>
            <Input
              value={newTimelineTitle}
              onChange={(e) => setNewTimelineTitle(e.target.value)}
              placeholder="Timeline title"
              style={styles.input}
              disabled={isRenamingLoading}
              autoFocus
            />
          </div>
          <div style={styles.buttonGroup}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRenamingTimeline(false)}
              style={getButtonStyle(styles.cancelButton)}
              disabled={isRenamingLoading}
            >
              <X style={styles.icon} />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRenameSubmit}
              style={getButtonStyle(styles.confirmButton)}
              disabled={isRenamingLoading}
            >
              <Check style={styles.icon} />
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

      <ConfirmationDialog
        open={isDeletingTimeline}
        onClose={() => !isDeletingLoading && setIsDeletingTimeline(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Timeline"
        description="Are you sure you want to delete this timeline?"
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeletingLoading}
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
