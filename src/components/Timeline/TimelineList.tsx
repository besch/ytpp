import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import { setCurrentTimeline, timelineDeleted } from "@/store/timelineSlice";
import { Timeline } from "@/types";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "react-toastify";
import { selectIsTimelineOwner } from "@/store/authSlice";
import { RootState, store } from "@/store";
import { useAPI } from "@/hooks/useAPI";

const TimelineList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const api = useAPI();
  const videoUrl = window.location.href.split("&")[0];

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
      console.log("TimelineList received response:", response, 
        "Type:", typeof response, 
        "Is Array:", Array.isArray(response));
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

  // Mutation for deleting timeline
  const deleteTimelineMutation = useMutation({
    mutationFn: (timelineId: string) => api.timelines.delete(timelineId),
    onSuccess: (_, timelineId) => {
      dispatch(timelineDeleted(timelineId));
      queryClient.invalidateQueries({ queryKey: ["timelines"] });
      toast.success("Timeline deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete timeline:", error);
      toast.error("Failed to delete timeline. Please try again.");
    },
  });

  // Fetch ownership status for each timeline
  const timelineOwnerships = useMemo(() => {
    return timelines.map((timeline) =>
      selectIsTimelineOwner(store.getState() as RootState, timeline)
    );
  }, [timelines]);

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

  const handleDeleteTimeline = async (timelineId: string) => {
    deleteTimelineMutation.mutate(timelineId);
  };

  if (error) {
    return (
      <div className="text-destructive text-lg text-center py-6">
        {error instanceof Error ? error.message : "Failed to fetch timelines"}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Timelines</h1>
        <Button
          onClick={handleCreateTimeline}
          disabled={createTimelineMutation.isPending}
        >
          <Plus size={16} className="mr-3" />
          New Timeline
        </Button>
      </div>

      {isLoading || createTimelineMutation.isPending ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : Array.isArray(timelines) && timelines.length > 0 ? (
        <div className="space-y-4">
          {timelines.map((timeline, index) => (
            <div
              key={`${timeline.id}-${index}`}
              className="flex items-center justify-between p-6 bg-card rounded-lg hover:bg-muted/10"
            >
              <div className="flex-1">
                <p
                  className="text-lg font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleEditTimeline(timeline)}
                >
                  {timeline.title}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {timeline.users && (
                    <>
                      <img
                        src={timeline.users.picture}
                        alt={timeline.users.name}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-sm text-muted-foreground">
                        {timeline.users.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {timelineOwnerships[timelines.indexOf(timeline)] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTimeline(timeline.id);
                    }}
                    disabled={deleteTimelineMutation.isPending}
                  >
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-lg text-muted-foreground">
          You have no timelines. Click "New Timeline" to create one.
        </div>
      )}
    </div>
  );
};

export default TimelineList;
