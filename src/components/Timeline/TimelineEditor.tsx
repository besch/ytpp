import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  selectCurrentTimeline,
  setCurrentTimeline,
} from "@/store/timelineSlice";
import AddElements from "@/components/AddElements";
import TimelineProperties from "@/components/Timeline/TimelineProperties";
import InstructionEditor from "@/components/Instructions/InstructionEditor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

const TimelineEditor: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentTimeline = useSelector(selectCurrentTimeline);

  const handleBack = () => {
    dispatch(setCurrentTimeline(null));
    navigate("/");
  };

  if (!currentTimeline) {
    navigate("/");
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <h2 className="text-lg font-semibold">{currentTimeline.title}</h2>
      </div>

      <Tabs defaultValue="elements">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="elements">Elements</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
        </TabsList>

        <TabsContent value="elements">
          <AddElements />
        </TabsContent>

        <TabsContent value="properties">
          <TimelineProperties />
        </TabsContent>

        <TabsContent value="instructions">
          <InstructionEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimelineEditor;
