import { VideoManager } from "./content/VideoManager";
import { OverlayManager } from "./content/OverlayManager";
import { Instruction } from "@/types";

class ContentScript {
  private videoManager: VideoManager | null = null;
  private elements: any[] = [];
  private isOverlayVisible: boolean = false;

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
    // Listen for add element events
    window.addEventListener("ADD_ELEMENT", ((event: CustomEvent) => {
      const { elementType, gifUrl } = event.detail;
      OverlayManager.addElement(elementType, gifUrl);
    }) as EventListener);

    // Listen for save elements events
    window.addEventListener("SAVE_ELEMENTS", (() => {
      const elements = OverlayManager.getElements();
      chrome.storage.local.set({ elements }, () => {
        // Dispatch success event back to React app
        window.dispatchEvent(
          new CustomEvent("SAVE_SUCCESS", {
            detail: { message: "Elements saved successfully!" },
          })
        );
      });
    }) as EventListener);

    // Listen for update element color events
    window.addEventListener("UPDATE_ELEMENT_COLOR", ((event: CustomEvent) => {
      const { color, type } = event.detail;
      OverlayManager.updateElementColor(color, type);
    }) as EventListener);

    // Listen for update element time events
    window.addEventListener("UPDATE_ELEMENT_TIME", ((event: CustomEvent) => {
      const { elementId, from, to } = event.detail;
      const selectedElement = OverlayManager.getSelectedElement();
      if (selectedElement && selectedElement.data?.id === elementId) {
        OverlayManager.updateElementTime(selectedElement, from, to);
      }
    }) as EventListener);

    // Listen for delete element events
    window.addEventListener("DELETE_ELEMENT", ((event: CustomEvent) => {
      OverlayManager.elementManager?.deleteSelectedElement();
    }) as EventListener);
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

  private loadElements(): void {
    const loadAndDispatchElements = () => {
      chrome.storage.local.get(["elements"], (result) => {
        this.elements = result.elements || [];
        OverlayManager.loadElements(this.elements);
        window.dispatchEvent(
          new CustomEvent("SET_ELEMENTS", {
            detail: { elements: this.elements },
          })
        );
      });
    };

    // Check if React app is already ready
    if ((window as any).__REACT_APP_READY__) {
      loadAndDispatchElements();
    } else {
      // Wait for React app ready event
      window.addEventListener("REACT_APP_READY", loadAndDispatchElements, {
        once: true,
      });
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
    window.addEventListener(
      "REACT_APP_READY",
      this.loadInstructions.bind(this)
    );

    // Save instructions when requested
    window.addEventListener("SAVE_INSTRUCTIONS", ((event: Event) => {
      const customEvent = event as CustomEvent<{ instructions: Instruction[] }>;
      this.saveInstructions(customEvent.detail.instructions);
    }) as EventListener);
  }

  private async loadInstructions(): Promise<void> {
    try {
      const result = await chrome.storage.local.get("instructions");
      const instructions = result.instructions || [];

      // Dispatch instructions to React app
      window.dispatchEvent(
        new CustomEvent("SET_INSTRUCTIONS", {
          detail: { instructions },
        })
      );
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
}

export const contentScript = new ContentScript();
