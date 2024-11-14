import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Navigation from "@/pages/Navigation";
import TimelineList from "@/components/Timeline/TimelineList";
import TimelineEditor from "@/components/Timeline/TimelineEditor";

const App: React.FC = () => {
  return (
    <div className="h-[600px] min-h-[600px] flex overflow-hidden transition-all duration-300 ease-in-out w-[300px] min-w-[300px]">
      <div className="w-[350px] h-full flex flex-col overflow-hidden">
        <div className="flex-grow h-[450px] bg-background text-foreground flex flex-col overflow-hidden">
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
    </div>
  );
};

export default App;
