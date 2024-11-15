import axios from "axios";
import { Timeline, Instruction, MediaFile } from "@/types";

const API_BASE_URL = "http://localhost:3000/api";

export const api = {
  timelines: {
    getAll: async (): Promise<Timeline[]> => {
      const response = await axios.get(`${API_BASE_URL}/timelines`);
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
      timelineId: string,
      instructionId?: string
    ): Promise<MediaFile> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("timelineId", timelineId);
      if (instructionId) {
        formData.append("instructionId", instructionId);
      }

      const response = await axios.post(
        `${API_BASE_URL}/timelines/media`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },

    deleteMedia: async (mediaId: string): Promise<void> => {
      await axios.delete(`${API_BASE_URL}/timelines/media/${mediaId}`);
    },

    getMedia: async (timelineId: string): Promise<MediaFile[]> => {
      const response = await axios.get(
        `${API_BASE_URL}/timelines/media/${timelineId}`
      );
      return response.data;
    },
  },
};
