import { Instruction, PauseInstruction } from "@/types";
import { addCustomEventListener, dispatchCustomEvent } from "@/lib/eventSystem";
import { VideoOverlayManager } from "./VideoOverlayManager";

export class VideoManager {
  private videoElement: HTMLVideoElement | null = null;
  private originalVideoVolume: number = 1;
  private currentVideoPlayerVolume: number = 1;
  private timeUpdateListeners: Array<(currentTimeMs: number) => void> = [];
  private clickHandler: ((event: MouseEvent) => void) | null = null;
  private cleanupListeners: Array<() => void> = [];
  private videoOverlayManager: VideoOverlayManager | null = null;
  private instructions: Instruction[] = [];

  constructor() {
    const cleanupListeners = [
      addCustomEventListener("SEEK_TO_TIME", ({ timeMs }) => {
        this.handleSeekToTime(timeMs);
      }),
    ];

    this.cleanupListeners.push(...cleanupListeners);
  }

  public async findAndStoreVideoElement(): Promise<void> {
    this.videoElement = document.querySelector(
      "video:not(.youtube-uncensored-video)"
    );

    if (this.videoElement) {
      this.handleVideo(this.videoElement);
      (window as any).videoManager = this;

      // Initialize VideoOverlayManager with the video element
      this.videoOverlayManager = new VideoOverlayManager(this.videoElement);

      return Promise.resolve();
    }
    return Promise.resolve();
  }

  private handleVideo(video: HTMLVideoElement): void {
    this.videoElement = video;
    this.currentVideoPlayerVolume = video.volume;
    this.originalVideoVolume = video.volume;
    video.addEventListener("play", this.handleVideoPlay);
    video.addEventListener("pause", this.handleVideoPause);
    video.addEventListener("seeking", this.handleVideoSeeking);
    video.addEventListener("volumechange", this.handleVolumeChange);
    video.addEventListener("timeupdate", this.handleTimeUpdate);
    this.preventVideoClicks();
  }

  public removeVideoEventListeners(): void {
    if (this.videoElement) {
      // Clear any existing pause timeout
      if ((this.videoElement as any)._pauseTimeout) {
        clearTimeout((this.videoElement as any)._pauseTimeout);
      }

      this.videoElement.removeEventListener("play", this.handleVideoPlay);
      this.videoElement.removeEventListener("pause", this.handleVideoPause);
      this.videoElement.removeEventListener("seeking", this.handleVideoSeeking);
      this.videoElement.removeEventListener(
        "volumechange",
        this.handleVolumeChange
      );
      this.videoElement.removeEventListener(
        "timeupdate",
        this.handleTimeUpdate
      );
    }
    this.removeVideoClickPrevention();

    // Destroy VideoOverlayManager
    this.videoOverlayManager?.destroy();
    this.videoOverlayManager = null;
  }

  private handleVideoPlay = (): void => {};

  private handleVideoPause = (): void => {};

  private handleVideoSeeking = (event: Event): void => {};

  private handleVolumeChange = (event: Event): void => {};

  private handleTimeUpdate = (event: Event): void => {
    const video = event.target as HTMLVideoElement;
    const currentTimeMs = video.currentTime * 1000;

    dispatchCustomEvent("VIDEO_TIME_UPDATE", { currentTimeMs });
    this.checkInstructions(currentTimeMs);

    // Call updateVisibility on ElementManager
    this.timeUpdateListeners.forEach((listener) => listener(currentTimeMs));
  };

  private async checkInstructions(currentTimeMs: number): Promise<void> {
    const matchingInstruction = this.instructions.find(
      (instruction: Instruction) =>
        Math.abs(currentTimeMs - instruction.triggerTime) < 100
    );

    if (matchingInstruction && this.videoElement?.paused === false) {
      switch (matchingInstruction.type) {
        case "pause":
          this.handleInstructionPause(matchingInstruction);
          break;
        case "skip":
          this.handleInstructionSkip(matchingInstruction.skipToTime);
          break;
      }
    }
  }

  private handleInstructionSkip = (skipToTime: number): void => {
    if (this.videoElement) {
      this.videoElement.currentTime = skipToTime / 1000;
    }
  };

  private handleInstructionPause = (instruction: Instruction): void => {
    if (
      instruction.type === "pause" &&
      this.videoElement &&
      !this.videoElement.paused
    ) {
      this.videoElement.pause();

      const pauseDuration =
        (instruction as PauseInstruction).pauseDuration || 0;

      if (
        (instruction as PauseInstruction).overlayVideo?.url &&
        this.videoOverlayManager
      ) {
        this.videoOverlayManager
          .playOverlayVideo((instruction as PauseInstruction).overlayVideo!.url)
          .then(() => {
            // Resume video after overlay video ends
            this.videoElement?.play().catch((error) => {
              console.error("Error resuming video:", error);
            });
          });
      } else {
        // If no overlay video, resume after pauseDuration
        const resumeTime = setTimeout(() => {
          if (this.videoElement && this.videoElement.paused) {
            console.log("Resuming video after pause");
            this.videoElement.play().catch((error) => {
              console.error("Error resuming video:", error);
            });
          }
        }, pauseDuration * 1000);

        // Store the timeout to clear it if needed
        (this.videoElement as any)._pauseTimeout = resumeTime;
      }
    }
  };

  public addTimeUpdateListener(
    listener: (currentTimeMs: number) => void
  ): void {
    this.timeUpdateListeners.push(listener);
  }

  public removeTimeUpdateListener(
    listener: (currentTimeMs: number) => void
  ): void {
    this.timeUpdateListeners = this.timeUpdateListeners.filter(
      (l) => l !== listener
    );
  }

  public restoreOriginalVideoVolume(): void {
    if (this.videoElement && this.originalVideoVolume !== undefined) {
      this.videoElement.volume = this.originalVideoVolume;
      this.currentVideoPlayerVolume = this.originalVideoVolume;
    }
  }

  public getCurrentVideoTimeMs(): number {
    return this.videoElement ? this.videoElement.currentTime * 1000 : 0;
  }

  public hasVideoElement(): boolean {
    return !!this.videoElement;
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  public getCurrentVideoPlayerVolume(): number {
    return this.currentVideoPlayerVolume;
  }

  public setCurrentVideoPlayerVolume(volume: number): void {
    this.currentVideoPlayerVolume = volume;
  }

  public setupUnloadListener(): void {
    window.addEventListener("beforeunload", this.handlePageUnload);
  }

  private handlePageUnload = (): void => {
    this.restoreOriginalVideoVolume();
  };

  public preventVideoClicks(): void {
    if (this.videoElement) {
      this.videoElement.style.pointerEvents = "none";
    }

    this.clickHandler = (event: MouseEvent) => {
      if ((event.target as Element).matches("video")) {
        event.stopPropagation();
        event.preventDefault();
      }
    };

    window.addEventListener("click", this.clickHandler, true);
  }

  public removeVideoClickPrevention(): void {
    if (this.clickHandler) {
      window.removeEventListener("click", this.clickHandler, true);
      this.clickHandler = null;
    }
  }

  private handleSeekToTime = (timeMs: number): void => {
    if (this.videoElement) {
      this.videoElement.currentTime = timeMs / 1000;
    }
  };

  public destroy() {
    this.cleanupListeners.forEach((cleanup) => cleanup());
  }

  public seekTo(timeMs: number): void {
    if (this.videoElement) {
      this.videoElement.currentTime = timeMs / 1000;
    }
  }

  public setInstructions(instructions: Instruction[]): void {
    console.log("setInstructions", instructions);
    this.instructions = instructions;
  }
}
