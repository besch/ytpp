import { VideoManager } from "./content/VideoManager";
import { OverlayManager } from "./content/OverlayManager";

class ContentScript {
  private videoManager: VideoManager | null = null;
  private elements: any[] = [];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.setupMessageListener();
    this.setupUnloadListener();
    this.setupCustomEventListeners();
    this.injectReactApp();

    this.videoManager = new VideoManager();
    this.videoManager.findAndStoreVideoElement().then(() => {
      if (this.videoManager?.hasVideoElement()) {
        OverlayManager.createOverlay(
          this.videoManager!.getVideoElement()!,
          true
        );
        this.loadElements(() => {
          OverlayManager.loadElements(this.elements);
        });
      }
    });
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
    if (message.action === "ADD_ELEMENT") {
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
