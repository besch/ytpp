import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import { setCurrentTimeline } from "@/store/timelineSlice";
import { Timeline } from "@/types";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { VerifiedBadge } from "@/components/VerifiedBadge";
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
    queryFn: async () => await api.timelines.getAll(videoUrl),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });

  // Mutation for creating timeline
  const createTimelineMutation = useMutation({
    mutationFn: (newTimeline: Partial<Timeline>) =>
      api.timelines.create(newTimeline),
    onSuccess: (newTimeline) => {
      const timelineWithDefaults = {
        ...newTimeline,
        is_youtube_channel_owner: newTimeline.is_youtube_channel_owner ?? false,
      };
      dispatch(setCurrentTimeline(timelineWithDefaults as Timeline));
      navigate(`/timeline/${timelineWithDefaults.id}`);
      queryClient.invalidateQueries({ queryKey: ["timelines"] });
    },
    onError: (error) => {
      if (
        error instanceof Error &&
        error.message.includes("youtube_channel_owner")
      ) {
        const errorResponse = error.cause as any;
        if (errorResponse?.data?.id) {
          const timeline = {
            ...errorResponse.data,
            is_youtube_channel_owner: false,
          };
          dispatch(setCurrentTimeline(timeline as Timeline));
          navigate(`/timeline/${timeline.id}`);
          queryClient.invalidateQueries({ queryKey: ["timelines"] });
          return;
        }
      }
      console.error("Failed to create timeline:", error);
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
    },
  });

  const handleReaction = async (
    timeline: Timeline,
    type: "like" | "dislike"
  ) => {
    if (!isAuthenticated) {
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
    });
  };

  const handleEditTimeline = async (timeline: Timeline) => {
    dispatch(setCurrentTimeline(timeline));
    navigate(`/timeline/${timeline.id}`);
  };

  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (error) {}
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
              className="p-3 bg-muted/10 border border-border rounded-lg hover:bg-muted/20 cursor-pointer"
              onClick={() => handleEditTimeline(timeline)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-medium">{timeline.title}</p>
                    {timelineOwnerships[index] && (
                      <span className="px-2 py-0.5 text-xs bg-primary/90 text-white rounded-full">
                        Owner
                      </span>
                    )}
                    {timeline.is_youtube_channel_owner && (
                      <VerifiedBadge className="ml-1" />
                    )}
                  </div>
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
                <div
                  className="flex items-center gap-4"
                  onClick={(e) => e.stopPropagation()}
                >
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
