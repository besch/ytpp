import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import { setCurrentTimeline } from "@/store/timelineSlice";
import { Timeline } from "@/types";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "react-toastify";
import {
  selectIsTimelineOwner,
  selectIsAuthenticated,
} from "@/store/authSlice";
import { RootState, store } from "@/store";
import { useAPI } from "@/hooks/useAPI";

const TimelineList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const api = useAPI();
  const videoUrl = window.location.href.split("&")[0];
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Query for fetching timelines
  const {
    data: timelines = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["timelines", videoUrl],
    queryFn: async () => {
      console.log("TimelineList queryFn called");
      const response = await api.timelines.getAll(videoUrl);
      console.log(
        "TimelineList received response:",
        response,
        "Type:",
        typeof response,
        "Is Array:",
        Array.isArray(response)
      );
      return response;
    },
  });

  // Mutation for creating timeline
  const createTimelineMutation = useMutation({
    mutationFn: (newTimeline: Partial<Timeline>) =>
      api.timelines.create(newTimeline),
    onSuccess: (newTimeline) => {
      dispatch(setCurrentTimeline(newTimeline));
      navigate(`/timeline/${newTimeline.id}`);
      queryClient.invalidateQueries({ queryKey: ["timelines"] });
    },
    onError: (error) => {
      console.error("Failed to create timeline:", error);
      toast.error("Failed to create timeline");
    },
  });

  // Fetch ownership status for each timeline
  const timelineOwnerships = useMemo(() => {
    if (!isAuthenticated) return timelines.map(() => false);
    return timelines.map((timeline) =>
      selectIsTimelineOwner(store.getState() as RootState, timeline)
    );
  }, [timelines, isAuthenticated]);

  const handleCreateTimeline = async () => {
    createTimelineMutation.mutate({
      id: Date.now().toString(),
      title: "New Timeline",
      video_url: videoUrl,
      instructions: [],
    });
  };

  const handleEditTimeline = async (timeline: Timeline) => {
    dispatch(setCurrentTimeline(timeline));
    navigate(`/timeline/${timeline.id}`);
  };

  if (error) {
    return (
      <div className="text-destructive text-lg text-center py-6">
        {error instanceof Error ? error.message : "Failed to fetch timelines"}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Timelines</h1>
        <Button
          onClick={handleCreateTimeline}
          disabled={createTimelineMutation.isPending}
        >
          <Plus className="w-4 h-4 mr-4" />
          New Timeline
        </Button>
      </div>

      {isLoading || createTimelineMutation.isPending ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : Array.isArray(timelines) && timelines.length > 0 ? (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {timelines.map((timeline, index) => (
            <div
              key={`${timeline.id}-${index}`}
              className="p-3 bg-muted/10 border border-border rounded-lg hover:bg-muted/20 flex items-center justify-between"
              onClick={() => handleEditTimeline(timeline)}
            >
              <div>
                <h1 className="font-medium">{timeline.title}</h1>
                {timeline.users && (
                  <div className="flex items-center gap-2 mt-1">
                    <img
                      src={timeline.users.picture}
                      alt={timeline.users.name}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-sm text-muted-foreground">
                      {timeline.users.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No timelines yet. Click the button above to create one.
        </div>
      )}
    </div>
  );
};

export default TimelineList;
