export class VideoOverlayManager {
  private videoElement: HTMLVideoElement;
  private overlayVideo: HTMLVideoElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private container: HTMLElement | null = null;
  private videoBlobUrl: string | null = null;
  private overlayEndedCallback: (() => void) | null = null;

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.initialize();
  }

  private initialize(): void {
    this.container =
      this.videoElement.closest(".html5-video-container") || document.body;
    this.setupOverlayVideo();
    this.setupResizeObserver();
  }

  private setupOverlayVideo(): void {
    this.overlayVideo = document.createElement("video");
    this.overlayVideo.classList.add("youtube-uncensored-video");

    Object.assign(this.overlayVideo.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      display: "none",
      zIndex: "2",
      pointerEvents: "none", // Allow clicks through overlay
    });

    this.overlayVideo.controls = false;
    this.overlayVideo.loop = false;

    if (this.container) {
      this.container.insertBefore(this.overlayVideo, this.container.firstChild);
    }

    this.overlayVideo.addEventListener("ended", () => {
      this.hideOverlay();
      if (this.overlayEndedCallback) {
        this.overlayEndedCallback();
      }
    });
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
    if (!this.videoElement || !this.overlayVideo) return;

    const { width, height } = this.videoElement.getBoundingClientRect();
    this.overlayVideo.style.width = `${width}px`;
    this.overlayVideo.style.height = `${height}px`;
  }

  /**
   * Plays the overlay video.
   * @param videoUrl - The URL of the overlay video.
   * @param muteOverlay - Whether to mute the overlay video.
   */
  public async playOverlayVideo(
    videoUrl: string,
    muteOverlay: boolean = false
  ): Promise<void> {
    if (!this.overlayVideo) return;

    console.log("Playing overlay video:", videoUrl);

    try {
      // Revoke previous blob URL if any
      if (this.videoBlobUrl) {
        URL.revokeObjectURL(this.videoBlobUrl);
      }

      this.overlayVideo.src = videoUrl;
      this.overlayVideo.muted = muteOverlay; // Apply mute setting
      this.videoBlobUrl = videoUrl;
      this.overlayVideo.style.display = "block";

      await this.overlayVideo.play();
    } catch (error) {
      console.error("Error playing overlay video:", error);
      this.hideOverlay();
    }
  }

  /**
   * Hides the overlay video.
   */
  public hideOverlay = (): void => {
    if (this.overlayVideo) {
      this.overlayVideo.pause();
      this.overlayVideo.style.display = "none";
      this.overlayVideo.src = "";
      if (this.videoBlobUrl) {
        URL.revokeObjectURL(this.videoBlobUrl);
        this.videoBlobUrl = null;
      }
    }
  };

  /**
   * Destroys the VideoOverlayManager instance and cleans up resources.
   */
  public destroy(): void {
    this.resizeObserver?.disconnect();
    if (this.overlayVideo) {
      this.overlayVideo.removeEventListener("ended", this.hideOverlay);
      this.overlayVideo.remove();
    }
  }

  public onOverlayEnded(callback: () => void): void {
    this.overlayEndedCallback = callback;
  }
}
