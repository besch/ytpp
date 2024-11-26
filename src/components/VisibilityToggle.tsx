import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff } from "lucide-react";
import { RootState } from "@/store";
import { setCanvasVisibility } from "@/store/timelineSlice";

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
    <button
      onClick={toggleVisibility}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/5 border border-border shadow-lg hover:bg-accent transition-colors duration-200"
      style={{
        color: "white",
        cursor: "pointer",
      }}
      title={isVisible ? "Hide Timeline" : "Show Timeline"}
    >
      {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </button>
  );
};

export default VisibilityToggle;
