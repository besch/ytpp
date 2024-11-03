import React from "react";
import { Trash2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { selectSelectedElementId, setElements } from "@/store/timelineSlice";
import Button from "@/components/ui/Button";

const DeleteElementButton: React.FC = () => {
  const dispatch = useDispatch();
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
      className="flex items-center gap-2"
      disabled={!selectedElementId}
    >
      <Trash2 size={18} />
      Delete Element
    </Button>
  );
};

export default DeleteElementButton;
