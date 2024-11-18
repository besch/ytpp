export class VideoOverlayManager {
  private videoElement: HTMLVideoElement;
  private overlayElement: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private container: HTMLElement | null = null;
  private mediaBlobUrl: string | null = null;
  private overlayEndedCallback: (() => void) | null = null;
  private overlayTimeout: number | null = null;

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
    this.overlayElement.classList.add("youtube-uncensored-overlay");

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
   * @param mediaType - The type of the media ("video" or "image").
   */
  public async playOverlayMedia(
    mediaUrl: string,
    muteOverlay: boolean = false,
    mediaType: "video" | "image",
    duration?: number
  ): Promise<void> {
    if (!this.overlayElement) return;

    console.log("Playing overlay media:", mediaUrl);

    try {
      // Clear any existing content
      this.overlayElement.innerHTML = "";

      // Revoke previous blob URL if any
      if (this.mediaBlobUrl) {
        URL.revokeObjectURL(this.mediaBlobUrl);
      }

      this.mediaBlobUrl = mediaUrl;

      if (mediaType === "video") {
        const overlayVideo = document.createElement("video");
        overlayVideo.src = mediaUrl;
        overlayVideo.muted = muteOverlay; // Apply mute setting
        overlayVideo.style.width = "100%";
        overlayVideo.style.height = "100%";
        overlayVideo.style.objectFit = "contain";

        overlayVideo.addEventListener("ended", () => {
          this.hideOverlay();
          if (this.overlayEndedCallback) {
            this.overlayEndedCallback();
          }
        });

        this.overlayElement.appendChild(overlayVideo);
        this.overlayElement.style.display = "block";

        await overlayVideo.play();
      } else {
        const overlayImage = document.createElement("img");
        overlayImage.src = mediaUrl;
        overlayImage.style.width = "100%";
        overlayImage.style.height = "100%";
        overlayImage.style.objectFit = "contain";

        this.overlayElement.appendChild(overlayImage);
        this.overlayElement.style.display = "block";

        // Display the image for the specified duration
        this.overlayTimeout = window.setTimeout(() => {
          this.hideOverlay();
          if (this.overlayEndedCallback) {
            this.overlayEndedCallback();
          }
        }, (duration || 5) * 1000); // Default to 5 seconds if duration is not provided
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
      this.overlayElement.innerHTML = "";
      if (this.mediaBlobUrl) {
        URL.revokeObjectURL(this.mediaBlobUrl);
        this.mediaBlobUrl = null;
      }
    }
    if (this.overlayTimeout) {
      clearTimeout(this.overlayTimeout);
      this.overlayTimeout = null;
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
