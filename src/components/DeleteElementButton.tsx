import React from "react";
import { Trash2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectSelectedElementId,
  setElements,
  selectCurrentTimeline,
} from "@/store/timelineSlice";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { dispatchCustomEvent } from "@/lib/eventSystem";

interface DeleteElementButtonProps {
  className?: string;
}

const DeleteElementButton: React.FC<DeleteElementButtonProps> = ({
  className,
}) => {
  const currentTimeline = useSelector(selectCurrentTimeline);
  const selectedElementId = useSelector(selectSelectedElementId);

  const handleDelete = () => {
    if (!selectedElementId || !currentTimeline?.id) return;

    dispatchCustomEvent("DELETE_ELEMENT", {
      timelineId: currentTimeline.id,
      elementId: selectedElementId,
    });
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
