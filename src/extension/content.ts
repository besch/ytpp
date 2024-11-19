import { VideoManager } from "./content/VideoManager";
import { Timeline } from "@/types";
import { addCustomEventListener, dispatchCustomEvent } from "@/lib/eventSystem";

class ContentScript {
  private videoManager: VideoManager | null = null;
  private isAppVisible: boolean = false;
  private eventListeners: Array<() => void> = [];

  constructor() {
    this.initialize();
    this.setupCustomEventListeners();
  }

  private initialize(): void {
    this.setupMessageListener();
    this.setupCustomEventListeners();

    // Initialize VideoManager
    this.videoManager = new VideoManager();
    this.videoManager.findAndStoreVideoElement();
  }

  private async toggleAppVisiblity(): Promise<void> {
    if (!this.videoManager?.hasVideoElement()) {
      await this.videoManager?.findAndStoreVideoElement();
    }

    if (this.videoManager?.hasVideoElement()) {
      if (this.isAppVisible) {
        this.removeReactApp();
      } else {
        this.injectReactApp();
      }
      this.isAppVisible = !this.isAppVisible;
    }
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

  private setupCustomEventListeners(): void {
    this.eventListeners = [
      addCustomEventListener("UPDATE_TIMELINE", ({ timeline }) => {
        if (timeline) {
          this.updateTimeline(timeline);
        }
      }),
    ];
  }

  private injectReactApp(): void {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("injected-app.js");
    script.type = "text/javascript";
    document.documentElement.appendChild(script);
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    window.addEventListener("message", this.handleWindowMessage.bind(this));
  }

  private handleWindowMessage(event: MessageEvent): void {}

  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<boolean> {
    if (message.action === "TOGGLE_OVERLAY") {
      await this.toggleAppVisiblity();
      sendResponse({ success: true });
    }
    return true;
  }

  private updateTimeline(timeline: Timeline): void {
    this.videoManager?.setInstructions(timeline.instructions || []);
  }
}

export const contentScript = new ContentScript();
