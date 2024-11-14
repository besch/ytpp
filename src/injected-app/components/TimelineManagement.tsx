import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dispatchCustomEvent, addCustomEventListener } from "@/lib/eventSystem";
import {
  selectTimelines,
  selectCurrentTimeline,
  selectTimelineLoading,
  selectTimelineError,
} from "@/store/timelineSlice";
import { Timeline } from "@/types";

export const TimelineManagement: React.FC = () => {
  const [view, setView] = useState<"list" | "edit">("list");
  const dispatch = useDispatch();

  // Use the correct selectors
  const timelines = useSelector(selectTimelines);
  const currentTimeline = useSelector(selectCurrentTimeline);
  const loading = useSelector(selectTimelineLoading);
  const error = useSelector(selectTimelineError);

  useEffect(() => {
    // Load timelines on component mount
    dispatchCustomEvent("GET_TIMELINES");

    const listener = addCustomEventListener(
      "SET_TIMELINES",
      ({ timelines }) => {
        dispatch({ type: "timeline/setTimelines", payload: timelines });
      }
    );

    return () => listener();
  }, []);

  const handleEditTimeline = (timelineId: string) => {
    dispatchCustomEvent("LOAD_TIMELINE", { timelineId });
    setView("edit");
  };

  const handleDeleteTimeline = (timelineId: string) => {
    dispatchCustomEvent("DELETE_TIMELINE", { timelineId });
  };

  return (
    <div>
      {view === "list" ? (
        <>
          <button onClick={() => dispatchCustomEvent("INITIALIZE_TIMELINE")}>
            Add Timeline
          </button>
          <div className="timelines-list">
            {timelines.map((timeline) => (
              <div key={timeline.id} className="timeline-item">
                <span>{timeline.title}</span>
                <button onClick={() => handleEditTimeline(timeline.id)}>
                  Edit
                </button>
                <button onClick={() => handleDeleteTimeline(timeline.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="timeline-edit">
          <button onClick={() => setView("list")}>Back to List</button>
          {/* Timeline editing interface */}
        </div>
      )}
    </div>
  );
};
