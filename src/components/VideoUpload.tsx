import React, { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { Upload } from "lucide-react";

interface VideoUploadProps {
  onVideoSelected: (videoData: { url: string; duration: number }) => void;
  currentVideo?: { url: string };
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  onVideoSelected,
  currentVideo,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Create object URL for the video
      const url = URL.createObjectURL(file);

      // Get video duration
      const video = document.createElement("video");
      video.src = url;

      await new Promise((resolve) => {
        video.addEventListener("loadedmetadata", () => {
          const duration = video.duration;
          onVideoSelected({ url, duration });
          resolve(null);
        });
      });
    } catch (error) {
      console.error("Error processing video:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={inputRef}
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />
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

      {currentVideo && (
        <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
          <video
            src={currentVideo.url}
            className="w-full h-full object-contain"
            controls
          />
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
