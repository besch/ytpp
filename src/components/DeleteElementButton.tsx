import React from "react";
import { Trash2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectSelectedElementId,
  setElements,
  selectCurrentTimeline,
  setCurrentTimeline,
} from "@/store/timelineSlice";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { dispatchCustomEvent } from "@/lib/eventSystem";
import { api } from "@/lib/api";

interface DeleteElementButtonProps {
  className?: string;
}

const DeleteElementButton: React.FC<DeleteElementButtonProps> = ({
  className,
}) => {
  const dispatch = useDispatch();
  const currentTimeline = useSelector(selectCurrentTimeline);
  const selectedElementId = useSelector(selectSelectedElementId);

  const handleDelete = async () => {
    if (!selectedElementId || !currentTimeline?.id) return;

    const updatedTimeline = {
      ...currentTimeline,
      elements: currentTimeline.elements.filter(
        (el) => el.id !== selectedElementId
      ),
    };

    try {
      const savedTimeline = await api.timelines.update(
        currentTimeline.id,
        updatedTimeline
      );
      dispatch(setCurrentTimeline(savedTimeline));
    } catch (error) {
      console.error("Failed to delete element:", error);
    }
  };

  return (
    <Button
      onClick={handleDelete}
      variant="destructive"
      className={cn("flex items-center gap-2", className)}
      disabled={!selectedElementId}
    >
      <Trash2 size={18} />
      Delete
    </Button>
  );
};

export default DeleteElementButton;
