import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  selectCurrentTimeline,
  setCurrentTimeline,
} from "@/store/timelineSlice";
import InstructionEditor from "@/components/Instructions/InstructionEditor";

const TimelineEditor: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentTimeline = useSelector(selectCurrentTimeline);

  const handleBack = () => {
    dispatch(setCurrentTimeline(null));
    navigate("/timelines");
  };

  if (!currentTimeline) {
    navigate("/");
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        {/* <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Timelines
        </Button> */}
        <h1 className="text-lg font-semibold">{currentTimeline.title}</h1>
      </div>

      <InstructionEditor />
    </div>
  );
};

export default TimelineEditor;
