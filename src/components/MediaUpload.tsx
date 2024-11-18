import React, { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { Upload } from "lucide-react";

interface MediaUploadProps {
  onMediaSelected: (mediaData: {
    file: File;
    url: string;
    duration?: number; // duration is optional for images/GIFs
    name: string;
    type: string;
  }) => void;
  currentMedia?: {
    url: string;
    name?: string;
    duration?: number;
    type: string;
  };
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

      if (file.type.startsWith("video/")) {
        duration = await getMediaDuration(url);
      } else {
        // Set a default duration for images/GIFs if needed
        duration = 5; // Default duration in seconds for images/GIFs
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

  const getMediaDuration = (url: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const media = document.createElement("video");
      media.src = url;
      media.addEventListener("loadedmetadata", () => {
        resolve(media.duration);
      });
      media.addEventListener("error", () => {
        reject(new Error("Failed to load media"));
      });
    });
  };

  const MediaPreview = ({ src, type }: { src: string; type: string }) => (
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
        accept="video/*, image/*"
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

        {currentMedia?.url && (
          <MediaPreview src={currentMedia.url} type={currentMedia.type} />
        )}
      </div>
    </div>
  );
};

export default MediaUpload;
