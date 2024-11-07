import React from "react";
import { Trash2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { selectSelectedElementId, setElements } from "@/store/timelineSlice";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface DeleteElementButtonProps {
  className?: string;
}

const DeleteElementButton: React.FC<DeleteElementButtonProps> = ({
  className,
}) => {
  const selectedElementId = useSelector(selectSelectedElementId);

  const handleDelete = () => {
    if (!selectedElementId) return;

    window.dispatchEvent(
      new CustomEvent("DELETE_ELEMENT", {
        detail: { elementId: selectedElementId },
      })
    );

    // Update elements in Redux store
    window.dispatchEvent(new CustomEvent("GET_ELEMENTS"));
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
