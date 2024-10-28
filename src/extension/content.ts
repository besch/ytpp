import { VideoManager } from "./content/VideoManager";
import { OverlayManager } from "./content/OverlayManager";

class ContentScript {
  private isEditMode: boolean = false;
  private isPlayMode: boolean = false;
  private videoManager: VideoManager | null = null;
  private elements: any[] = [];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.setupMessageListener();
    this.setupUnloadListener();

    this.videoManager = new VideoManager();
    this.videoManager.findAndStoreVideoElement().then(() => {
      // Automatically enable play mode on initialization
      this.isPlayMode = true;
      this.enablePlayMode();

      // Notify the UI that content script is loaded
      window.postMessage("__CONTENT_SCRIPT_LOADED__", "*");
    });
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
    if (message.action === "ENABLE_EDIT_MODE") {
      this.isEditMode = true;
      this.isPlayMode = false;
      this.enableEditMode();
    } else if (message.action === "ENABLE_PLAY_MODE") {
      this.isEditMode = false;
      this.isPlayMode = true;
      this.enablePlayMode();
    } else if (message.action === "ADD_ELEMENT") {
      OverlayManager.addElement(message.elementType);
    } else if (message.action === "SAVE_ELEMENTS") {
      this.saveElements();
    }
    return true;
  }

  private enableEditMode(): void {
    if (this.videoManager && this.videoManager.hasVideoElement()) {
      const videoElement = this.videoManager.getVideoElement();
      OverlayManager.createOverlay(videoElement!, true);
    }
  }

  private enablePlayMode(): void {
    if (this.videoManager && this.videoManager.hasVideoElement()) {
      const videoElement = this.videoManager.getVideoElement();

      // Create canvas overlay without editing capabilities
      OverlayManager.createOverlay(videoElement!, false);

      // Load elements from storage and add to canvas
      this.loadElements(() => {
        OverlayManager.loadElements(this.elements);
      });

      this.startPlay();
    }
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
(window as any).__CONTENT_SCRIPT_LOADED__ = true;
