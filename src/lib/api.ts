import { makeAPIRequest } from "@/lib/eventSystem";
import {
  Timeline,
  Instruction,
  MediaFile,
  InstructionResponse,
  SkipInstruction,
} from "@/types";
const { API_BASE_URL } = require("../config.js");

const API_URL = `${API_BASE_URL}/api`;

export const getMediaUrl = (path: string): string => {
  if (!path) return "";
  const filename = path.split("/").pop();
  return `${API_URL}/media/${filename}`;
};

export const api = {
  users: {
    createOrUpdate: async (user: {
      id: string;
      email: string;
      name: string;
      picture: string;
    }) => {
      const response = await makeAPIRequest({
        endpoint: "/users",
        method: "POST",
        body: user,
      });
      return response.data;
    },
  },
  instructions: {
    getAll: async (timelineId: string): Promise<InstructionResponse[]> => {
      const response = await makeAPIRequest({
        endpoint: "/instructions",
        method: "GET",
        params: { timeline_id: timelineId },
      });
      return response.data;
    },

    get: async (id: string): Promise<InstructionResponse> => {
      const response = await makeAPIRequest({
        endpoint: `/instructions/${id}`,
        method: "GET",
      });
      return response.data;
    },

    create: async (
      timelineId: string,
      instruction: Omit<Instruction, "id">
    ): Promise<InstructionResponse> => {
      const response = await makeAPIRequest({
        endpoint: "/instructions",
        method: "POST",
        body: {
          timeline_id: timelineId,
          instruction,
        },
      });
      return response.data;
    },

    clone: async (
      timelineId: string,
      instruction: Instruction
    ): Promise<InstructionResponse> => {
      const { id, ...instructionWithoutId } = instruction;
      const clonedInstruction = {
        ...instructionWithoutId,
        triggerTime: instruction.triggerTime + 3000,
      };

      if (instruction.type === "skip") {
        (clonedInstruction as SkipInstruction).skipToTime += 3000;
      }

      return api.instructions.create(timelineId, clonedInstruction);
    },

    update: async (
      id: string,
      instruction: Partial<Instruction>
    ): Promise<InstructionResponse> => {
      const response = await makeAPIRequest({
        endpoint: `/instructions/${id}`,
        method: "PUT",
        body: {
          type: instruction.type,
          trigger_time: instruction.triggerTime,
          name: instruction.name,
          data: instruction,
        },
      });
      return response.data;
    },

    delete: async (id: string): Promise<void> => {
      await makeAPIRequest({
        endpoint: `/instructions/${id}`,
        method: "DELETE",
      });
    },
  },
  timelines: {
    getAll: async (videoUrl?: string): Promise<Timeline[]> => {
      const params = videoUrl ? { video_url: videoUrl } : undefined;
      const response = await makeAPIRequest({
        endpoint: "/timelines",
        method: "GET",
        params,
      });
      return response.data;
    },

    get: async (id: string): Promise<Timeline> => {
      const response = await makeAPIRequest({
        endpoint: `/timelines/${id}`,
        method: "GET",
      });
      return response.data;
    },

    create: async (
      timeline: Omit<Timeline, "id" | "instructions">
    ): Promise<Timeline> => {
      const response = await makeAPIRequest({
        endpoint: "/timelines",
        method: "POST",
        body: timeline,
      });
      return response.data;
    },

    update: async (
      id: string,
      data: {
        title?: string;
        elements?: any[];
      }
    ): Promise<Timeline> => {
      const response = await makeAPIRequest({
        endpoint: `/timelines/${id}`,
        method: "PUT",
        body: data,
      });
      return response.data;
    },

    delete: async (id: string): Promise<void> => {
      await makeAPIRequest({
        endpoint: `/timelines/${id}`,
        method: "DELETE",
      });
    },

    uploadMedia: async (
      file: File,
      timelineId: string
    ): Promise<{ url: string }> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("timelineId", timelineId);

      const response = await makeAPIRequest({
        endpoint: "/media",
        method: "POST",
        body: formData,
      });
      return {
        url: getMediaUrl(response.data.url),
      };
    },

    deleteMedia: async (url: string, timelineId: string): Promise<void> => {
      await makeAPIRequest({
        endpoint: "/media",
        method: "DELETE",
        body: {
          url: url.split("/").pop(),
          timelineId,
        },
      });
    },

    getMedia: async (timelineId: string): Promise<MediaFile[]> => {
      const response = await makeAPIRequest({
        endpoint: `/media/${timelineId}`,
        method: "GET",
      });
      return response.data;
    },

    cloneMedia: async (
      url: string,
      timelineId: string
    ): Promise<{ url: string }> => {
      const response = await makeAPIRequest({
        endpoint: "/media/clone",
        method: "POST",
        body: {
          sourceUrl: url.split("/").pop(),
          timelineId,
        },
      });
      return {
        url: getMediaUrl(response.data.url),
      };
    },
  },
};
