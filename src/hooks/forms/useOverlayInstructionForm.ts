import { useFormContext } from "react-hook-form";
import { InstructionResponse, MediaData } from "@/types";
import { parseTimeInput } from "@/lib/time";
import config from "@/config";

export const useOverlayInstructionForm = () => {
  const { setValue, watch } = useFormContext();

  const initializeForm = (instruction: InstructionResponse | null) => {
    if (instruction) {
      setValue("pauseMainVideo", instruction.data.pauseMainVideo || false);
      setValue(
        "overlayDuration",
        instruction.data.overlayDuration || config.defaultOverlayDuration
      );
      setValue("muteOverlayMedia", instruction.data.muteOverlayMedia || false);

      const overlayMedia = instruction.data.overlayMedia;
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
  ) => {
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
      overlayMedia,
      overlayDuration: data.overlayDuration,
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
