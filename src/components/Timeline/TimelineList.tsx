import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Plus, Trash2, Edit2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
import { dispatchCustomEvent } from "@/lib/eventSystem";
import { Timeline } from "@/types";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const TimelineList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const timelines = useSelector(selectTimelines);
  const loading = useSelector(selectTimelineLoading);
  const error = useSelector(selectTimelineError);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const videoUrl = window.location.href.split("&")[0];

  useEffect(() => {
    const fetchTimelines = async () => {
      try {
        const fetchedTimelines = await api.timelines.getAll(videoUrl);
        dispatch(setTimelines(fetchedTimelines));
      } catch (error) {
        console.error("Failed to fetch timelines:", error);
      }
    };

    fetchTimelines();
  }, [dispatch]);

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
      dispatchCustomEvent("UPDATE_TIMELINE", { timeline: newTimeline });
      navigate(`/timeline/${newTimeline.id}`);
    } catch (error) {
      console.error("Failed to create timeline:", error);
    }
  };

  const handleEditTimeline = async (timeline: Timeline) => {
    dispatch(setCurrentTimeline(timeline));
    dispatchCustomEvent("UPDATE_TIMELINE", { timeline });
    navigate(`/timeline/${timeline.id}`);
  };

  const handleDeleteTimeline = async (timelineId: string) => {
    try {
      dispatch(setLoading(true));
      await api.timelines.delete(timelineId);
      dispatch(timelineDeleted(timelineId));
      const updatedTimelines = await api.timelines.getAll();
      dispatch(setTimelines(updatedTimelines));
    } catch (error) {
      console.error("Failed to delete timeline:", error);
      dispatch(setError("Failed to delete timeline. Please try again."));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const startEditingTitle = (timeline: Timeline) => {
    setEditingTitleId(timeline.id);
    setNewTitle(timeline.title || "");
  };

  const handleTitleUpdate = async (timelineId: string) => {
    try {
      await api.timelines.update(timelineId, { title: newTitle });
      const updatedTimelines = await api.timelines.getAll();
      dispatch(setTimelines(updatedTimelines));
      setEditingTitleId(null);
    } catch (error) {
      console.error("Failed to update timeline title:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Timeline list</h2>
        <Button onClick={handleCreateTimeline}>
          <Plus size={16} className="mr-2" />
          New Timeline
        </Button>
      </div>

      {error && (
        <div className="text-destructive text-center py-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading timelines...</div>
      ) : timelines.length > 0 ? (
        <div className="space-y-2">
          {timelines.map((timeline) => (
            <div
              key={timeline.id}
              className="flex items-center justify-between p-4 bg-card rounded-lg hover:bg-muted cursor-pointer"
              onClick={() => handleEditTimeline(timeline)}
            >
              <div className="flex-1">
                {editingTitleId === timeline.id ? (
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleTitleUpdate(timeline.id);
                      }
                    }}
                    className="h-9"
                  />
                ) : (
                  <p className="font-medium">{timeline.title}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {editingTitleId === timeline.id ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleTitleUpdate(timeline.id)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTitleId(null)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditingTitle(timeline)}
                    >
                      <Edit2 size={16} className="mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTimeline(timeline.id)}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          You have no timelines. Click "New Timeline" to create one.
        </div>
      )}
    </div>
  );
};

export default TimelineList;
