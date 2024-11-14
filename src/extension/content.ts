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
        this.loadElements();
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

      addCustomEventListener(
        "UPDATE_ELEMENT_TIME",
        ({ elementId, from, to }) => {
          const selectedElement = OverlayManager.getSelectedElement();
          if (selectedElement && selectedElement.data?.id === elementId) {
            OverlayManager.updateElementTime(selectedElement, from, to);
          }
        }
      ),

      addCustomEventListener("DELETE_ELEMENT", () => {
        OverlayManager.elementManager?.deleteSelectedElement();
      }),

      addCustomEventListener("SAVE_ELEMENTS", () => {
        this.saveElements();
      }),

      addCustomEventListener("LOAD_ELEMENTS", () => {
        this.loadElements();
      }),

      // addCustomEventListener("LOAD_INSTRUCTIONS", () => {
      //   this.loadInstructions();
      // }),

      addCustomEventListener("GET_ELEMENTS", () => {
        const elements = OverlayManager.getElements();
        if (elements && elements.length > 0) {
          dispatchCustomEvent("SET_ELEMENTS", { elements });
        }
      }),

      addCustomEventListener("TOGGLE_CANVAS", ({ visible }) => {
        OverlayManager.setCanvasVisibility(visible);
      }),

      addCustomEventListener("INITIALIZE_TIMELINE", async () => {
        await this.initializeTimeline();
      }),

      addCustomEventListener("LOAD_TIMELINE", async ({ timelineId }) => {
        await this.loadTimeline(timelineId);
      }),

      addCustomEventListener("DELETE_TIMELINE", async ({ timelineId }) => {
        await this.deleteTimeline(timelineId);
      }),

      addCustomEventListener("GET_TIMELINES", async () => {
        await this.loadTimelinesList();
      }),
    ];

    // Store cleanup functions
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
    } else if (message.action === "SAVE_ELEMENTS") {
      this.saveElements();
    }
    return true;
  }

  private async loadElements(): Promise<void> {
    try {
      if (!this.currentTimeline?.id) {
        console.warn("No timeline selected");
        return;
      }

      const timeline = await api.timelines.get(this.currentTimeline.id);
      if (timeline?.elements) {
        await OverlayManager.elementManager?.loadElements(timeline.elements);

        // Force dispatch elements after loading
        const currentElements = OverlayManager.getElements();
        dispatchCustomEvent("SET_ELEMENTS", { elements: currentElements });
      }
    } catch (error) {
      console.error("Error loading elements:", error);
    }
  }

  private handleTimeUpdate = (currentTimeMs: number): void => {
    OverlayManager.update(currentTimeMs);
  };

  private startPlay(): void {
    if (this.videoManager) {
      this.videoManager.addTimeUpdateListener(this.handleTimeUpdate);
    }
  }

  private saveElements(): void {
    const elements = OverlayManager.getElements();
    storage.set("elements", elements);
  }

  private async initializeTimeline(): Promise<void> {
    try {
      const timeline = await api.timelines.create({
        title: `Timeline ${new Date().toLocaleString()}`,
        elements: [],
        instructions: [],
      });

      await this.loadTimeline(timeline.id);
      dispatchCustomEvent("TIMELINE_INITIALIZED", { timeline });
    } catch (error) {
      console.error("Failed to initialize timeline:", error);
    }
  }

  private async saveTimeline(): Promise<void> {
    if (!this.currentTimeline) return;

    try {
      const elements = OverlayManager.getElements();
      const instructions = this.currentTimeline.instructions.map(
        (instruction) => ({
          ...instruction,
        })
      );

      this.currentTimeline = await api.timelines.update(
        this.currentTimeline.id,
        { elements, instructions }
      );

      dispatchCustomEvent("SAVE_SUCCESS", {
        message: "Timeline saved successfully",
      });
    } catch (error) {
      console.error("Failed to save timeline:", error);
    }
  }

  private cleanup(): void {
    this.cleanupListeners.forEach((cleanup) => cleanup());
    this.cleanupListeners = [];
  }

  private handleTimelineUpdate = (updatedTimeline: Timeline) => {
    this.currentTimeline = updatedTimeline;
  };

  private async loadTimelinesList(): Promise<void> {
    try {
      const timelines = await api.timelines.getAll();
      dispatchCustomEvent("SET_TIMELINES", { timelines });
    } catch (error) {
      console.error("Failed to load timelines:", error);
    }
  }

  private async loadTimeline(timelineId: string): Promise<void> {
    try {
      const timeline = await api.timelines.get(timelineId);

      // Load timeline elements into overlay
      if (timeline.elements) {
        await OverlayManager.elementManager?.loadElements(timeline.elements);
      }

      // Update React app state
      dispatchCustomEvent("SET_CURRENT_TIMELINE", { timeline });
    } catch (error) {
      console.error("Failed to load timeline:", error);
    }
  }

  private async deleteTimeline(timelineId: string): Promise<void> {
    try {
      await api.timelines.delete(timelineId);
      await this.loadTimelinesList(); // Refresh the list
      dispatchCustomEvent("TIMELINE_DELETED", { timelineId });
    } catch (error) {
      console.error("Failed to delete timeline:", error);
    }
  }
}

export const contentScript = new ContentScript();
