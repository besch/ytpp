import React, { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import Button from "@/components/ui/Button";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMediaUrl } from "@/lib/api";

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

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    handleFileProcessing(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [],
      "image/*": [],
      "audio/*": [],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleFileProcessing = async (file: File) => {
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

  const MediaPreview = React.memo<{ src: string; type: string }>(
    ({ src, type }) => (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Media Preview</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onMediaSelected({ file: null, url: "", type: "" } as any)
            }
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
          {type.startsWith("video/") ? (
            <video
              src={src.startsWith('blob:') ? src : getMediaUrl(src)}
              className="w-full h-full object-contain"
              controls
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : type.startsWith("audio/") ? (
            <audio 
              src={src.startsWith('blob:') ? src : getMediaUrl(src)} 
              className="w-full" 
              controls 
              preload="metadata"
            >
              Your browser does not support the audio tag.
            </audio>
          ) : (
            <img
              src={src.startsWith('blob:') ? src : getMediaUrl(src)}
              className="w-full h-full object-contain"
              alt="Media Preview"
            />
          )}
        </div>
      </div>
    )
  );

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-muted hover:border-primary/50",
          isLoading && "opacity-50 cursor-wait"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <div className="text-sm">
            <p className="font-medium">
              {isDragActive ? "Drop the file here" : "Drag & drop media here"}
            </p>
            <p className="text-muted-foreground">or click to select files</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Supports video, audio, and image files
          </p>
        </div>
      </div>

      {mediaError && <p className="text-sm text-destructive">{mediaError}</p>}

      {currentMedia?.url && currentMedia.type && (
        <MediaPreview src={currentMedia.url} type={currentMedia.type} />
      )}
    </div>
  );
};

export default MediaUpload;
