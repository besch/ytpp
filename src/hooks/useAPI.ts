import { makeAPIRequest, APIRequest } from "@/lib/eventSystem";
import { Timeline, MediaFile } from "@/types";

export interface MediaUploadResponse {
  url: string;
}

export interface MediaCloneResponse {
  url: string;
}

export function useAPI() {
  const request = async <T = any>(config: {
    endpoint: string;
    method: APIRequest["method"];
    body?: any;
    params?: Record<string, string>;
  }): Promise<T> => {
    // If body is FormData, convert file to array buffer before sending
    if (config.body instanceof FormData) {
      const formData = config.body;
      const file = formData.get("file") as File;
      if (file) {
        // Read file as array buffer
        const arrayBuffer = await file.arrayBuffer();

        // Create a structured clone-safe object
        const safeBody = {
          type: "FormDataWithFile",
          file: {
            arrayBuffer: arrayBuffer,
            type: file.type,
            name: file.name,
          },
          timelineId: formData.get("timelineId"),
        };

        config.body = safeBody;
      }
    }

    const response = await makeAPIRequest(config);
    console.log(
      "useAPI received response:",
      response,
      "Data type:",
      typeof response.data,
      "Is Array:",
      Array.isArray(response.data)
    );

    if (!response.success) {
      if (response.status === 403) {
        throw new Error("You don't have permission to perform this action");
      }
      throw new Error(response.error || "Request failed");
    }

    // Skip auth responses but don't return empty array
    if (
      response.data &&
      "success" in response.data &&
      "user" in response.data
    ) {
      return new Promise((resolve) => setTimeout(resolve, 0)) as Promise<T>;
    }

    return response.data;
  };

  return {
    users: {
      createOrUpdate: async (user: {
        id: string;
        email: string;
        name: string;
        picture: string;
      }) => {
        return request({
          endpoint: "/users",
          method: "POST",
          body: user,
        });
      },
    },
    timelines: {
      getAll: async (videoUrl?: string): Promise<Timeline[]> => {
        const params = videoUrl ? { video_url: videoUrl } : undefined;
        console.log("getAll called with params:", params);

        try {
          let attempts = 0;
          const maxAttempts = 3;
          let data: any;

          // Keep trying until we get the actual timeline data
          while (attempts < maxAttempts) {
            try {
              data = await request<Timeline[]>({
                endpoint: "/timelines",
                method: "GET",
                params,
              });

              // If we got actual data, break the loop
              if (data) break;

              // If we got undefined (from skipped auth response), try again
              attempts++;
              await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay between attempts
            } catch (error) {
              console.error(`Attempt ${attempts + 1} failed:`, error);
              attempts++;
              if (attempts === maxAttempts) throw error;
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }

          console.log(
            "getAll received data:",
            data,
            "Type:",
            typeof data,
            "Is Array:",
            Array.isArray(data)
          );

          // Ensure we have valid timeline objects
          if (Array.isArray(data)) {
            return data.filter(
              (timeline) =>
                timeline &&
                typeof timeline === "object" &&
                "id" in timeline &&
                "title" in timeline
            );
          }

          // If we got a single valid timeline object, wrap it in an array
          if (
            data &&
            typeof data === "object" &&
            "id" in data &&
            "title" in data
          ) {
            return [data as Timeline];
          }

          // Default to empty array
          return [];
        } catch (error) {
          console.error("Error in getAll:", error);
          return [];
        }
      },

      create: async (timeline: Partial<Timeline>): Promise<Timeline> => {
        return request({
          endpoint: "/timelines",
          method: "POST",
          body: timeline,
        });
      },

      update: async (
        id: number,
        data: Partial<Timeline>
      ): Promise<Timeline> => {
        return request({
          endpoint: `/timelines/${id}`,
          method: "PUT",
          body: data,
        });
      },

      delete: async (id: number): Promise<void> => {
        return request({
          endpoint: `/timelines/${id}`,
          method: "DELETE",
        });
      },

      uploadMedia: async (
        file: File,
        timelineId: number
      ): Promise<MediaUploadResponse> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("timelineId", timelineId.toString());

        return request({
          endpoint: "/media",
          method: "POST",
          body: formData,
        });
      },

      deleteMedia: async (url: string, timelineId: number): Promise<void> => {
        return request({
          endpoint: "/media",
          method: "DELETE",
          body: {
            url: url.split("/").pop(),
            timelineId,
          },
        });
      },

      cloneMedia: async (
        url: string,
        timelineId: number
      ): Promise<MediaCloneResponse> => {
        return request({
          endpoint: "/media/clone",
          method: "POST",
          body: {
            sourceUrl: url.split("/").pop(),
            timelineId,
          },
        });
      },

      addReaction: async (
        timelineId: number,
        type: "like" | "dislike"
      ): Promise<{ likes_count: number; dislikes_count: number }> => {
        return request({
          endpoint: `/timelines/${timelineId}/reactions`,
          method: "POST",
          body: { type },
        });
      },

      removeReaction: async (
        timelineId: number
      ): Promise<{ likes_count: number; dislikes_count: number }> => {
        return request({
          endpoint: `/timelines/${timelineId}/reactions`,
          method: "DELETE",
        });
      },
    },
  };
}
