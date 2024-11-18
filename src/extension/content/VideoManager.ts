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
  private lastInstructionId: string | null = null;

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

    this.videoOverlayManager?.destroy();
    this.videoOverlayManager = null;
  }

  private handleVideoPlay = (): void => {};

  private handleVideoPause = (): void => {};

  private handleVideoSeeking = (event: Event): void => {
    // Reset lastInstructionId to allow instructions to trigger again upon seeking
    this.lastInstructionId = null;

    // Clear any existing resume timeout
    if ((this.videoElement as any)._resumeTimeout) {
      clearTimeout((this.videoElement as any)._resumeTimeout);
      (this.videoElement as any)._resumeTimeout = null;
    }
  };

  private handleVolumeChange = (event: Event): void => {};

  private handleTimeUpdate = (event: Event): void => {
    const video = event.target as HTMLVideoElement;
    const currentTime = video.currentTime; // Current time in seconds

    dispatchCustomEvent("VIDEO_TIME_UPDATE", {
      currentTimeMs: currentTime * 1000,
    });
    this.checkInstructions(currentTime);

    // Call updateVisibility on ElementManager
    this.timeUpdateListeners.forEach((listener) =>
      listener(currentTime * 1000)
    );
  };

  private async checkInstructions(currentTime: number): Promise<void> {
    const instruction = this.instructions.find(
      (instr: Instruction) =>
        instr.type === "pause" &&
        Math.abs(currentTime - instr.triggerTime / 1000) < 0.1 // 0.1 seconds tolerance
    ) as PauseInstruction | undefined;

    if (instruction) {
      if (this.lastInstructionId !== instruction.id) {
        this.lastInstructionId = instruction.id;
        if (instruction.overlayVideo?.url) {
          await this.handleInstructionPauseWithOverlay(instruction);
        } else {
          this.handleInstructionPause(instruction);
        }
      }
    } else {
      // No active instruction, hide overlay
      this.videoOverlayManager?.hideOverlay();
      this.lastInstructionId = null;
    }
  }

  private handleInstructionSkip = (skipToTime: number): void => {
    if (this.videoElement) {
      this.videoElement.currentTime = skipToTime / 1000;
    }
  };

  private handleInstructionPause = (instruction: PauseInstruction): void => {
    console.log(`Pausing video for ${instruction.pauseDuration} seconds.`);
    if (this.videoElement && !this.videoElement.paused) {
      this.videoElement.pause();

      const pauseDuration = instruction.pauseDuration || 0;

      const resumeTimeout = setTimeout(() => {
        if (this.videoElement && this.videoElement.paused) {
          this.videoElement.play().catch((error) => {
            console.error("Error resuming video:", error);
          });
        }
      }, pauseDuration * 1000); // Convert to milliseconds

      // Store the timeout to clear it if needed
      (this.videoElement as any)._resumeTimeout = resumeTimeout;
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
    this.instructions = instructions;
    this.lastInstructionId = null; // Reset when instructions change
  }

  private async handleInstructionPauseWithOverlay(
    instruction: PauseInstruction
  ): Promise<void> {
    console.log("Handling instruction with overlay video:", instruction);
    if (this.videoElement && !this.videoElement.paused) {
      this.videoElement.pause();

      // Play the overlay video with mute setting
      await this.videoOverlayManager?.playOverlayVideo(
        instruction.overlayVideo!.url,
        instruction.muteOverlayVideo || false
      );

      // Wait for overlay to finish
      this.videoOverlayManager?.onOverlayEnded(() => {
        // Ensure the video hasn't been played already (in case of rapid seeking)
        if (this.lastInstructionId === instruction.id) {
          // Hide the overlay video
          this.videoOverlayManager?.hideOverlay();

          if (this.videoElement && this.videoElement.paused) {
            this.videoElement.play().catch((error) => {
              console.error("Error resuming video:", error);
            });
          }
        }
      });

      // If useOverlayDuration is false, resume main video after pauseDuration
      if (!instruction.useOverlayDuration) {
        const pauseDuration = instruction.pauseDuration || 0;

        const resumeTimeout = setTimeout(() => {
          // Hide the overlay video
          this.videoOverlayManager?.hideOverlay();

          if (this.videoElement && this.videoElement.paused) {
            this.videoElement.play().catch((error) => {
              console.error("Error resuming video:", error);
            });
          }
        }, pauseDuration * 1000); // Convert to milliseconds

        // Store the timeout to clear it if needed
        (this.videoElement as any)._resumeTimeout = resumeTimeout;
      }
    }
  }
}
