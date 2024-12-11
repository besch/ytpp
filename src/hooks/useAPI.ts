import { makeAPIRequest, APIRequest } from "@/lib/eventSystem";
import { Timeline } from "@/types";

export function useAPI() {
  const request = async <T = any>(config: {
    endpoint: string;
    method: APIRequest["method"];
    body?: any;
    params?: Record<string, string>;
  }): Promise<T> => {
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
      throw new Error(response.error || "Request failed");
    }

    // Skip auth responses but don't return empty array
    if (
      response.data &&
      "success" in response.data &&
      "user" in response.data
    ) {
      console.warn("Skipping auth response:", response.data);
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

      delete: async (id: string): Promise<void> => {
        return request({
          endpoint: `/timelines/${id}`,
          method: "DELETE",
        });
      },
    },
  };
}
