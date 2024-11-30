import config from "@/lib/config";
import { TextStyle } from "@/types";

export class VideoOverlayManager {
  private videoElement: HTMLVideoElement;
  private overlayElement: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private container: HTMLElement | null = null;
  private mediaBlobUrl: string | null = null;
  private overlayEndedCallback: (() => void) | null = null;
  private overlayTimeout: number | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private overlayElements: Map<string, HTMLElement> = new Map();

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.initialize();
  }

  private initialize(): void {
    this.container =
      this.videoElement.closest(".html5-video-container") || document.body;
    this.setupOverlayElement();
    this.setupResizeObserver();
  }

  private setupOverlayElement(): void {
    this.overlayElement = document.createElement("div");
    this.overlayElement.classList.add("timelines-overlay-container");

    Object.assign(this.overlayElement.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "2",
      pointerEvents: "none",
    });

    if (this.container) {
      this.container.insertBefore(
        this.overlayElement,
        this.container.firstChild
      );
    }
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.updateOverlaySize();
    });

    if (this.videoElement) {
      this.resizeObserver.observe(this.videoElement);
    }
  }

  private updateOverlaySize(): void {
    if (!this.videoElement || !this.overlayElement) return;

    const { width, height } = this.videoElement.getBoundingClientRect();
    this.overlayElement.style.width = `${width}px`;
    this.overlayElement.style.height = `${height}px`;
  }

  /**
   * Plays the overlay media.
   * @param mediaUrl - The URL of the overlay media.
   * @param muteOverlay - Whether to mute the overlay media.
   * @param mediaType - The type of the media ("video", "image", or "audio").
   */
  public async playOverlayMedia(
    mediaUrl: string,
    muteOverlay: boolean,
    mediaType: "video" | "image" | "audio",
    id: string,
    duration?: number,
    position?: { x: number; y: number; width: number; height: number }
  ): Promise<void> {
    if (!this.overlayElement) return;

    try {
      const overlayContainer = document.createElement("div");
      overlayContainer.style.position = "absolute";
      overlayContainer.style.top = "0";
      overlayContainer.style.left = "0";
      overlayContainer.style.width = "100%";
      overlayContainer.style.height = "100%";

      this.overlayElements.set(id, overlayContainer);
      this.overlayElement.appendChild(overlayContainer);

      if (this.mediaBlobUrl) {
        URL.revokeObjectURL(this.mediaBlobUrl);
      }

      this.mediaBlobUrl = mediaUrl;

      if (mediaType === "video") {
        const overlayVideo = document.createElement("video");
        overlayVideo.src = mediaUrl;
        overlayVideo.muted = muteOverlay;

        if (position) {
          const videoRect = this.videoElement.getBoundingClientRect();
          const scale = videoRect.width / config.mediaPositionerWidth;

          overlayVideo.style.position = "absolute";
          overlayVideo.style.left = `${position.x * scale}px`;
          overlayVideo.style.top = `${position.y * scale}px`;
          overlayVideo.style.width = `${position.width * scale}px`;
          overlayVideo.style.height = `${position.height * scale}px`;
          overlayVideo.style.objectFit = "fill";
        } else {
          overlayVideo.style.width = "100%";
          overlayVideo.style.height = "100%";
          overlayVideo.style.objectFit = "contain";
        }

        overlayVideo.addEventListener("ended", () => {
          this.hideOverlay(id);
          if (this.overlayEndedCallback) {
            this.overlayEndedCallback();
          }
        });

        overlayContainer.appendChild(overlayVideo);
        await overlayVideo.play();
      } else if (mediaType === "image") {
        const overlayImage = document.createElement("img");
        overlayImage.src = mediaUrl;

        if (position) {
          const videoRect = this.videoElement.getBoundingClientRect();
          const scale = videoRect.width / config.mediaPositionerWidth;

          overlayImage.style.position = "absolute";
          overlayImage.style.left = `${position.x * scale}px`;
          overlayImage.style.top = `${position.y * scale}px`;
          overlayImage.style.width = `${position.width * scale}px`;
          overlayImage.style.height = `${position.height * scale}px`;
          overlayImage.style.objectFit = "fill";
        } else {
          overlayImage.style.width = "100%";
          overlayImage.style.height = "100%";
          overlayImage.style.objectFit = "contain";
        }

        overlayContainer.appendChild(overlayImage);

        const displayDuration = duration ? duration * 1000 : 5000;
        this.overlayTimeout = window.setTimeout(() => {
          this.hideOverlay(id);
          if (this.overlayEndedCallback) {
            this.overlayEndedCallback();
          }
        }, displayDuration);
      } else if (mediaType === "audio") {
        this.audioElement = document.createElement("audio");
        this.audioElement.src = mediaUrl;
        this.audioElement.muted = muteOverlay;

        this.audioElement.addEventListener("ended", () => {
          this.hideOverlay(id);
          if (this.overlayEndedCallback) {
            this.overlayEndedCallback();
          }
        });

        await this.audioElement.play();

        if (duration) {
          this.overlayTimeout = window.setTimeout(() => {
            this.hideOverlay(id);
            if (this.overlayEndedCallback) {
              this.overlayEndedCallback();
            }
          }, duration * 1000);
        }
      }
    } catch (error) {
      console.error("Error playing overlay media:", error);
      this.hideOverlay(id);
    }
  }

  /**
   * Hides the overlay media.
   */
  public hideOverlay = (id: string): void => {
    const overlayElement = this.overlayElements.get(id);
    if (overlayElement) {
      overlayElement.remove();
      this.overlayElements.delete(id);
    }
    if (this.overlayTimeout) {
      clearTimeout(this.overlayTimeout);
      this.overlayTimeout = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
  };

  /**
   * Destroys the VideoOverlayManager instance and cleans up resources.
   */
  public destroy(): void {
    this.resizeObserver?.disconnect();
    this.overlayElements.forEach((element) => element.remove());
    this.overlayElements.clear();
    this.overlayElement?.remove();
  }

  public onOverlayEnded(callback: () => void): void {
    this.overlayEndedCallback = callback;
  }

  /**
   * Pauses the currently playing overlay media
   */
  public pauseOverlayMedia(): void {
    if (this.overlayElement) {
      const videoOverlay = this.overlayElement.querySelector("video");
      if (videoOverlay) {
        videoOverlay.pause();
      }
      if (this.audioElement) {
        this.audioElement.pause();
      }
    }
  }

  /**
   * Resumes the currently playing overlay media
   */
  public resumeOverlayMedia(): void {
    if (this.overlayElement) {
      const videoOverlay = this.overlayElement.querySelector("video");
      if (videoOverlay) {
        videoOverlay.play().catch((error) => {
          console.error("Error resuming overlay video:", error);
        });
      }
      if (this.audioElement) {
        this.audioElement.play().catch((error) => {
          console.error("Error resuming overlay audio:", error);
        });
      }
    }
  }

  public async displayTextOverlay(
    text: string,
    style: TextStyle,
    position: { x: number; y: number; width: number; height: number },
    duration: number,
    id: string
  ): Promise<void> {
    if (!this.overlayElement) return;

    const overlayContainer = document.createElement("div");
    overlayContainer.style.position = "absolute";
    overlayContainer.style.top = "0";
    overlayContainer.style.left = "0";
    overlayContainer.style.width = "100%";
    overlayContainer.style.height = "100%";

    this.overlayElements.set(id, overlayContainer);
    this.overlayElement.appendChild(overlayContainer);

    const textElement = document.createElement("div");
    Object.assign(textElement.style, {
      position: "absolute",
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${position.width}px`,
      height: `${position.height}px`,
      fontFamily: style.fontFamily,
      fontSize: `${style.fontSize}px`,
      color: style.color,
      backgroundColor: style.transparentBackground
        ? "transparent"
        : style.backgroundColor || "transparent",
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px",
      overflow: "hidden",
    });

    textElement.textContent = text;
    overlayContainer.appendChild(textElement);

    if (duration) {
      this.overlayTimeout = window.setTimeout(() => {
        this.hideOverlay(id);
        if (this.overlayEndedCallback) {
          this.overlayEndedCallback();
        }
      }, duration * 1000);
    }
  }
}
