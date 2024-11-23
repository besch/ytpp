import {
  Instruction,
  PauseInstruction,
  OverlayInstruction,
  SkipInstruction,
} from "@/types";
import { addCustomEventListener, dispatchCustomEvent } from "@/lib/eventSystem";
import { VideoOverlayManager } from "./VideoOverlayManager";

export class VideoManager {
  private videoElement: HTMLVideoElement | null = null;
  private originalVideoVolume: number = 1;
  private currentVideoPlayerVolume: number = 1;
  private timeUpdateListeners: Array<(currentTimeMs: number) => void> = [];
  private cleanupListeners: Array<() => void> = [];
  private videoOverlayManager: VideoOverlayManager | null = null;
  private instructions: Instruction[] = [];
  private lastInstructionId: string | null = null;
  private activeOverlayInstruction: OverlayInstruction | null = null;
  private activeOverlayEndTime: number | null = null;

  constructor() {
    const cleanupListeners = [
      addCustomEventListener("SEEK_TO_TIME", ({ timeMs }) => {
        this.handleSeekToTime(timeMs);
      }),
    ];

    this.cleanupListeners.push(...cleanupListeners);
  }

  public async findAndStoreVideoElement(): Promise<void> {
    this.videoElement = document.querySelector("video:not(.timelines-video)");

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
    const currentTime = video.currentTime;
    const lastTime = (video as any)._lastTime || 0;

    dispatchCustomEvent("VIDEO_TIME_UPDATE", {
      currentTimeMs: currentTime * 1000,
    });

    // Check for instructions between last update and current time
    this.checkInstructions(lastTime, currentTime);

    // Store the current time for next update
    (video as any)._lastTime = currentTime;

    this.timeUpdateListeners.forEach((listener) =>
      listener(currentTime * 1000)
    );
  };

  private async checkInstructions(
    lastTime: number,
    currentTime: number
  ): Promise<void> {
    // Handle active overlay check as before
    if (
      this.activeOverlayInstruction &&
      currentTime >= this.activeOverlayEndTime!
    ) {
      this.videoOverlayManager?.hideOverlay();
      this.activeOverlayInstruction = null;
      this.activeOverlayEndTime = null;
    }

    // Find instructions that should trigger between lastTime and currentTime
    const instructionsToTrigger = this.instructions.filter(
      (instr: Instruction) => {
        const instrTime = instr.triggerTime / 1000;
        return instrTime > lastTime && instrTime <= currentTime;
      }
    );

    for (const instruction of instructionsToTrigger) {
      if (this.lastInstructionId !== instruction.id) {
        this.lastInstructionId = instruction.id;

        if (instruction.type === "pause") {
          const pauseInstruction = instruction as PauseInstruction;
          if (pauseInstruction.overlayMedia?.url) {
            await this.handleInstructionPauseWithOverlay(pauseInstruction);
          } else {
            this.handleInstructionPause(pauseInstruction);
          }
        } else if (instruction.type === "overlay") {
          const overlayInstruction = instruction as OverlayInstruction;
          await this.handleOverlayInstruction(overlayInstruction);
        } else if (instruction.type === "skip") {
          if (this.videoElement && !this.videoElement.paused) {
            const skipInstruction = instruction as SkipInstruction;
            this.handleInstructionSkip(skipInstruction.skipToTime);
          } else {
            console.log(
              "Video is paused, skip instruction will not be executed"
            );
          }
        }
      }
    }
  }

  private async handleOverlayInstruction(
    instruction: OverlayInstruction
  ): Promise<void> {
    console.log("Handling overlay instruction:", instruction);

    // Only proceed if video is not paused
    if (!this.videoElement || this.videoElement.paused) {
      console.log("Video is paused, overlay instruction will not be executed");
      return;
    }

    // Determine media type
    const mediaType = instruction.overlayMedia!.type.startsWith("video/")
      ? "video"
      : instruction.overlayMedia!.type.startsWith("audio/")
      ? "audio"
      : "image";

    // Set active overlay instruction and calculate end time
    this.activeOverlayInstruction = instruction;

    if (instruction.useOverlayDuration) {
      // Use the media's intrinsic duration
      const duration =
        mediaType === "video" || mediaType === "audio"
          ? instruction.overlayMedia!.duration
          : instruction.overlayMedia!.duration || 5; // Default to 5 seconds for images without duration
      this.activeOverlayEndTime = instruction.triggerTime / 1000 + duration;
    } else {
      // Use specified overlay duration
      const duration = instruction.overlayMedia!.duration || 5;
      this.activeOverlayEndTime = instruction.triggerTime / 1000 + duration;
    }

    // Play the overlay media with mute setting
    await this.videoOverlayManager?.playOverlayMedia(
      instruction.overlayMedia!.url,
      instruction.muteOverlayMedia || false,
      mediaType,
      instruction.useOverlayDuration
        ? instruction.overlayMedia!.duration
        : instruction.overlayMedia!.duration
    );
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
    console.log("Handling instruction with overlay media:", instruction);
    if (this.videoElement && !this.videoElement.paused) {
      this.videoElement.pause();

      // Determine media type
      const mediaType = instruction.overlayMedia!.type.startsWith("video/")
        ? "video"
        : instruction.overlayMedia!.type.startsWith("audio/")
        ? "audio"
        : "image";

      // Play the overlay media with mute setting
      await this.videoOverlayManager?.playOverlayMedia(
        instruction.overlayMedia!.url,
        instruction.muteOverlayMedia || false,
        mediaType,
        instruction.useOverlayDuration ? undefined : instruction.pauseDuration
      );

      // If useOverlayDuration is false, we need to ensure the main video resumes after pauseDuration
      if (!instruction.useOverlayDuration) {
        const pauseDuration = instruction.pauseDuration || 0;

        const resumeTimeout = setTimeout(() => {
          // Hide the overlay media
          this.videoOverlayManager?.hideOverlay();

          if (this.videoElement && this.videoElement.paused) {
            this.videoElement.play().catch((error) => {
              console.error("Error resuming video:", error);
            });
          }
        }, pauseDuration * 1000); // Convert to milliseconds

        // Store the timeout to clear it if needed
        (this.videoElement as any)._resumeTimeout = resumeTimeout;
      } else {
        // If useOverlayDuration is true, resume main video when overlay ends
        this.videoOverlayManager?.onOverlayEnded(() => {
          // Ensure the video hasn't been played already (in case of rapid seeking)
          if (this.lastInstructionId === instruction.id) {
            // Hide the overlay media
            this.videoOverlayManager?.hideOverlay();

            if (this.videoElement && this.videoElement.paused) {
              this.videoElement.play().catch((error) => {
                console.error("Error resuming video:", error);
              });
            }
          }
        });
      }
    }
  }
}
