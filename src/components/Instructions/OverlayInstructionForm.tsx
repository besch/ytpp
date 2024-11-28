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
    setValue,
    formState: { errors },
  } = useFormContext();
  const overlayMedia = watch("overlayMedia");

  return (
    <div className="space-y-4">
      <div>
        <label className="text-muted-foreground mb-2 block">
          Overlay Media
        </label>
        {overlayMedia ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{overlayMedia.name}</span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onMediaDelete}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
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

      {overlayMedia && <OverlayControls />}
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

const OverlayControls: React.FC = () => {
  const { register, watch } = useFormContext();
  const overlayMedia = watch("overlayMedia");

  return (
    <>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          {...register("pauseMainVideo")}
          id="pauseMainVideo"
        />
        <label htmlFor="pauseMainVideo" className="text-sm">
          Pause Main Video
        </label>
      </div>

      {watch("pauseMainVideo") && <PauseControls />}

      <DurationInputs />
    </>
  );
};

const PauseControls: React.FC = () => {
  const { register, watch } = useFormContext();
  const overlayMedia = watch("overlayMedia");
  const useOverlayDuration = watch("useOverlayDuration");

  return (
    <>
      {(overlayMedia.type.startsWith("video/") ||
        overlayMedia.type === "image/gif") && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register("useOverlayDuration")}
            id="useOverlayDuration"
          />
          <label htmlFor="useOverlayDuration" className="text-sm">
            Pause for full media file duration
          </label>
        </div>
      )}
    </>
  );
};

const DurationInputs: React.FC = () => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();
  const useOverlayDuration = watch("useOverlayDuration");
  const pauseMainVideo = watch("pauseMainVideo");
  const overlayMedia = watch("overlayMedia");

  return (
    <>
      {pauseMainVideo && !useOverlayDuration && (
        <div>
          <label className="text-sm text-muted-foreground">
            Pause Duration (seconds)
          </label>
          <Input
            type="number"
            step="0.1"
            {...register("pauseDuration", {
              required: true,
              min: 0,
              valueAsNumber: true,
            })}
            disabled={useOverlayDuration}
          />
          {errors.pauseDuration && (
            <span className="text-xs text-destructive">
              This field is required
            </span>
          )}
        </div>
      )}

      <div>
        <label className="text-sm text-muted-foreground">
          Overlay Duration (seconds)
        </label>
        <Input
          type="number"
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
    </>
  );
};

export default OverlayInstructionForm;
