import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Navigation from "@/pages/Navigation";
import TimelineList from "@/components/Timeline/TimelineList";
import TimelineEditor from "@/components/Timeline/TimelineEditor";
import { useCanvasEvents } from "./hooks/useCanvasEvents";

const App: React.FC = () => {
  useCanvasEvents();

  return (
    <div className="h-full flex overflow-hidden">
      <div className="w-full h-full flex flex-col bg-background text-foreground">
        <Navigation />
        <div className="flex-grow overflow-auto">
          <Routes>
            <Route path="/" element={<TimelineList />} />
            <Route path="/timeline/:id" element={<TimelineEditor />} />
            <Route path="/timeline/new" element={<TimelineEditor />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
