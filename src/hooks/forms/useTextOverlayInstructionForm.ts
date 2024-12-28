import { useFormContext } from "react-hook-form";
import { InstructionResponse } from "@/types";
import { parseTimeInput } from "@/lib/time";
import config from "@/lib/config";

export const useTextOverlayInstructionForm = () => {
  const { setValue } = useFormContext();

  const initializeForm = (instruction: InstructionResponse | null) => {
    // Set default values if no instruction is provided (new instruction)
    const defaultValues = {
      text: "",
      style: {
        fontFamily: "Arial",
        fontSize: 20,
        color: "#ffffff",
        backgroundColor: "#000000",
        fontWeight: "normal",
        fontStyle: "normal",
        transparentBackground: false,
        textAlign: "center",
        opacity: 1,
        animation: "none",
        textShadow: false,
        borderRadius: 0,
        padding: 8,
      },
      position: {
        x: 32,
        y: 18,
        width: 160,
        height: 90,
      },
    };

    setValue(
      "textOverlay",
      instruction?.data.textOverlay
        ? {
            text: instruction.data.textOverlay.text || defaultValues.text,
            style: {
              fontFamily:
                instruction.data.textOverlay.style?.fontFamily ||
                defaultValues.style.fontFamily,
              fontSize:
                instruction.data.textOverlay.style?.fontSize ||
                defaultValues.style.fontSize,
              color:
                instruction.data.textOverlay.style?.color ||
                defaultValues.style.color,
              backgroundColor:
                instruction.data.textOverlay.style?.backgroundColor ||
                defaultValues.style.backgroundColor,
              fontWeight:
                instruction.data.textOverlay.style?.fontWeight ||
                defaultValues.style.fontWeight,
              fontStyle:
                instruction.data.textOverlay.style?.fontStyle ||
                defaultValues.style.fontStyle,
              transparentBackground:
                instruction.data.textOverlay.style?.transparentBackground ||
                defaultValues.style.transparentBackground,
              textAlign:
                instruction.data.textOverlay.style?.textAlign ||
                defaultValues.style.textAlign,
              opacity:
                instruction.data.textOverlay.style?.opacity ||
                defaultValues.style.opacity,
              animation:
                instruction.data.textOverlay.style?.animation ||
                defaultValues.style.animation,
              textShadow:
                instruction.data.textOverlay.style?.textShadow ||
                defaultValues.style.textShadow,
              borderRadius:
                instruction.data.textOverlay.style?.borderRadius ||
                defaultValues.style.borderRadius,
              padding:
                instruction.data.textOverlay.style?.padding ||
                defaultValues.style.padding,
            },
            position:
              instruction.data.textOverlay.position || defaultValues.position,
          }
        : defaultValues,
      { shouldDirty: true }
    );

    if (instruction) {
      setValue("overlayDuration", instruction.data.overlayDuration, {
        shouldDirty: true,
      });
      setValue("pauseMainVideo", instruction.data.pauseMainVideo, {
        shouldDirty: true,
      });
      setValue("pauseDuration", instruction.data.overlayDuration, {
        shouldDirty: true,
      });
    } else {
      // Set default values for new instructions
      setValue("overlayDuration", config.defaultOverlayDuration, {
        shouldDirty: true,
      });
      setValue("pauseMainVideo", false, { shouldDirty: true });
      setValue("pauseDuration", config.defaultPauseDuration, {
        shouldDirty: true,
      });
    }
  };

  const buildInstruction = (data: any, id: string) => {
    const triggerTime = parseTimeInput({
      hours: data.hours || 0,
      minutes: data.minutes || 0,
      seconds: data.seconds || 0,
      milliseconds: data.milliseconds || 0,
    });

    return {
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
    };
  };

  return {
    initializeForm,
    buildInstruction,
  };
};
