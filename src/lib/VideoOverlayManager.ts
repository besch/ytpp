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
      this.videoElement.parentElement || document.body;
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

      if (mediaType === "video" || mediaType === "image") {
        const mediaElement =
          mediaType === "video"
            ? document.createElement("video")
            : document.createElement("img");

        mediaElement.src = mediaUrl;
        if (mediaElement instanceof HTMLVideoElement) {
          mediaElement.muted = muteOverlay;
        }

        if (position) {
          const videoRect = this.videoElement.getBoundingClientRect();
          const scale = videoRect.width / config.mediaPositionerWidth;

          // Create a container div to maintain aspect ratio
          const containerDiv = document.createElement("div");
          containerDiv.style.position = "absolute";
          containerDiv.style.left = `${position.x * scale}px`;
          containerDiv.style.top = `${position.y * scale}px`;
          containerDiv.style.width = `${position.width * scale}px`;
          containerDiv.style.height = `${position.height * scale}px`;

          // Style the media element to maintain aspect ratio
          mediaElement.style.position = "absolute";
          mediaElement.style.width = "100%";
          mediaElement.style.height = "100%";
          mediaElement.style.objectFit = "contain";

          containerDiv.appendChild(mediaElement);
          overlayContainer.appendChild(containerDiv);
        } else {
          mediaElement.style.width = "100%";
          mediaElement.style.height = "100%";
          mediaElement.style.objectFit = "contain";
          overlayContainer.appendChild(mediaElement);
        }

        if (mediaElement instanceof HTMLVideoElement) {
          // Add event listener for video loaded metadata
          await new Promise<void>((resolve) => {
            mediaElement.addEventListener("loadedmetadata", () => resolve());
          });

          // If duration is specified and less than video duration, set timeout
          if (duration && duration < mediaElement.duration) {
            this.overlayTimeout = window.setTimeout(() => {
              this.hideOverlay(id);
              if (this.overlayEndedCallback) {
                this.overlayEndedCallback();
              }
            }, duration * 1000);
          } else {
            // If no duration specified or duration longer than video, use video's ended event
            mediaElement.addEventListener("ended", () => {
              this.hideOverlay(id);
              if (this.overlayEndedCallback) {
                this.overlayEndedCallback();
              }
            });
          }
          await mediaElement.play();
        } else if (duration) {
          // For images, use the specified duration
          this.overlayTimeout = window.setTimeout(() => {
            this.hideOverlay(id);
            if (this.overlayEndedCallback) {
              this.overlayEndedCallback();
            }
          }, duration * 1000);
        }
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

  private getAnimationClass(animation: string): string {
    switch (animation) {
      case "fade":
        return "animate-fade-in";
      case "slide":
        return "animate-slide-in";
      case "bounce":
        return "animate-bounce-in";
      case "scale":
        return "animate-scale-in";
      default:
        return "";
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

    // Calculate scale based on video size
    const videoRect = this.videoElement.getBoundingClientRect();
    const scale = videoRect.width / config.mediaPositionerWidth;

    const textElement = document.createElement("div");
    Object.assign(textElement.style, {
      position: "absolute",
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${position.width}px`,
      height: `${position.height}px`,
      fontFamily: style.fontFamily,
      fontSize: `${Math.round(style.fontSize * scale)}px`,
      color: style.color,
      backgroundColor: style.transparentBackground
        ? "transparent"
        : style.backgroundColor || "transparent",
      fontWeight: style.fontWeight || "normal",
      fontStyle: style.fontStyle || "normal",
      display: "flex",
      alignItems: "center",
      justifyContent:
        style.textAlign === "left"
          ? "flex-start"
          : style.textAlign === "right"
          ? "flex-end"
          : "center",
      padding: `${Math.round((style.padding || 8) * scale)}px`,
      opacity: style.opacity || 1,
      borderRadius: `${Math.round((style.borderRadius || 0) * scale)}px`,
      textShadow: style.textShadow ? "2px 2px 4px rgba(0,0,0,0.5)" : "none",
      transition: "opacity 0.3s ease-in-out",
      overflow: "hidden",
      boxSizing: "border-box",
    });

    textElement.textContent = text;
    textElement.className = this.getAnimationClass(style.animation || "none");
    overlayContainer.appendChild(textElement);

    if (duration) {
      this.overlayTimeout = window.setTimeout(() => {
        textElement.style.opacity = "0";
        setTimeout(() => {
          this.hideOverlay(id);
          if (this.overlayEndedCallback) {
            this.overlayEndedCallback();
          }
        }, 300);
      }, duration * 1000);
    }
  }
}
