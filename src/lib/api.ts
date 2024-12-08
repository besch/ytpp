import axios from "axios";
import { Timeline, Instruction, MediaFile } from "@/types";

const API_BASE_URL = "http://localhost:3000/api";

// Add auth header helper
const getAuthHeaders = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return {};

  try {
    const user = JSON.parse(userStr);
    return user?.id
      ? {
          "user-id": user.id,
          "Content-Type": "application/json",
        }
      : {};
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return {};
  }
};

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
      const response = await axios.post(`${API_BASE_URL}/users`, user, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    },
  },
  timelines: {
    getAll: async (videoUrl?: string): Promise<Timeline[]> => {
      const params = videoUrl
        ? `?video_url=${encodeURIComponent(videoUrl)}`
        : "";
      const response = await axios.get(`${API_BASE_URL}/timelines${params}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    },

    get: async (id: string): Promise<Timeline> => {
      const response = await axios.get(`${API_BASE_URL}/timelines/${id}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    },

    create: async (timeline: Partial<Timeline>): Promise<Timeline> => {
      const response = await axios.post(`${API_BASE_URL}/timelines`, timeline, {
        headers: getAuthHeaders(),
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
      const response = await axios.put(
        `${API_BASE_URL}/timelines/${id}`,
        data,
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data;
    },

    delete: async (id: string): Promise<void> => {
      await axios.delete(`${API_BASE_URL}/timelines/${id}`, {
        headers: getAuthHeaders(),
      });
    },

    uploadMedia: async (
      file: File,
      timelineId: string
    ): Promise<{ url: string }> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("timelineId", timelineId);

      const response = await axios.post(`${API_BASE_URL}/media`, formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });
      return {
        url: getMediaUrl(response.data.url),
      };
    },

    deleteMedia: async (url: string): Promise<void> => {
      try {
        await axios.delete(`${API_BASE_URL}/media`, {
          data: { url: url.split("/").pop() },
        });
      } catch (error) {
        console.error("Error deleting media:", error);
        throw error;
      }
    },

    getMedia: async (timelineId: string): Promise<MediaFile[]> => {
      const response = await axios.get(`${API_BASE_URL}/media/${timelineId}`);
      return response.data;
    },

    cloneMedia: async (
      url: string,
      timelineId: string
    ): Promise<{ url: string }> => {
      const response = await axios.post(
        `${API_BASE_URL}/media/clone`,
        {
          sourceUrl: url.split("/").pop(),
          timelineId,
        },
        {
          headers: getAuthHeaders(),
        }
      );
      return {
        url: getMediaUrl(response.data.url),
      };
    },
  },
};
