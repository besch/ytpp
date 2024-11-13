export class VideoOverlayManager {
  private videoElement: HTMLVideoElement;
  private overlayVideo: HTMLVideoElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private container: HTMLElement | null = null;
  private videoBlobUrl: string | null = null;

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
    this.overlayVideo.style.position = "absolute";
    this.overlayVideo.style.top = "0";
    this.overlayVideo.style.left = "0";
    this.overlayVideo.style.width = "100%";
    this.overlayVideo.style.height = "100%";
    this.overlayVideo.style.display = "none";
    this.overlayVideo.style.zIndex = "2"; // Ensure it's above the main video
    this.overlayVideo.controls = true;
    this.overlayVideo.loop = false;

    this.container?.insertBefore(this.overlayVideo, this.container.firstChild);

    // Hide overlay video when it ends
    this.overlayVideo.addEventListener("ended", this.hideOverlay);
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
   */
  public async playOverlayVideo(videoUrl: string): Promise<void> {
    if (!this.overlayVideo) return;

    try {
      // If the videoUrl is a blob URL, revoke the previous one
      if (this.videoBlobUrl) {
        URL.revokeObjectURL(this.videoBlobUrl);
      }

      this.overlayVideo.src = videoUrl;
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
  private hideOverlay = (): void => {
    if (this.overlayVideo) {
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
}
