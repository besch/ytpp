import { addCustomEventListener } from "@/lib/eventSystem";

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

class ContentScript {
  private isAppVisible: boolean = false;
  private eventListeners: Array<() => void> = [];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.setupMessageListener();
    this.setupWindowMessageListener();
    this.checkAuthState();
  }

  private setupWindowMessageListener(): void {
    window.addEventListener("message", async (event) => {
      // Only accept messages from our injected app
      if (event.data.source !== "injected-app") return;

      const { messageId, type } = event.data;

      let response = { success: false };

      switch (type) {
        case "HANDLE_LOGIN":
          response = await this.handleAuthMessage("HANDLE_LOGIN");
          break;
        case "HANDLE_LOGOUT":
          response = await this.handleAuthMessage("HANDLE_LOGOUT");
          break;
      }

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
    });
  }

  private async handleAuthMessage(
    action: string
  ): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      console.log("Content: Sending auth message to background", action);
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action }, (response) => {
          console.log("Content: Received response from background", response);
          resolve(
            response || { success: false, error: "No response from background" }
          );
        });
      });
    } catch (error) {
      console.error(`Content: ${action} error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async checkAuthState(): Promise<void> {
    try {
      // Check auth state with background script
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
        await this.toggleAppVisiblity();
        sendResponse({ success: true });
        break;
      case "AUTH_STATE_CHANGED":
        this.dispatchToInjectedApp("AUTH_STATE_CHANGED", message.payload);
        sendResponse({ success: true });
        break;
    }
    return true;
  }
}

export const contentScript = new ContentScript();
