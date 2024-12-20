import React, { useEffect } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useIsFetching,
} from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import {
  selectEditingInstruction,
  selectCurrentTimeline,
} from "@/store/timelineSlice";
import { setUser } from "@/store/authSlice";
import Navigation from "@/pages/Navigation";
import TimelineList from "@/components/Timeline/TimelineList";
import InstructionEditor from "@/components/Instructions/InstructionEditor";
import InstructionsList from "@/components/Instructions/InstructionsList";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import UserProfile from "@/pages/UserProfile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const editingInstruction = useSelector(selectEditingInstruction);
  const currentTimeline = useSelector(selectCurrentTimeline);
  const isFetching = useIsFetching();

  // Single auth check on app load
  useEffect(() => {
    const checkAuthState = async () => {
      const messageId = Date.now().toString();

      window.postMessage(
        {
          source: "injected-app",
          messageId,
          type: "CHECK_AUTH_STATE",
        },
        "*"
      );
    };

    // Add message listener for auth state response
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data &&
        event.data.source === "content-script" &&
        event.data.type === "RESPONSE"
      ) {
        const payload = event.data.payload;
        // Handle both direct user data and nested data structure
        const userData = payload?.user || payload?.data?.user;

        if (userData) {
          dispatch(setUser(userData));
        }
      }
    };

    window.addEventListener("message", handleMessage);
    checkAuthState();

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [dispatch]);

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
    <div className="h-full flex overflow-hidden relative">
      <div className="w-full h-full flex flex-col bg-background text-foreground">
        <Navigation />
        <div className="flex-grow overflow-auto">
          <Routes>
            <Route path="/" element={<TimelineList />} />
            <Route path="/profile" element={<UserProfile />} />
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
      {isFetching > 0 && <LoadingSpinner size="lg" />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
