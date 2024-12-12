import { useFormContext } from "react-hook-form";
import { OverlayInstruction, TimeInput, MediaData } from "@/types";

export const useOverlayInstructionForm = () => {
  const { setValue, watch } = useFormContext();

  const initializeForm = (instruction: OverlayInstruction | null) => {
    if (instruction) {
      setValue("pauseMainVideo", instruction.pauseMainVideo || false);
      setValue("overlayDuration", instruction.overlayDuration || 5);
      setValue("muteOverlayMedia", instruction.muteOverlayMedia || false);

      const overlayMedia = instruction.overlayMedia;
      if (overlayMedia) {
        setValue("overlayMedia", {
          url: overlayMedia.url,
          duration: overlayMedia.duration,
          name: overlayMedia.name,
          type: overlayMedia.type || "video/mp4",
          position: overlayMedia.position,
        });
        setValue(
          "overlayMediaType",
          (overlayMedia.type || "video/mp4").startsWith("video/")
            ? "video"
            : "image"
        );
      } else {
        setValue("overlayMedia", null);
      }
    }
  };

  const buildInstruction = async (
    data: any,
    id: string,
    handleMediaUpload: (file: File) => Promise<string>
  ): Promise<OverlayInstruction> => {
    const triggerTime = parseTimeInput({
      hours: data.hours || 0,
      minutes: data.minutes || 0,
      seconds: data.seconds || 0,
      milliseconds: data.milliseconds || 0,
    });

    let overlayMedia = data.overlayMedia;

    // Handle media upload if there's a new file
    if (data.overlayMedia?.file) {
      const mediaURL = await handleMediaUpload(data.overlayMedia.file);
      overlayMedia = {
        url: mediaURL,
        duration: data.overlayMedia.duration,
        name: data.overlayMedia.name,
        type: data.overlayMedia.type,
        position: data.overlayMedia.position,
      };
    }

    return {
      id,
      type: "overlay",
      triggerTime,
      overlayMedia,
      overlayDuration: data.overlayDuration,
      pauseMainVideo: data.pauseMainVideo,
      muteOverlayMedia: data.muteOverlayMedia || false,
    };
  };

  const handleMediaSelected = (mediaData: MediaData) => {
    setValue("overlayDuration", Math.ceil(mediaData.duration ?? 5));
    setValue("overlayMedia", {
      file: mediaData.file,
      url: mediaData.url,
      duration: mediaData.duration ?? 5,
      name: mediaData.name,
      type: mediaData.type,
      position: {
        x: 32,
        y: 18,
        width: 160,
        height: 90,
      },
    });
    setValue(
      "overlayMediaType",
      mediaData.type.startsWith("video/") ? "video" : "image"
    );
  };

  return {
    initializeForm,
    buildInstruction,
    handleMediaSelected,
  };
};

const parseTimeInput = (data: TimeInput) => {
  return (
    (Number(data.hours) * 3600 +
      Number(data.minutes) * 60 +
      Number(data.seconds)) *
      1000 +
    Number(data.milliseconds || 0)
  );
};
