import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
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
    refetch,
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
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
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

  // Mutation for adding reaction
  const addReactionMutation = useMutation({
    mutationFn: ({
      timelineId,
      type,
    }: {
      timelineId: number;
      type: "like" | "dislike";
    }) => api.timelines.addReaction(timelineId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timelines", videoUrl] });
    },
    onError: (error) => {
      console.error("Failed to add reaction:", error);
      toast.error("Failed to add reaction");
    },
  });

  // Mutation for removing reaction
  const removeReactionMutation = useMutation({
    mutationFn: (timelineId: number) =>
      api.timelines.removeReaction(timelineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timelines", videoUrl] });
    },
    onError: (error) => {
      console.error("Failed to remove reaction:", error);
      toast.error("Failed to remove reaction");
    },
  });

  const handleReaction = async (
    timeline: Timeline,
    type: "like" | "dislike"
  ) => {
    if (!isAuthenticated) {
      toast.error("Please log in to react to timelines");
      return;
    }

    try {
      if (timeline.user_reaction === type) {
        await removeReactionMutation.mutateAsync(timeline.id);
      } else {
        await addReactionMutation.mutateAsync({
          timelineId: timeline.id,
          type,
        });
      }
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
  };

  // Fetch ownership status for each timeline
  const timelineOwnerships = useMemo(() => {
    if (!isAuthenticated) return timelines.map(() => false);
    return timelines.map((timeline) =>
      selectIsTimelineOwner(store.getState() as RootState, timeline)
    );
  }, [timelines, isAuthenticated]);

  const handleCreateTimeline = async () => {
    createTimelineMutation.mutate({
      title: "New Timeline",
      video_url: videoUrl,
      instructions: [],
    });
  };

  const handleEditTimeline = async (timeline: Timeline) => {
    dispatch(setCurrentTimeline(timeline));
    navigate(`/timeline/${timeline.id}`);
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Timelines refreshed");
    } catch (error) {
      toast.error("Failed to refresh timelines");
    }
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
        <div className="flex items-center gap-2">
          <p className="text-lg font-medium">Timelines</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1 h-auto"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
        <Button
          onClick={handleCreateTimeline}
          disabled={createTimelineMutation.isPending}
        >
          <Plus className="w-4 h-4 mr-2" />
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
              className="p-3 bg-muted/10 border border-border rounded-lg hover:bg-muted/20"
            >
              <div className="flex items-center justify-between">
                <div
                  className="cursor-pointer"
                  onClick={() => handleEditTimeline(timeline)}
                >
                  <p className="text-lg font-medium">{timeline.title}</p>
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
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReaction(timeline, "like")}
                      className={`p-1 rounded hover:bg-muted/20 ${
                        timeline.user_reaction === "like" ? "text-primary" : ""
                      }`}
                      disabled={!isAuthenticated}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <span className="text-sm">{timeline.likes_count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReaction(timeline, "dislike")}
                      className={`p-1 rounded hover:bg-muted/20 ${
                        timeline.user_reaction === "dislike"
                          ? "text-primary"
                          : ""
                      }`}
                      disabled={!isAuthenticated}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                    <span className="text-sm">{timeline.dislikes_count}</span>
                  </div>
                </div>
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
