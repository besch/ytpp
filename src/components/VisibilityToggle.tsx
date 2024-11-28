import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff } from "lucide-react";
import { RootState } from "@/store";
import { setCanvasVisibility } from "@/store/timelineSlice";
import Button from "./ui/Button";

const VisibilityToggle: React.FC = () => {
  const dispatch = useDispatch();
  const isVisible = useSelector(
    (state: RootState) => state.timeline.isCanvasVisible
  );

  const toggleVisibility = () => {
    dispatch(setCanvasVisibility(!isVisible));
    const timelineContainer = document.getElementById("timeline-container");
    const appContainer = document.getElementById("react-overlay-root");

    if (timelineContainer) {
      timelineContainer.style.display = !isVisible ? "block" : "none";
    }
    if (appContainer) {
      appContainer.style.display = !isVisible ? "block" : "none";
    }
  };

  return (
    <div id="visibility-toggler">
      <Button
        onClick={toggleVisibility}
        size="lg"
        title={isVisible ? "Hide Timeline" : "Show Timeline"}
      >
        {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
      </Button>
    </div>
  );
};

export default VisibilityToggle;
