import { TimeInput } from "@/types";

export const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const parseTimeInput = (data: TimeInput) => {
  return (
    (Number(data.hours) * 3600 +
      Number(data.minutes) * 60 +
      Number(data.seconds)) *
      1000 +
    Number(data.milliseconds || 0)
  );
};
