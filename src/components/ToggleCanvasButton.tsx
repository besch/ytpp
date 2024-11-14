import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Button from "@/components/ui/Button";
import {
  selectCanvasVisibility,
  setCanvasVisibility,
} from "@/store/timelineSlice";
import { dispatchCustomEvent } from "@/lib/eventSystem";

export const ToggleCanvasButton: React.FC<{
  className?: string;
}> = ({ className }) => {
  const dispatch = useDispatch();
  const isCanvasVisible = useSelector(selectCanvasVisibility);

  const toggleCanvas = () => {
    dispatch(setCanvasVisibility(!isCanvasVisible));
    dispatchCustomEvent("TOGGLE_CANVAS", { visible: !isCanvasVisible });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleCanvas}
      className={className}
    >
      {isCanvasVisible ? (
        <>
          <EyeOff size={16} />
          Hide Canvas
        </>
      ) : (
        <>
          <Eye size={16} />
          Show Canvas
        </>
      )}
    </Button>
  );
};
