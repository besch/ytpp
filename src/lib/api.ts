import { makeAPIRequest } from "@/lib/eventSystem";
import { Timeline, InstructionResponse, MediaFile } from "@/types";
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
  auth: {
    getYouTubeAuthUrl: async () => {
      const response = await makeAPIRequest({
        endpoint: "/auth/youtube",
        method: "GET",
      });
      return response.data.url;
    },

    handleYouTubeCallback: async (code: string) => {
      const response = await makeAPIRequest({
        endpoint: "/auth/callback",
        method: "GET",
        params: { code },
      });
      return response.data;
    },
  },
  instructions: {
    getAll: async (timelineId: string): Promise<InstructionResponse[]> => {
      if (!timelineId) return [];
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
      instruction: Omit<
        InstructionResponse,
        "id" | "timeline_id" | "created_at" | "updated_at"
      >
    ): Promise<InstructionResponse> => {
      const response = await makeAPIRequest({
        endpoint: "/instructions",
        method: "POST",
        body: {
          timeline_id: timelineId,
          name: instruction.data.name || `${instruction.data.type} Instruction`,
          data: instruction.data,
        },
      });
      return response.data;
    },

    clone: async (
      timelineId: string,
      instruction: InstructionResponse
    ): Promise<InstructionResponse> => {
      const newTriggerTime = instruction.data.triggerTime + 3000;

      const clonedInstruction: Omit<
        InstructionResponse,
        "id" | "timeline_id" | "created_at" | "updated_at"
      > = {
        data: {
          ...instruction.data,
          name: `${instruction.data.name} (Copy)`,
          triggerTime: newTriggerTime,
          ...(instruction.data.type === "skip" &&
          instruction.data.skipToTime !== undefined
            ? { skipToTime: instruction.data.skipToTime + 3000 }
            : {}),
        },
      };

      return api.instructions.create(timelineId, clonedInstruction);
    },

    update: async (
      id: string,
      instruction: Partial<InstructionResponse>
    ): Promise<InstructionResponse> => {
      const response = await makeAPIRequest({
        endpoint: `/instructions/${id}`,
        method: "PUT",
        body: instruction,
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
        body: {
          ...timeline,
          verify_youtube_ownership:
            timeline.video_url?.includes("youtube.com") ||
            timeline.video_url?.includes("youtu.be"),
        },
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
