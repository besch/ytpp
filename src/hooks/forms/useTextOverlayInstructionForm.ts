import { useFormContext } from "react-hook-form";
import { TextOverlayInstruction, TimeInput } from "@/types";

export const useTextOverlayInstructionForm = () => {
  const { setValue } = useFormContext();

  const initializeForm = (instruction: TextOverlayInstruction | null) => {
    if (instruction) {
      setValue("textOverlay", {
        text: instruction.textOverlay.text,
        style: {
          fontFamily: instruction.textOverlay.style.fontFamily,
          fontSize: instruction.textOverlay.style.fontSize,
          color: instruction.textOverlay.style.color,
          backgroundColor:
            instruction.textOverlay.style.backgroundColor || "#000000",
          fontWeight: instruction.textOverlay.style.fontWeight,
          fontStyle: instruction.textOverlay.style.fontStyle || "normal",
          transparentBackground:
            instruction.textOverlay.style.transparentBackground || false,
          textAlign: instruction.textOverlay.style.textAlign || "center",
          opacity: instruction.textOverlay.style.opacity || 1,
          animation: instruction.textOverlay.style.animation || "none",
          textShadow: instruction.textOverlay.style.textShadow || false,
          borderRadius: instruction.textOverlay.style.borderRadius || 0,
          padding: instruction.textOverlay.style.padding || 8,
        },
        position: instruction.textOverlay.position || {
          x: 32,
          y: 18,
          width: 160,
          height: 90,
        },
      });

      setValue("overlayDuration", instruction.overlayDuration);
      setValue("pauseMainVideo", instruction.pauseMainVideo);
    }
  };

  const buildInstruction = (data: any, id: string): TextOverlayInstruction => {
    const triggerTime = parseTimeInput({
      hours: data.hours || 0,
      minutes: data.minutes || 0,
      seconds: data.seconds || 0,
      milliseconds: data.milliseconds || 0,
    });

    return {
      id,
      type: "text-overlay",
      triggerTime,
      textOverlay: {
        text: data.textOverlay.text,
        style: {
          fontFamily: data.textOverlay.style.fontFamily,
          fontSize: Number(data.textOverlay.style.fontSize),
          color: data.textOverlay.style.color,
          backgroundColor: data.textOverlay.style.backgroundColor,
          fontWeight: data.textOverlay.style.fontWeight,
          fontStyle: data.textOverlay.style.fontStyle,
          transparentBackground: data.textOverlay.style.transparentBackground,
          textAlign: data.textOverlay.style.textAlign,
          opacity: Number(data.textOverlay.style.opacity),
          animation: data.textOverlay.style.animation,
          textShadow: data.textOverlay.style.textShadow,
          borderRadius: Number(data.textOverlay.style.borderRadius),
          padding: Number(data.textOverlay.style.padding),
        },
        position: data.textOverlay.position,
      },
      overlayDuration: Number(data.overlayDuration),
      pauseMainVideo: data.pauseMainVideo,
      pauseDuration: data.pauseMainVideo
        ? Number(data.pauseDuration)
        : undefined,
    };
  };

  return {
    initializeForm,
    buildInstruction,
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
