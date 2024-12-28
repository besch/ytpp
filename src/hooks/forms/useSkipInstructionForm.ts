import { useFormContext } from "react-hook-form";
import { InstructionResponse } from "@/types";
import { parseTimeInput } from "@/lib/time";

export const useSkipInstructionForm = (currentTime: number) => {
  const { setValue } = useFormContext();

  const initializeForm = (instruction: InstructionResponse | null) => {
    if (instruction && instruction.data.skipToTime) {
      // Set skip to time
      const skipToTime = instruction.data.skipToTime / 1000;
      setValue("skipToHours", Math.floor(skipToTime / 3600));
      setValue("skipToMinutes", Math.floor((skipToTime % 3600) / 60));
      setValue("skipToSeconds", Math.floor(skipToTime % 60));
      setValue("skipToMilliseconds", skipToTime % 1000);
    }
  };

  const buildInstruction = (data: any, id: string) => {
    const skipToTime = Number(
      parseTimeInput({
        hours: data.skipToHours || 0,
        minutes: data.skipToMinutes || 0,
        seconds: data.skipToSeconds || 0,
        milliseconds: data.skipToMilliseconds || 0,
      }).toFixed(3)
    );

    return {
      skipToTime,
    };
  };

  return {
    initializeForm,
    buildInstruction,
  };
};
