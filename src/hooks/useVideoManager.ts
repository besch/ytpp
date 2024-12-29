import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { VideoManager } from "@/lib/VideoManager";
import {
  selectInstructions,
  selectCurrentTime,
  setCurrentTime,
  selectVideoElementId,
} from "@/store/timelineSlice";
import { Instruction } from "@/types";

export function useVideoManager() {
  const dispatch = useDispatch();
  const videoManagerRef = useRef<VideoManager | null>(null);
  const instructions = useSelector(selectInstructions);
  const currentTime = useSelector(selectCurrentTime);
  const videoElementId = useSelector(selectVideoElementId);

  useEffect(() => {
    if (!videoElementId) return;

    videoManagerRef.current = new VideoManager();
    const videoElement = document.getElementById(
      videoElementId
    ) as HTMLVideoElement;

    if (videoElement) {
      videoManagerRef.current.setVideoElement(videoElement);

      // Add time update listener to sync with Redux
      videoManagerRef.current.addTimeUpdateListener((timeMs) => {
        dispatch(setCurrentTime(timeMs));
      });
    }

    return () => {
      if (videoManagerRef.current) {
        videoManagerRef.current.destroy();
        videoManagerRef.current = null;
      }
    };
  }, [dispatch, videoElementId]);

  // Update instructions when they change
  useEffect(() => {
    if (videoManagerRef.current) {
      videoManagerRef.current.setInstructions(instructions as Instruction[]);
    }
  }, [instructions]);

  return videoManagerRef.current;
}
