import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "@/store/authSlice";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAPI } from "@/hooks/useAPI";
import { Timeline } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, ThumbsDown, Clock, Search } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { setCurrentTimeline } from "@/store/timelineSlice";

const UserProfile: React.FC = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const api = useAPI();
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch();

  const { data: timelines, isLoading } = useQuery({
    queryKey: ["userTimelines"],
    queryFn: () => api.timelines.getAll(),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="p-8 text-center">Please log in to view your profile</div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filteredTimelines = timelines?.filter(
    (timeline: Timeline) =>
      timeline.user_id === user.id &&
      (searchTerm === "" ||
        timeline.video_url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        timeline.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleTimelineClick = (timeline: Timeline) => {
    dispatch(setCurrentTimeline(timeline));
    navigate(`/timeline/${timeline.id}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <img
          src={user.picture}
          alt={user.name}
          className="w-16 h-16 rounded-full"
        />
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your timelines..."
            className="w-full pl-14 pr-4 py-2 border border-border rounded-md bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredTimelines?.map((timeline: Timeline) => (
          <div
            key={timeline.id}
            className="p-4 border border-border rounded-lg hover:border-primary cursor-pointer"
            onClick={() => handleTimelineClick(timeline)}
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-semibold">{timeline.title}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  {timeline.likes_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsDown className="w-4 h-4" />
                  {timeline.dislikes_count || 0}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2 truncate">
              {timeline.video_url}
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Created {formatDistanceToNow(new Date(timeline.created_at))} ago
              </span>
              {timeline.updated_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Updated {formatDistanceToNow(
                    new Date(timeline.updated_at)
                  )}{" "}
                  ago
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserProfile;
