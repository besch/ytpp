import React from "react";
import { useFormContext } from "react-hook-form";
import { Music, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import MediaUpload from "@/components/MediaUpload";
import MediaPositioner, { MediaPosition } from "./MediaPositioner";
import { MediaData } from "@/types";

interface OverlayInstructionFormProps {
  onMediaDelete: () => void;
  onMediaSelected: (mediaData: MediaData) => void;
  onPositionChange: (position: MediaPosition) => void;
}

const OverlayInstructionForm: React.FC<OverlayInstructionFormProps> = ({
  onMediaDelete,
  onMediaSelected,
  onPositionChange,
}) => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const overlayMedia = watch("overlayMedia");
  const pauseMainVideo = watch("pauseMainVideo");
  const useOverlayDuration = watch("useOverlayDuration");

  const handleMediaDelete = () => {
    // Call the parent's onMediaDelete handler
    onMediaDelete();
  };

  return (
    <div className="space-y-4">
      {/* Overlay Media Section */}
      <div>
        <label className="text-base text-muted-foreground mb-2 block">
          Overlay Media
        </label>
        {overlayMedia ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-base text-muted-foreground">
                {overlayMedia.name}
              </span>
              <Button
                variant="ghost"
                type="button"
                size="sm"
                onClick={handleMediaDelete}
              >
                <Trash2 size={16} />
              </Button>
            </div>

            <MediaPreview media={overlayMedia} />

            {!overlayMedia.type.startsWith("audio/") && (
              <MediaPositioner
                media={overlayMedia}
                onPositionChange={onPositionChange}
                initialPosition={overlayMedia.position}
              />
            )}
          </div>
        ) : (
          <MediaUpload
            onMediaSelected={onMediaSelected}
            currentMedia={overlayMedia}
          />
        )}
      </div>

      {/* Pause Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register("pauseMainVideo")}
            id="pauseMainVideo"
          />
          <label htmlFor="pauseMainVideo" className="text-base">
            Pause main video
          </label>
        </div>

        {pauseMainVideo && !useOverlayDuration && (
          <div className="form-group m-0">
            <Input
              type="number"
              step="0.1"
              placeholder="Pause duration (seconds)"
              className="text-base"
              {...register("pauseDuration", {
                required: pauseMainVideo && !useOverlayDuration,
                min: 0,
                valueAsNumber: true,
              })}
            />
            {errors.pauseDuration && (
              <span className="text-xs text-destructive">
                Please enter a valid duration
              </span>
            )}
          </div>
        )}
      </div>

      {/* Use Media Duration Option */}
      {(overlayMedia?.type.startsWith("video/") ||
        overlayMedia?.type === "image/gif") && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register("useOverlayDuration")}
            id="useOverlayDuration"
          />
          <label htmlFor="useOverlayDuration" className="text-base">
            Pause main video for media file duration
          </label>
        </div>
      )}

      {/* Duration Input */}
      <div className="form-group">
        <label className="block text-base font-medium text-muted-foreground mb-2">
          Overlay media duration
        </label>
        <Input
          type="number"
          className="text-base"
          {...register("overlayDuration", {
            required: true,
            min: 1,
          })}
        />
        {errors.overlayDuration && (
          <span className="text-xs text-destructive">
            This field is required
          </span>
        )}
      </div>
    </div>
  );
};

const MediaPreview: React.FC<{ media: any }> = ({ media }) => {
  if (media.type.startsWith("video/")) {
    return (
      <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
        <video
          src={media.url}
          className="w-full h-full object-contain"
          controls
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (media.type.startsWith("audio/")) {
    return (
      <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full">
          <Music size={48} className="text-muted-foreground mb-2" />
          <audio src={media.url} controls className="w-3/4" preload="metadata">
            Your browser does not support the audio tag.
          </audio>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
      <img
        src={media.url}
        className="w-full h-full object-contain"
        alt="Overlay Media"
      />
    </div>
  );
};

export default OverlayInstructionForm;
