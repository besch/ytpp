import React, { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { Upload } from "lucide-react";

interface MediaData {
  file: File;
  url: string;
  duration?: number;
  name: string;
  type: string;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface MediaUploadProps {
  onMediaSelected: (mediaData: MediaData) => void;
  currentMedia?: {
    url: string;
    duration?: number;
    name?: string;
    type: string;
    position?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  } | null;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  onMediaSelected,
  currentMedia,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMediaError(null);

    try {
      const url = URL.createObjectURL(file);
      let duration: number | undefined;

      if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
        duration = await getMediaDuration(url, file.type);
      } else {
        duration = 5;
      }

      onMediaSelected({
        file,
        url,
        duration,
        name: file.name,
        type: file.type,
      });
    } catch (error) {
      console.error("Error processing media:", error);
      setMediaError("Failed to load media. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getMediaDuration = (
    url: string,
    mediaType: string
  ): Promise<number> => {
    return new Promise((resolve, reject) => {
      let mediaElement: HTMLMediaElement;

      if (mediaType.startsWith("video/")) {
        mediaElement = document.createElement("video");
      } else if (mediaType.startsWith("audio/")) {
        mediaElement = document.createElement("audio");
      } else {
        return resolve(5);
      }

      mediaElement.src = url;
      mediaElement.addEventListener("loadedmetadata", () => {
        resolve(mediaElement.duration);
      });
      mediaElement.addEventListener("error", () => {
        reject(new Error("Failed to load media"));
      });
    });
  };

  const MediaPreview: React.FC<{ src: string; type: string }> = ({
    src,
    type,
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Media Preview</p>
      </div>
      <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
        {type.startsWith("video/") ? (
          <video
            src={src}
            className="w-full h-full object-contain"
            controls
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        ) : type.startsWith("audio/") ? (
          <audio src={src} className="w-full" controls preload="metadata">
            Your browser does not support the audio tag.
          </audio>
        ) : (
          <img
            src={src}
            className="w-full h-full object-contain"
            alt="Media Preview"
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={inputRef}
        accept="video/*, image/*, audio/*"
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
          {currentMedia ? "Change Media" : "Upload Media"}
        </Button>

        {mediaError && <p className="text-sm text-destructive">{mediaError}</p>}

        {currentMedia?.url && currentMedia.type && (
          <MediaPreview src={currentMedia.url} type={currentMedia.type} />
        )}
      </div>
    </div>
  );
};

export default MediaUpload;
