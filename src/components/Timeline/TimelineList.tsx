import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft, Plus, Trash2, Edit2 } from "lucide-react";
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

  useEffect(() => {
    const fetchTimelines = async () => {
      try {
        const fetchedTimelines = await api.timelines.getAll();
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
        elements: [],
        instructions: [],
      });
      dispatch(setCurrentTimeline(newTimeline));
      navigate(`/timeline/${newTimeline.id}`);
    } catch (error) {
      console.error("Failed to create timeline:", error);
    }
  };

  const handleEditTimeline = async (timeline: Timeline) => {
    dispatch(setCurrentTimeline(timeline));
    dispatchCustomEvent("SET_TIMELINE", { timeline });
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

  if (loading) {
    return <div className="text-center py-4">Loading timelines...</div>;
  }

  if (error) {
    return <div className="text-destructive text-center py-4">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Timelines</h2>
        <Button onClick={handleCreateTimeline} size="sm">
          <Plus size={16} className="mr-2" />
          New Timeline
        </Button>
      </div>

      <div className="space-y-2">
        {timelines.map((timeline) => (
          <div
            key={timeline.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
          >
            {editingTitleId === timeline.id ? (
              <div className="flex items-center gap-2 flex-1 mr-2">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleTitleUpdate(timeline.id);
                    }
                  }}
                  className="h-8"
                />
                <Button
                  size="sm"
                  onClick={() => handleTitleUpdate(timeline.id)}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTitleId(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <span
                className="font-medium cursor-pointer hover:text-primary"
                onClick={() => startEditingTitle(timeline)}
              >
                {timeline.title}
              </span>
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditTimeline(timeline)}
                className="flex items-center gap-2"
              >
                <Edit2 size={16} />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteTimeline(String(timeline.id))}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 size={16} />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineList;
