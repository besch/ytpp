import axios from "axios";
import { Timeline, Instruction, MediaFile } from "@/types";

const API_BASE_URL = "http://localhost:3000/api";

export const api = {
  timelines: {
    getAll: async (videoUrl?: string): Promise<Timeline[]> => {
      const params = videoUrl
        ? `?video_url=${encodeURIComponent(videoUrl)}`
        : "";
      const response = await axios.get(`${API_BASE_URL}/timelines${params}`);
      return response.data;
    },

    get: async (id: string): Promise<Timeline> => {
      const response = await axios.get(`${API_BASE_URL}/timelines/${id}`);
      return response.data;
    },

    create: async (timeline: Partial<Timeline>): Promise<Timeline> => {
      const response = await axios.post(`${API_BASE_URL}/timelines`, timeline, {
        headers: {
          "Content-Type": "application/json",
        },
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
      const response = await axios.put(`${API_BASE_URL}/timelines/${id}`, data);
      return response.data;
    },

    delete: async (id: string): Promise<void> => {
      await axios.delete(`${API_BASE_URL}/timelines/${id}`);
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
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },

    deleteMedia: async (url: string): Promise<void> => {
      await axios.delete(`${API_BASE_URL}/media`, {
        data: { url },
      });
    },

    getMedia: async (timelineId: string): Promise<MediaFile[]> => {
      const response = await axios.get(`${API_BASE_URL}/media/${timelineId}`);
      return response.data;
    },
  },
};
