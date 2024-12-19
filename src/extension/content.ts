import { api } from "@/lib/api";
import { addCustomEventListener, eventSystem } from "@/lib/eventSystem";
import { VideoManager } from "@/lib/VideoManager";
import { TextOverlayInstruction, OverlayInstruction } from "@/types";
const { API_BASE_URL } = require("../config.js");

interface AuthResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    picture: string;
  };
}

interface APIResponse {
  success: boolean;
  error?: string;
  status: number;
  data?: any;
}

class ContentScript {
  private isAppVisible: boolean = false;
  private eventListeners: Array<() => void> = [];
  private videoManager: VideoManager | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.setupMessageListener();
    this.setupWindowMessageListener();
    this.checkAuthState();

    // Initialize video manager and only proceed if video is found
    this.initializeVideoManager().then(() => {
      if (this.videoManager?.hasVideoElement()) {
        // Only setup event listeners if we have a video
        this.setupVideoEventListeners();
      }
    });
  }

  private async initializeVideoManager(): Promise<void> {
    this.videoManager = new VideoManager();
    await this.videoManager.findAndStoreVideoElement();

    // Listen for video-related messages from the injected app
    this.setupVideoEventListeners();
  }

  private setupVideoEventListeners(): void {
    const cleanup = addCustomEventListener(
      "VIDEO_INSTRUCTION",
      async (data) => {
        const instruction = data;
        if (!this.videoManager) return;

        try {
          switch (instruction.type) {
            case "overlay":
              await this.handleOverlayInstruction(
                instruction as OverlayInstruction
              );
              break;
            case "text-overlay":
              await this.handleTextOverlayInstruction(
                instruction as TextOverlayInstruction
              );
              break;
            // Add other instruction types as needed
          }
        } catch (error) {
          console.error("Error handling video instruction:", error);
        }
      }
    );

    this.eventListeners.push(cleanup);
  }

  private async handleOverlayInstruction(
    instruction: OverlayInstruction
  ): Promise<void> {
    if (!this.videoManager) return;

    try {
      // Make API call to get media URL if needed
      if (instruction.overlayMedia && instruction.overlayMedia.url) {
        // Handle the overlay instruction
        await this.videoManager.handleInstruction(instruction);
      }
    } catch (error) {
      console.error("Error handling overlay instruction:", error);
    }
  }

  private async handleTextOverlayInstruction(
    instruction: TextOverlayInstruction
  ): Promise<void> {
    if (!this.videoManager) return;

    try {
      await this.videoManager.handleInstruction(instruction);
    } catch (error) {
      console.error("Error handling text overlay instruction:", error);
    }
  }

  private setupWindowMessageListener(): void {
    window.addEventListener("message", async (event) => {
      // Only accept messages from our injected app
      if (event.data.source !== "injected-app") return;

      const { messageId, type, payload } = event.data;
      console.log("Content script received message:", { type, payload });

      let response: APIResponse = {
        success: false,
        status: 500,
      };

      try {
        switch (type) {
          case "HANDLE_LOGIN":
          case "HANDLE_LOGOUT":
          case "CHECK_AUTH_STATE":
            const authResponse = await this.handleAuthMessage(type);
            // Don't wrap the auth response in a data field
            response = {
              ...authResponse,
              status: authResponse.success ? 200 : 400,
            };
            break;
          case "api:request":
            response = await this.handleApiRequest(payload);
            break;
        }

        console.log("Content script sending response:", response);

        // Send response back to injected app
        window.postMessage(
          {
            source: "content-script",
            type: "RESPONSE",
            messageId,
            payload: response,
          },
          "*"
        );

        // Also emit the response through the event system for API requests
        if (type === "api:request") {
          eventSystem.emit("api:response", response);
        }
      } catch (error) {
        console.error("Error handling message:", error);
        // Send error response
        const errorResponse: APIResponse = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          status: 500,
        };

        window.postMessage(
          {
            source: "content-script",
            type: "RESPONSE",
            messageId,
            payload: errorResponse,
          },
          "*"
        );

        if (type === "api:request") {
          eventSystem.emit("api:response", errorResponse);
        }
      }
    });
  }

  private async handleApiRequest(payload: any): Promise<APIResponse> {
    try {
      const { endpoint, method, body, params } = payload;
      console.log("Content: API Request details:", {
        endpoint,
        method,
        params,
      });

      const url = new URL(`${API_BASE_URL}/api${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value as string);
        });
      }

      let headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add auth headers if needed
      const userStr = localStorage.getItem("user");
      console.log("Content: User data from localStorage:", userStr);

      if (!userStr) {
        console.warn(
          "Content: No user data found in localStorage. Request may fail if authentication is required."
        );
      } else {
        try {
          const user = JSON.parse(userStr);
          console.log("Content: Parsed user data:", user);

          if (!user?.id) {
            console.error(
              "Content: User data found but no ID present. Request may fail if authentication is required."
            );
          } else {
            headers["user-id"] = user.id;
            console.log("Content: Added user-id to headers:", headers);
          }
        } catch (error) {
          console.error(
            "Content: Error parsing user from localStorage:",
            error
          );
          console.warn(
            "Content: Request may fail if authentication is required."
          );
        }
      }

      const options: RequestInit = {
        method,
        headers,
      };

      if (body) {
        // Handle the special FormData case
        if (body.type === "FormDataWithFile") {
          const formData = new FormData();

          // Convert array buffer back to file
          const arrayBuffer = body.file.arrayBuffer;
          const file = new File([arrayBuffer], body.file.name, {
            type: body.file.type,
          });

          formData.append("file", file);
          formData.append("timelineId", body.timelineId as string);

          // Keep the user-id header but remove Content-Type for FormData
          const { "Content-Type": _, ...headersWithoutContentType } = headers;
          options.headers = headersWithoutContentType;
          options.body = formData;

          console.log(
            "Content: Prepared FormData request with headers:",
            options.headers
          );
        } else {
          options.body = JSON.stringify(body);
        }
      }

      console.log("Content: Making API request:", {
        url: url.toString(),
        method: options.method,
        headers: options.headers,
        bodyType: options.body instanceof FormData ? "FormData" : "JSON",
        endpoint,
      });

      const response = await fetch(url.toString(), options);
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error("Content: Error parsing response JSON:", error);
        data = null;
      }

      console.log("Content: API response:", {
        status: response.status,
        ok: response.ok,
        data,
        endpoint,
      });

      // Ensure the response has the correct structure
      const apiResponse: APIResponse = {
        success: response.ok,
        data: data,
        status: response.status,
      };

      if (!response.ok) {
        apiResponse.error = data?.error || data?.message || "Request failed";
        console.error("Content: API request failed:", {
          error: apiResponse.error,
          endpoint,
          status: response.status,
        });
      }

      return apiResponse;
    } catch (error) {
      console.error("Content: API request error:", {
        error,
        endpoint: payload?.endpoint,
        method: payload?.method,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
        data: null,
      };
    }
  }

  private authCheckTimeout: NodeJS.Timeout | null = null;
  private lastAuthCheck: number = 0;
  private readonly AUTH_CHECK_DEBOUNCE = 1000; // 1 second debounce

  private async checkAuthState(): Promise<void> {
    const now = Date.now();
    if (now - this.lastAuthCheck < this.AUTH_CHECK_DEBOUNCE) {
      // Clear any existing timeout
      if (this.authCheckTimeout) {
        clearTimeout(this.authCheckTimeout);
      }

      // Set a new timeout
      this.authCheckTimeout = setTimeout(() => {
        this.performAuthCheck();
      }, this.AUTH_CHECK_DEBOUNCE);
      return;
    }

    await this.performAuthCheck();
  }

  private async performAuthCheck(): Promise<void> {
    try {
      this.lastAuthCheck = Date.now();
      const response = await new Promise<AuthResponse>((resolve) => {
        chrome.runtime.sendMessage(
          { action: "CHECK_AUTH_STATE" },
          (response: AuthResponse) => {
            resolve(response || { success: false });
          }
        );
      });

      if (response?.success && response.user) {
        this.dispatchToInjectedApp("AUTH_STATE_CHANGED", {
          user: response.user,
        });
      }
    } catch (error) {
      console.error("Failed to check auth state:", error);
    }
  }

  private dispatchToInjectedApp(type: string, payload: any): void {
    window.postMessage({ source: "content-script", type, payload }, "*");
  }

  private async toggleAppVisiblity(): Promise<void> {
    if (this.isAppVisible) {
      this.removeReactApp();
    } else {
      this.injectReactApp();
    }
    this.isAppVisible = !this.isAppVisible;
  }

  private removeReactApp(): void {
    // Remove the injected script
    const injectedScripts = document.querySelectorAll(
      'script[src*="injected-app.js"]'
    );
    injectedScripts.forEach((script) => script.remove());

    // Remove the React app container
    const appContainer = document.getElementById("react-overlay-root");
    if (appContainer) {
      appContainer.remove();
    }

    // Remove the timeline container
    const timelineContainer = document.getElementById("timeline-container");
    if (timelineContainer) {
      timelineContainer.remove();
    }

    const visibilityToggler = document.getElementById("visibility-toggler");
    if (visibilityToggler) {
      visibilityToggler.remove();
    }

    // Unsubscribe from event listeners
    this.eventListeners.forEach((unsubscribe) => unsubscribe());
    this.eventListeners = [];
  }

  private injectReactApp(): void {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("injected-app.js");
    script.type = "text/javascript";
    document.documentElement.appendChild(script);
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<boolean> {
    switch (message.action) {
      case "TOGGLE_APP_VISIBILITY":
        // Only proceed if this content script has found a video element
        if (this.videoManager?.hasVideoElement()) {
          await this.toggleAppVisiblity();
          sendResponse({ success: true });
        } else {
          // If no video found, don't do anything
          sendResponse({ success: false });
        }
        break;
      case "AUTH_STATE_CHANGED":
        this.dispatchToInjectedApp("AUTH_STATE_CHANGED", message.payload);
        sendResponse({ success: true });
        break;
    }
    return true;
  }

  private async handleAuthMessage(
    action: string
  ): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      console.log("Content: Sending auth message to background", action);

      // Clear local storage before login
      if (action === "HANDLE_LOGIN") {
        console.log("Content: Clearing localStorage before login");
        localStorage.removeItem("user");
      }

      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action }, async (response) => {
          console.log("Content: Received response from background", response);

          if (response?.success && response.user) {
            const { id, email, name, picture } = response.user;
            console.log("Content: Got user data", { id, email, name, picture });

            if (!id || !email || !name) {
              console.error("Content: Invalid user data structure");
              resolve({
                success: false,
                error: "Invalid user data structure",
              });
              return;
            }

            // Only make API call for HANDLE_LOGIN action
            if (action === "HANDLE_LOGIN") {
              try {
                console.log(
                  "Content: Attempting to create/update user via API"
                );

                // Construct the URL and request options
                const url = new URL(`${API_BASE_URL}/api/users`);
                console.log("Content: API URL", url.toString());

                const options: RequestInit = {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ id, email, name, picture }),
                };

                console.log(
                  "Content: Making fetch request with options",
                  options
                );

                const apiResponse = await fetch(url.toString(), options);
                const data = await apiResponse.json();
                console.log("Content: API response", data);

                if (!apiResponse.ok) {
                  console.error("Content: API request failed", data);
                  resolve({
                    success: false,
                    error: data.error || "Failed to create/update user",
                  });
                  return;
                }

                // Store user data from API response to ensure consistency
                console.log("Content: Storing user data in localStorage", data);
                localStorage.setItem("user", JSON.stringify(data));

                resolve({ success: true, user: data });
              } catch (error) {
                console.error("Content: Failed to create/update user", error);
                resolve({
                  success: false,
                  error: "Failed to create/update user",
                });
                return;
              }
            } else {
              // For non-login actions, still store the user data if we have it
              const userData = { id, email, name, picture };
              console.log(
                "Content: Storing user data in localStorage",
                userData
              );
              localStorage.setItem("user", JSON.stringify(userData));
              resolve(response);
            }
          } else {
            console.log("Content: No valid response or user ID", response);
            resolve(
              response || {
                success: false,
                error: "No response from background",
              }
            );
          }
        });
      });
    } catch (error) {
      console.error("Content: Unexpected error in handleAuthMessage", error);
      throw error;
    }
  }
}

export const contentScript = new ContentScript();
