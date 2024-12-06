import React, { useState } from "react";
import { Edit2, Check, X, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { setCurrentTimeline, selectCurrentTimeline } from "@/store/timelineSlice";
import { selectIsTimelineOwner } from "@/store/authSlice";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RootState } from "@/store";

const TimelineTitle: React.FC = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  
  const timeline = useSelector(selectCurrentTimeline);
  const isOwner = useSelector((state: RootState) => 
    selectIsTimelineOwner(state, timeline)
  );

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!timeline) return;
      return api.timelines.update(timeline.id, { title: newTitle });
    },
    onSuccess: (updatedTimeline) => {
      if (timeline && updatedTimeline) {
        dispatch(
          setCurrentTimeline({
            ...timeline,
            title: newTitle,
            id: timeline.id,
            video_url: timeline.video_url,
            elements: timeline.elements,
            instructions: timeline.instructions,
            user_id: timeline.user_id,
          })
        );
        queryClient.invalidateQueries({ queryKey: ["timelines"] });
        setEditingTitle(false);
      }
    },
    onError: (error) => {
      console.error("Failed to update timeline title:", error);
    },
  });

  const handleStartEditingTitle = () => {
    setEditingTitle(true);
    setNewTitle(timeline?.title || "");
  };

  const handleSaveTitle = () => {
    updateMutation.mutate();
  };

  return (
    <div className="flex items-center gap-2">
      {editingTitle ? (
        <div className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSaveTitle();
              }
            }}
            className="h-8 text-lg"
          />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSaveTitle}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} className="text-green-500" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingTitle(false)}
            disabled={updateMutation.isPending}
          >
            <X size={16} className="text-destructive" />
          </Button>
        </div>
      ) : (
        <>
          <h1 className="text-lg font-medium">{timeline?.title}</h1>
          {isOwner && (
            <Button variant="ghost" size="sm" onClick={handleStartEditingTitle}>
              <Edit2 size={16} />
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default TimelineTitle;