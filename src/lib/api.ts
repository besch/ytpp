import { makeAPIRequest } from "@/lib/eventSystem";
import { Timeline, Instruction, MediaFile } from "@/types";

const API_BASE_URL = "http://localhost:3000/api";

export const getMediaUrl = (path: string): string => {
  if (!path) return "";
  const filename = path.split("/").pop();
  return `${API_BASE_URL}/media/${filename}`;
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

    create: async (timeline: Partial<Timeline>): Promise<Timeline> => {
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
        instructions?: Instruction[];
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
