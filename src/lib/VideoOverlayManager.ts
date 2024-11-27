export class VideoOverlayManager {
  private videoElement: HTMLVideoElement;
  private overlayElement: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private container: HTMLElement | null = null;
  private mediaBlobUrl: string | null = null;
  private overlayEndedCallback: (() => void) | null = null;
  private overlayTimeout: number | null = null;
  private audioElement: HTMLAudioElement | null = null;

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
    this.overlayElement.classList.add("timelines-overlay");

    Object.assign(this.overlayElement.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      display: "none",
      zIndex: "2",
      pointerEvents: "none", // Allow clicks through overlay
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
    muteOverlay: boolean = false,
    mediaType: "video" | "image" | "audio",
    duration?: number,
    position?: { x: number; y: number; width: number; height: number }
  ): Promise<void> {
    if (!this.overlayElement) return;

    try {
      while (this.overlayElement.firstChild) {
        this.overlayElement.removeChild(this.overlayElement.firstChild);
      }

      if (this.mediaBlobUrl) {
        URL.revokeObjectURL(this.mediaBlobUrl);
      }

      this.mediaBlobUrl = mediaUrl;

      if (mediaType === "video") {
        const overlayVideo = document.createElement("video");
        overlayVideo.src = mediaUrl;
        overlayVideo.muted = muteOverlay;

        if (position) {
          const containerRect = this.container?.getBoundingClientRect();
          const videoRect = this.videoElement.getBoundingClientRect();
          const scale = videoRect.width / 320;

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
          this.hideOverlay();
          if (this.overlayEndedCallback) {
            this.overlayEndedCallback();
          }
        });

        this.overlayElement.appendChild(overlayVideo);
        this.overlayElement.style.display = "block";

        await overlayVideo.play();
      } else if (mediaType === "image") {
        const overlayImage = document.createElement("img");
        overlayImage.src = mediaUrl;

        if (position) {
          const containerRect = this.container?.getBoundingClientRect();
          const videoRect = this.videoElement.getBoundingClientRect();
          const scale = videoRect.width / 320;

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

        this.overlayElement.appendChild(overlayImage);
        this.overlayElement.style.display = "block";

        const displayDuration = duration ? duration * 1000 : 5000;
        this.overlayTimeout = window.setTimeout(() => {
          this.hideOverlay();
          if (this.overlayEndedCallback) {
            this.overlayEndedCallback();
          }
        }, displayDuration);
      } else if (mediaType === "audio") {
        this.audioElement = document.createElement("audio");
        this.audioElement.src = mediaUrl;
        this.audioElement.muted = muteOverlay;

        this.audioElement.addEventListener("ended", () => {
          this.hideOverlay();
          if (this.overlayEndedCallback) {
            this.overlayEndedCallback();
          }
        });

        await this.audioElement.play();

        if (duration) {
          this.overlayTimeout = window.setTimeout(() => {
            this.hideOverlay();
            if (this.overlayEndedCallback) {
              this.overlayEndedCallback();
            }
          }, duration * 1000);
        }
      }
    } catch (error) {
      console.error("Error playing overlay media:", error);
      this.hideOverlay();
    }
  }

  /**
   * Hides the overlay media.
   */
  public hideOverlay = (): void => {
    if (this.overlayElement) {
      this.overlayElement.style.display = "none";
      while (this.overlayElement.firstChild) {
        this.overlayElement.removeChild(this.overlayElement.firstChild);
      }
      if (this.mediaBlobUrl) {
        URL.revokeObjectURL(this.mediaBlobUrl);
        this.mediaBlobUrl = null;
      }
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
    if (this.overlayElement) {
      this.overlayElement.remove();
    }
    if (this.overlayTimeout) {
      clearTimeout(this.overlayTimeout);
    }
  }

  public onOverlayEnded(callback: () => void): void {
    this.overlayEndedCallback = callback;
  }
}
