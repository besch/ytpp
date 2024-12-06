import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navigation from "@/pages/Navigation";
import TimelineList from "@/components/Timeline/TimelineList";
import InstructionEditor from "@/components/Instructions/InstructionEditor";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-full flex overflow-hidden">
        <div className="w-full h-full flex flex-col bg-background text-foreground">
          <Navigation />
          <div className="flex-grow overflow-auto">
            <Routes>
              <Route path="/" element={<TimelineList />} />
              <Route path="/timeline/:id" element={<InstructionEditor />} />
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
