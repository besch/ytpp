import React, { useEffect } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import {
  selectEditingInstruction,
  selectCurrentTimeline,
} from "@/store/timelineSlice";
import Navigation from "@/pages/Navigation";
import TimelineList from "@/components/Timeline/TimelineList";
import InstructionEditor from "@/components/Instructions/InstructionEditor";
import InstructionsList from "@/components/Instructions/InstructionsList";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  const navigate = useNavigate();
  const editingInstruction = useSelector(selectEditingInstruction);
  const currentTimeline = useSelector(selectCurrentTimeline);

  // Listen for editingInstruction changes and navigate accordingly
  useEffect(() => {
    if (editingInstruction && currentTimeline) {
      // If editing an existing instruction
      if ("id" in editingInstruction) {
        navigate(
          `/timeline/${currentTimeline.id}/instruction/${editingInstruction.id}`
        );
      }
      // If creating a new instruction
      else {
        navigate(`/timeline/${currentTimeline.id}/instruction`);
      }
    }
  }, [editingInstruction, currentTimeline, navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-full flex overflow-hidden">
        <div className="w-full h-full flex flex-col bg-background text-foreground">
          <Navigation />
          <div className="flex-grow overflow-auto">
            <Routes>
              <Route path="/" element={<TimelineList />} />
              <Route path="/timeline/:id" element={<InstructionsList />} />
              <Route
                path="/timeline/:id/instruction/:instructionId?"
                element={<InstructionEditor />}
              />
              <Route path="/timeline/new" element={<InstructionEditor />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default App;
