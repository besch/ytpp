import { VideoManager } from "./content/VideoManager";
import { OverlayManager } from "./content/OverlayManager";
import { Instruction } from "@/types";
import { addCustomEventListener, dispatchCustomEvent } from "@/lib/eventSystem";

class ContentScript {
  private videoManager: VideoManager | null = null;
  private isOverlayVisible: boolean = false;
  private cleanupListeners: Array<() => void> = [];

  constructor() {
    this.initialize();
    this.initializeInstructionsHandling();
  }

  private initialize(): void {
    this.setupMessageListener();
    this.setupUnloadListener();
    this.setupCustomEventListeners();

    // Don't inject React app immediately
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
          true
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
        const elements = OverlayManager.getElements();
        chrome.storage.local.set({ elements }, () => {
          dispatchCustomEvent("SAVE_SUCCESS", {
            message: "Elements saved successfully!",
          });
        });
      }),

      addCustomEventListener("LOAD_ELEMENTS", () => {
        this.loadElements();
      }),

      addCustomEventListener("LOAD_INSTRUCTIONS", () => {
        this.loadInstructions();
      }),

      addCustomEventListener("GET_ELEMENTS", () => {
        const elements = OverlayManager.getElements();
        if (elements && elements.length > 0) {
          dispatchCustomEvent("SET_ELEMENTS", { elements });
        }
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
      const { elements } = await chrome.storage.local.get("elements");
      if (elements) {
        await OverlayManager.elementManager?.loadElements(elements);

        // Force dispatch elements after loading
        const currentElements = OverlayManager.getElements();
        dispatchCustomEvent("SET_ELEMENTS", { elements: currentElements });
      }
    } catch (error) {
      console.error("Error loading elements:", error);
    }
  }

  private handleTimeUpdate = (currentTimeMs: number): void => {
    const elements = OverlayManager.elementManager?.getElements() || [];
    OverlayManager.update(currentTimeMs, elements);
  };

  private startPlay(): void {
    if (this.videoManager) {
      this.videoManager.addTimeUpdateListener(this.handleTimeUpdate);
    }
  }

  private saveElements(): void {
    const elements = OverlayManager.getElements();
    chrome.storage.local.set({ elements });
    alert("Elements saved successfully!");
  }

  private async getInstructions(): Promise<Instruction[]> {
    return new Promise<Instruction[]>((resolve) => {
      chrome.storage.local.get("instructions", (result) => {
        resolve(result.instructions || []);
      });
    });
  }

  private initializeInstructionsHandling(): void {
    // Load instructions when app is ready
    const cleanup1 = addCustomEventListener("REACT_APP_READY", () => {
      this.loadInstructions();
    });

    // Save instructions when requested
    const cleanup2 = addCustomEventListener(
      "SAVE_INSTRUCTIONS",
      ({ instructions }) => {
        this.saveInstructions(instructions);
      }
    );

    this.cleanupListeners.push(cleanup1, cleanup2);
  }

  private async loadInstructions(): Promise<void> {
    try {
      const result = await chrome.storage.local.get("instructions");
      const instructions = result.instructions || [];
      dispatchCustomEvent("SET_INSTRUCTIONS", { instructions });
    } catch (error) {
      console.error("Failed to load instructions:", error);
    }
  }

  private async saveInstructions(instructions: Instruction[]): Promise<void> {
    try {
      await chrome.storage.local.set({ instructions });
      console.log("Instructions saved successfully");
    } catch (error) {
      console.error("Failed to save instructions:", error);
    }
  }

  private cleanup(): void {
    this.cleanupListeners.forEach((cleanup) => cleanup());
    this.cleanupListeners = [];
  }
}

export const contentScript = new ContentScript();
