import { VideoManager } from "./content/VideoManager";
import { Instruction, Timeline } from "@/types";
import { addCustomEventListener, dispatchCustomEvent } from "@/lib/eventSystem";
import { storage } from "@/lib/storage";
import { api } from "@/lib/api";

class ContentScript {
  private videoManager: VideoManager | null = null;
  private cleanupListeners: Array<() => void> = [];
  private timelineId: string = "";
  private currentTimeline: Timeline | null = null;
  private isAppVisible: boolean = false;

  constructor() {
    this.timelineId = this.extractTimelineId();
    this.initialize();
    this.setupCustomEventListeners();
  }

  private extractTimelineId(): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("timelineId") || "default";
  }

  private initialize(): void {
    this.setupMessageListener();
    this.setupUnloadListener();
    this.setupCustomEventListeners();

    // Initialize VideoManager
    this.videoManager = new VideoManager();
    this.videoManager.findAndStoreVideoElement();
    this.startPlay();
  }

  private async toggleOverlay(): Promise<void> {
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
  }

  private setupCustomEventListeners(): void {
    const listeners = [
      addCustomEventListener("TIMELINE_SELECTED", ({ timeline }) => {
        if (timeline) {
          this.updateTimeline(timeline);
        }
      }),
    ];

    this.cleanupListeners = listeners;
  }

  private injectReactApp(): void {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("injected-app.js");
    script.type = "text/javascript";
    document.documentElement.appendChild(script);
  }

  private setupUnloadListener(): void {
    window.addEventListener("beforeunload", this.handlePageUnload);
  }

  private handlePageUnload = async (): Promise<void> => {};

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
      await this.toggleOverlay();
      sendResponse({ success: true });
    }
    return true;
  }

  private handleTimeUpdate = (currentTimeMs: number): void => {
    // Remove OverlayManager update
  };

  private startPlay(): void {
    if (this.videoManager) {
      this.videoManager.addTimeUpdateListener(this.handleTimeUpdate);
    }
  }

  private cleanup(): void {
    this.cleanupListeners.forEach((cleanup) => cleanup());
    this.cleanupListeners = [];
  }

  private handleTimelineUpdate = (updatedTimeline: Timeline) => {
    this.currentTimeline = updatedTimeline;
  };

  private updateTimeline(timeline: Timeline): void {
    this.currentTimeline = timeline;
    // Update instructions in VideoManager only
    this.videoManager?.setInstructions(timeline.instructions || []);
  }
}

export const contentScript = new ContentScript();
