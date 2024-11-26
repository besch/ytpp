import { addCustomEventListener } from "@/lib/eventSystem";

class ContentScript {
  private isAppVisible: boolean = false;
  private eventListeners: Array<() => void> = [];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.setupMessageListener();
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
    if (message.action === "TOGGLE_APP_VISIBILITY") {
      await this.toggleAppVisiblity();
      sendResponse({ success: true });
    }
    return true;
  }
}

export const contentScript = new ContentScript();
