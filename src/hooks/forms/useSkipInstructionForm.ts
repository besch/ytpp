import { useFormContext } from "react-hook-form";
import { SkipInstruction } from "@/types";
import { parseTimeInput } from "@/lib/time";

export const useSkipInstructionForm = (currentTime: number) => {
  const { setValue } = useFormContext();

  const initializeForm = (instruction: SkipInstruction | null) => {
    if (instruction) {
      // Set skip to time
      const skipToTime = instruction.skipToTime / 1000;
      setValue("skipToHours", Math.floor(skipToTime / 3600));
      setValue("skipToMinutes", Math.floor((skipToTime % 3600) / 60));
      setValue("skipToSeconds", Math.floor(skipToTime % 60));
      setValue("skipToMilliseconds", skipToTime % 1000);
    }
  };

  const buildInstruction = (data: any, id: string): SkipInstruction => {
    const triggerTime = Number(
      parseTimeInput({
        hours: data.hours || 0,
        minutes: data.minutes || 0,
        seconds: data.seconds || 0,
        milliseconds: data.milliseconds || 0,
      }).toFixed(3)
    );

    const skipToTime = Number(
      parseTimeInput({
        hours: data.skipToHours || 0,
        minutes: data.skipToMinutes || 0,
        seconds: data.skipToSeconds || 0,
        milliseconds: data.skipToMilliseconds || 0,
      }).toFixed(3)
    );

    return {
      id,
      type: "skip",
      triggerTime,
      skipToTime,
    };
  };

  return {
    initializeForm,
    buildInstruction,
  };
};
