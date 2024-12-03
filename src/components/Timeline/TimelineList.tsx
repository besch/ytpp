import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  selectTimelines,
  selectTimelineLoading,
  selectTimelineError,
  setCurrentTimeline,
  setTimelines,
  timelineDeleted,
  setLoading,
  setError,
} from "@/store/timelineSlice";
import { Timeline } from "@/types";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { selectUser } from "@/store/authSlice";

const TimelineList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const timelines = useSelector(selectTimelines);
  const loading = useSelector(selectTimelineLoading);
  const error = useSelector(selectTimelineError);
  const videoUrl = window.location.href.split("&")[0];
  const user = useSelector(selectUser);

  useEffect(() => {
    const fetchTimelines = async () => {
      try {
        const fetchedTimelines = await api.timelines.getAll(videoUrl);
        dispatch(setTimelines(fetchedTimelines));
      } catch (error) {
        console.error("Failed to fetch timelines:", error);
        dispatch(setError("Failed to fetch timelines"));
      }
    };

    fetchTimelines();
  }, [dispatch, videoUrl]);

  const handleCreateTimeline = async () => {
    try {
      const newTimeline = await api.timelines.create({
        id: Date.now().toString(),
        title: "New Timeline",
        video_url: videoUrl,
        elements: [],
        instructions: [],
      });
      dispatch(setCurrentTimeline(newTimeline));
      navigate(`/timeline/${newTimeline.id}`);
    } catch (error) {
      console.error("Failed to create timeline:", error);
      dispatch(setError("Failed to create timeline"));
    }
  };

  const handleEditTimeline = async (timeline: Timeline) => {
    dispatch(setCurrentTimeline(timeline));
    navigate(`/timeline/${timeline.id}`);
  };

  const handleDeleteTimeline = async (timelineId: string) => {
    try {
      dispatch(setLoading(true));
      await api.timelines.delete(timelineId);
      dispatch(timelineDeleted(timelineId));
      const updatedTimelines = await api.timelines.getAll(videoUrl);
      dispatch(setTimelines(updatedTimelines));
    } catch (error) {
      console.error("Failed to delete timeline:", error);
      dispatch(setError("Failed to delete timeline. Please try again."));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const isTimelineOwner = (timeline: Timeline) => {
    return user?.id === timeline.user_id;
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Timelines</h1>
        <Button onClick={handleCreateTimeline}>
          <Plus size={16} className="mr-3" />
          New Timeline
        </Button>
      </div>

      {error && (
        <div className="text-destructive text-lg text-center py-6">{error}</div>
      )}

      {loading ? (
        <div className="text-lg text-center py-6">Loading timelines...</div>
      ) : timelines.length > 0 ? (
        <div className="space-y-4">
          {timelines.map((timeline) => (
            <div
              key={timeline.id}
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
                {isTimelineOwner(timeline) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTimeline(timeline.id);
                    }}
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
