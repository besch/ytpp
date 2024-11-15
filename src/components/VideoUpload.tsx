import React, { useRef, useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { Upload } from "lucide-react";

interface VideoUploadProps {
  onVideoSelected: (videoData: {
    file: File;
    url: string;
    duration: number;
    name: string;
    type: string;
  }) => void;
  currentVideo?: {
    url: string;
    name?: string;
    duration?: number;
  };
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  onVideoSelected,
  currentVideo,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setVideoError(null);

    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;

      await new Promise((resolve, reject) => {
        video.addEventListener("loadedmetadata", () => {
          const duration = video.duration;
          onVideoSelected({
            file,
            url,
            duration,
            name: file.name,
            type: file.type,
          });
          resolve(null);
        });
        video.addEventListener("error", () => {
          reject(new Error("Failed to load video"));
        });
      });
    } catch (error) {
      console.error("Error processing video:", error);
      setVideoError("Failed to load video. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const VideoPlayer = ({ src, title }: { src: string; title?: string }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {title || "Video Preview"}
        </p>
      </div>
      <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain"
          controls
          preload="metadata"
          onError={() => setVideoError("Failed to load video")}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );

  useEffect(() => {
    if (currentVideo?.url) {
      const video = document.createElement("video");
      video.src = currentVideo.url;
      video.addEventListener("error", () => {
        setVideoError("Failed to load existing video");
      });
    }
  }, [currentVideo]);

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={inputRef}
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {currentVideo ? "Change Video" : "Upload Video"}
        </Button>

        {videoError && <p className="text-sm text-destructive">{videoError}</p>}

        {currentVideo?.url && (
          <VideoPlayer
            src={currentVideo.url}
            title={
              currentVideo.name ||
              `Video${
                currentVideo.duration
                  ? ` (${Math.round(currentVideo.duration)}s)`
                  : ""
              }`
            }
          />
        )}
      </div>
    </div>
  );
};

export default VideoUpload;
