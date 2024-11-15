import { VideoManager } from "./content/VideoManager";
import { OverlayManager } from "./content/OverlayManager";
import { Instruction, Timeline } from "@/types";
import { addCustomEventListener, dispatchCustomEvent } from "@/lib/eventSystem";
import { storage } from "@/lib/storage";
import { api } from "@/lib/api";

class ContentScript {
  private videoManager: VideoManager | null = null;
  private isOverlayVisible: boolean = false;
  private cleanupListeners: Array<() => void> = [];
  private timelineId: string = "";
  private currentTimeline: Timeline | null = null;

  constructor() {
    this.timelineId = this.extractTimelineId();
    this.initialize();
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
      if (this.isOverlayVisible) {
        // Remove overlay and React app
        OverlayManager.removeOverlay();
        this.removeReactApp();
      } else {
        // Show overlay and inject React app
        this.injectReactApp();
        OverlayManager.createOverlay(
          this.videoManager.getVideoElement()!,
          this.timelineId
        );
      }
      this.isOverlayVisible = !this.isOverlayVisible;
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
      addCustomEventListener("ADD_ELEMENT", ({ elementType, gifUrl }) => {
        OverlayManager.addElement(elementType, gifUrl);
      }),

      addCustomEventListener("UPDATE_ELEMENT_COLOR", ({ color, type }) => {
        OverlayManager.updateElementColor(color, type);
      }),

      // addCustomEventListener(
      //   "UPDATE_ELEMENT_TIME",
      //   ({ elementId, from, to }) => {
      //     const selectedElement = OverlayManager.getSelectedElement();
      //     if (selectedElement && selectedElement.data?.id === elementId) {
      //       OverlayManager.updateElementTime(selectedElement, from, to);
      //     }
      //   }
      // ),

      // addCustomEventListener("DELETE_ELEMENT", () => {
      //   OverlayManager.elementManager?.deleteSelectedElement();
      // }),

      addCustomEventListener("TOGGLE_CANVAS", ({ visible }) => {
        OverlayManager.setCanvasVisibility(visible);
      }),

      addCustomEventListener("SET_TIMELINE", ({ timeline }) => {
        if (timeline) {
          this.currentTimeline = timeline;
          // Update elements in OverlayManager
          OverlayManager.loadElements(timeline.elements || []);
          // Update instructions in VideoManager
          this.videoManager?.setInstructions(timeline.instructions || []);
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
    } else if (message.action === "ADD_ELEMENT") {
      OverlayManager.addElement(message.elementType);
    }
    return true;
  }

  private handleTimeUpdate = (currentTimeMs: number): void => {
    OverlayManager.update(currentTimeMs);
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
}

export const contentScript = new ContentScript();
