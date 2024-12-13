import React from "react";
import { useFormContext } from "react-hook-form";
import { Music, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import MediaUpload from "@/components/MediaUpload";
import MediaPositioner, { MediaPosition } from "./MediaPositioner";
import { MediaData } from "@/types";
import { getMediaUrl } from "@/lib/api";

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
    setValue,
    formState: { errors },
  } = useFormContext();

  const overlayMedia = watch("overlayMedia");

  const handleMediaDelete = () => {
    // Only store mediaToDelete if it's an actual uploaded file URL (not a blob)
    if (overlayMedia?.url && !overlayMedia.url.startsWith("blob:")) {
      setValue("mediaToDelete", overlayMedia.url);
    }

    // Clear the overlayMedia and mark form as changed
    setValue("overlayMedia", null, {
      shouldDirty: true,
    });

    // Reset related fields
    setValue("overlayDuration", 5);

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
                type="button"
                variant="destructive"
                label="Delete Media File"
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

      {/* Duration Controls */}
      <div className="space-y-4">
        {/* Overlay Duration */}
        <div className="form-group">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Overlay Duration (seconds)
          </label>
          <Input
            type="number"
            {...register("overlayDuration", {
              required: true,
              min: 0.1,
              valueAsNumber: true,
            })}
          />
          {errors.overlayDuration && (
            <span className="text-xs text-destructive">
              Please enter a valid duration
            </span>
          )}
        </div>

        {/* Media Controls */}
        {overlayMedia?.type.startsWith("video/") && (
          <div className="flex items-center space-x-2">
            <Input
              type="checkbox"
              {...register("muteOverlayMedia")}
              id="muteOverlayMedia"
            />
            <label htmlFor="muteOverlayMedia" className="text-sm">
              Mute Video
            </label>
          </div>
        )}

        {/* Pause Controls */}
        <div className="flex items-center space-x-2">
          <Input
            type="checkbox"
            {...register("pauseMainVideo")}
            id="pauseMainVideo"
          />
          <label htmlFor="pauseMainVideo" className="text-sm">
            Pause Main Video
          </label>
        </div>
      </div>
    </div>
  );
};

const MediaPreview: React.FC<{ media: any }> = ({ media }) => {
  const mediaUrl = React.useMemo(() => {
    if (media.url.startsWith("blob:")) {
      return media.url;
    }
    return getMediaUrl(media.url);
  }, [media.url]);

  if (media.type.startsWith("video/")) {
    return (
      <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
        <video
          src={mediaUrl}
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
          <audio src={mediaUrl} controls className="w-3/4" preload="metadata">
            Your browser does not support the audio tag.
          </audio>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
      <img
        src={mediaUrl}
        className="w-full h-full object-contain"
        alt="Overlay Media"
      />
    </div>
  );
};

export default OverlayInstructionForm;
