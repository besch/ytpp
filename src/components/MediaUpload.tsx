import React, { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMediaUrl } from "@/lib/api";
import MediaRecorder from "./MediaRecorder";
import { MediaData } from "@/types";

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
  const [showRecorder, setShowRecorder] = useState(false);

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

  const handleRecordingComplete = async (mediaData: MediaData) => {
    setIsLoading(true);
    setMediaError(null);

    try {
      if (mediaData.file) {
        const url = URL.createObjectURL(mediaData.file);
        const duration = await getMediaDuration(url, mediaData.type);

        onMediaSelected({
          ...mediaData,
          duration,
        });
      }
    } catch (error) {
      console.error("Error processing recorded media:", error);
      setMediaError("Failed to process recording. Please try again.");
    } finally {
      setIsLoading(false);
      setShowRecorder(false);
    }
  };

  const MediaPreview: React.FC<{ src: string; type: string }> = React.memo(
    ({ src, type }) => {
      const mediaUrl = React.useMemo(() => {
        if (src.startsWith("blob:")) {
          return src;
        }
        if (src.startsWith("http://") || src.startsWith("https://")) {
          const filename = src.split("/").pop();
          if (filename) {
            return getMediaUrl(filename);
          }
        }
        return getMediaUrl(src);
      }, [src]);

      return (
        <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
          {type.startsWith("video/") ? (
            <video
              src={mediaUrl}
              className="w-full h-full object-contain"
              controls
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : type.startsWith("audio/") ? (
            <audio
              src={mediaUrl}
              className="w-full"
              controls
              preload="metadata"
            >
              Your browser does not support the audio tag.
            </audio>
          ) : (
            <img
              src={mediaUrl}
              className="w-full h-full object-contain"
              alt="Media Preview"
              loading="lazy"
            />
          )}
        </div>
      );
    }
  );

  return (
    <div className="space-y-4">
      {!showRecorder ? (
        <>
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
                  {isDragActive
                    ? "Drop the file here"
                    : "Drag & drop media here"}
                </p>
                <p className="text-muted-foreground">
                  or click to select files
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports video, audio, and image files
              </p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowRecorder(true);
              }}
              className="text-sm text-white hover:underline"
            >
              Or record audio/video directly
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <MediaRecorder
            onRecordingComplete={handleRecordingComplete}
            currentMedia={currentMedia}
          />
          <button
            onClick={() => setShowRecorder(false)}
            className="text-sm text-muted-foreground hover:underline block w-full text-center"
          >
            Cancel recording
          </button>
        </div>
      )}

      {mediaError && <p className="text-sm text-destructive">{mediaError}</p>}

      {currentMedia?.url && currentMedia.type && !showRecorder && (
        <MediaPreview src={currentMedia.url} type={currentMedia.type} />
      )}
    </div>
  );
};

export default MediaUpload;
