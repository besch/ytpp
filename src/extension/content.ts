import { VideoManager } from "./content/VideoManager";
import { OverlayManager } from "./content/OverlayManager";

class ContentScript {
  private videoManager: VideoManager | null = null;
  private elements: any[] = [];
  private isOverlayVisible: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.setupMessageListener();
    this.setupUnloadListener();
    this.setupCustomEventListeners();

    // Don't inject React app immediately
    this.videoManager = new VideoManager();
    this.videoManager.findAndStoreVideoElement();
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
        this.loadElements(() => {
          OverlayManager.loadElements(this.elements);
        });
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
  }

  private setupCustomEventListeners(): void {
    // Listen for add element events
    window.addEventListener("ADD_ELEMENT", ((event: CustomEvent) => {
      const { elementType } = event.detail;
      OverlayManager.addElement(elementType);
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

    // Listen for element selection events from fabric.js
    window.addEventListener("ELEMENT_SELECTED", ((event: CustomEvent) => {
      const selectedElement = event.detail.element;
      // Forward the event to the injected React app
      window.dispatchEvent(
        new CustomEvent("ELEMENT_SELECTED", {
          detail: { element: selectedElement },
        })
      );
    }) as EventListener);

    window.addEventListener("SELECTION_CLEARED", (() => {
      // Forward the event to the injected React app
      window.dispatchEvent(new CustomEvent("SELECTION_CLEARED"));
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

  private loadElements(callback?: () => void): void {
    chrome.storage.local.get(["elements"], (result) => {
      this.elements = result.elements || [];
      if (callback) callback();
    });
  }

  private startPlay(): void {
    if (this.videoManager) {
      this.videoManager.addTimeUpdateListener(this.handleTimeUpdate);
    }
  }

  private handleTimeUpdate = (currentTimeMs: number): void => {
    OverlayManager.update(currentTimeMs, this.elements);
  };

  private saveElements(): void {
    const elements = OverlayManager.getElements();
    chrome.storage.local.set({ elements });
    alert("Elements saved successfully!");
  }
}

export const contentScript = new ContentScript();
