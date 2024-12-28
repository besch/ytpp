import {
  Instruction,
  OverlayInstruction,
  SkipInstruction,
  TextOverlayInstruction,
} from "@/types";
import { VideoOverlayManager } from "./VideoOverlayManager";
import { store } from "@/store";
import { seekToTime } from "@/store/timelineSlice";
import config from "./config";

export class VideoManager {
  private videoElement: HTMLVideoElement | null = null;
  private originalVideoVolume: number = 1;
  private currentVideoPlayerVolume: number = 1;
  private timeUpdateListeners: Array<(currentTimeMs: number) => void> = [];
  private cleanupListeners: Array<() => void> = [];
  private videoOverlayManager: VideoOverlayManager | null = null;
  private instructions: Instruction[] = [];
  private activeInstructions: Map<
    string,
    {
      instruction: Instruction;
      endTime: number | null;
    }
  > = new Map();
  private overlayEndedCallback: (() => void) | null = null;

  constructor() {
    this.cleanupListeners = [];
  }

  public async findAndStoreVideoElement(): Promise<void> {
    // First try to find video in main document
    this.videoElement = document.querySelector("video");

    if (this.videoElement) {
      if (!this.videoElement.id) {
        this.videoElement.id = "video-player";
      }
      this.handleVideo(this.videoElement);
      (window as any).videoManager = this;
      this.videoOverlayManager = new VideoOverlayManager(this.videoElement);
      return;
    }
  }

  private handleVideo(video: HTMLVideoElement): void {
    if (!this.videoOverlayManager) {
      this.videoOverlayManager = new VideoOverlayManager(video);
    }

    this.videoElement = video;
    this.currentVideoPlayerVolume = video.volume;
    this.originalVideoVolume = video.volume;
    video.addEventListener("play", this.handleVideoPlay);
    video.addEventListener("pause", this.handleVideoPause);
    video.addEventListener("seeking", this.handleVideoSeeking);
    video.addEventListener("volumechange", this.handleVolumeChange);
    video.addEventListener("timeupdate", this.handleTimeUpdate);
  }

  public async handleInstruction(instruction: Instruction): Promise<void> {
    switch (instruction.data.type) {
      case "overlay":
        await this.handleOverlayInstruction(instruction as OverlayInstruction);
        break;
      case "text-overlay":
        await this.handleTextOverlayInstruction(
          instruction as TextOverlayInstruction
        );
        break;
      case "skip":
        await this.handleSkipInstruction(instruction as SkipInstruction);
        break;
    }
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

  private handleVideoPlay = (): void => {
    // Resume any active overlay media when main video plays
    // this.videoOverlayManager?.resumeOverlayMedia();
  };

  private handleVideoPause = (): void => {
    // Pause any active overlay media when main video is paused
    // this.videoOverlayManager?.pauseOverlayMedia();
  };

  private handleVideoSeeking = (event: Event): void => {
    // Clear any active overlays when seeking
    this.activeInstructions.forEach((_, id) => {
      this.videoOverlayManager?.hideOverlay(id);
    });
    this.activeInstructions.clear();

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

    // Check for instructions in the last 280ms window
    this.checkInstructions(currentTime - 0.28, currentTime);

    this.timeUpdateListeners.forEach((listener) =>
      listener(currentTime * 1000)
    );
  };

  private async checkInstructions(
    lastTime: number,
    currentTime: number
  ): Promise<void> {
    // Check for expired instructions
    for (const [id, activeInstr] of this.activeInstructions) {
      if (activeInstr.endTime && currentTime >= activeInstr.endTime) {
        if (
          activeInstr.instruction.data.type === "overlay" ||
          activeInstr.instruction.data.type === "text-overlay"
        ) {
          this.videoOverlayManager?.hideOverlay(id);
        }
        this.activeInstructions.delete(id);
      }
    }

    // Find new instructions to trigger
    const instructionsToTrigger = this.instructions.filter(
      (instr: Instruction) => {
        const instrTime = instr.data.triggerTime / 1000;
        return instrTime > lastTime && instrTime <= currentTime;
      }
    );

    for (const instruction of instructionsToTrigger) {
      if (!instruction.id || this.activeInstructions.has(instruction.id)) {
        continue;
      }

      switch (instruction.data.type) {
        case "overlay":
          await this.handleOverlayInstruction(
            instruction as OverlayInstruction
          );
          break;
        case "skip":
          if (this.videoElement && !this.videoElement.paused) {
            await this.handleSkipInstruction(instruction as SkipInstruction);
          }
          break;
        case "text-overlay":
          await this.handleTextOverlayInstruction(
            instruction as TextOverlayInstruction
          );
          break;
      }
    }
  }

  private async handleOverlayInstruction(
    instruction: OverlayInstruction
  ): Promise<void> {
    if (!this.videoElement || this.videoElement.paused) {
      return;
    }

    if (!instruction.data.overlayMedia) {
      return;
    }

    const mediaType = instruction.data.overlayMedia.type.startsWith("video/")
      ? "video"
      : instruction.data.overlayMedia.type.startsWith("audio/")
      ? "audio"
      : "image";

    const duration = instruction.data.overlayDuration;
    const endTime = instruction.data.triggerTime / 1000 + duration;

    this.activeInstructions.set(instruction.id!, {
      instruction,
      endTime,
    });

    if (instruction.data.pauseMainVideo) {
      this.videoElement.pause();
    }

    await this.videoOverlayManager?.playOverlayMedia(
      instruction.data.overlayMedia.url,
      instruction.data.muteOverlayMedia || false,
      mediaType,
      instruction.id!,
      duration,
      instruction.data.overlayMedia.position
    );

    if (instruction.data.pauseMainVideo) {
      this.videoOverlayManager?.onOverlayEnded(() => {
        if (this.videoElement && this.videoElement.paused) {
          this.videoElement.play().catch((error) => {
            console.error("Error resuming video:", error);
          });
        }
      });
    }
  }

  private handleInstructionSkip = (skipToTime: number): void => {
    if (this.videoElement) {
      this.videoElement.currentTime = skipToTime / 1000;
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
      store.dispatch(seekToTime(timeMs));
    }
  };

  public destroy() {
    this.cleanupListeners.forEach((cleanup) => cleanup());
  }

  public seekTo(timeMs: number): void {
    if (this.videoElement) {
      // Ensure we're working with a clean number
      const time = Math.max(0, Math.min(timeMs, this.getDuration())) / 1000;

      // Set the time directly on the video element
      this.videoElement.currentTime = time;

      // Clear any active overlays when seeking
      this.activeInstructions.forEach((_, id) => {
        this.videoOverlayManager?.hideOverlay(id);
      });
      this.activeInstructions.clear();

      // Clear any existing timeouts
      if ((this.videoElement as any)._resumeTimeout) {
        clearTimeout((this.videoElement as any)._resumeTimeout);
        (this.videoElement as any)._resumeTimeout = null;
      }

      // Dispatch the time update to Redux
      store.dispatch(seekToTime(timeMs));
    }
  }

  public setInstructions(instructions: Instruction[]): void {
    this.instructions = instructions;
  }

  public getDuration(): number {
    return this.videoElement ? this.videoElement.duration * 1000 : 0;
  }

  public getCurrentTime(): number {
    return this.videoElement ? this.videoElement.currentTime * 1000 : 0;
  }

  public setVideoElement(video: HTMLVideoElement): void {
    this.videoElement = video;
    if (this.videoOverlayManager) {
      this.videoOverlayManager.destroy();
    }
    this.videoOverlayManager = new VideoOverlayManager(video);
    this.handleVideo(video);
  }

  private async handleTextOverlayInstruction(
    instruction: TextOverlayInstruction
  ): Promise<void> {
    if (!this.videoElement || this.videoElement.paused) {
      return;
    }

    const endTime =
      instruction.data.triggerTime / 1000 + instruction.data.overlayDuration;
    this.activeInstructions.set(instruction.id!, {
      instruction,
      endTime,
    });

    const { textOverlay, pauseMainVideo, overlayDuration } = instruction.data;

    // Calculate position based on video size
    const videoRect = this.videoElement.getBoundingClientRect();
    const scale = videoRect.width / config.mediaPositionerWidth;

    const scaledPosition = {
      x: textOverlay.position!.x * scale,
      y: textOverlay.position!.y * scale,
      width: textOverlay.position!.width * scale,
      height: textOverlay.position!.height * scale,
    };

    // Create a promise that resolves when the text overlay should end
    const textOverlayPromise = new Promise<void>((resolve) => {
      setTimeout(resolve, overlayDuration * 1000);
    });

    // Create a promise that resolves when the video should resume
    const videoResumePromise = pauseMainVideo
      ? new Promise<void>((resolve) => {
          setTimeout(
            resolve,
            (instruction.data.pauseDuration || overlayDuration) * 1000
          );
        })
      : Promise.resolve();

    // Pause main video if specified
    if (pauseMainVideo) {
      this.videoElement.pause();
    }

    // Display the text overlay
    await this.videoOverlayManager?.displayTextOverlay(
      textOverlay.text,
      textOverlay.style,
      scaledPosition,
      overlayDuration,
      instruction.id!
    );

    // Handle both the text overlay duration and video resume timing independently
    Promise.all([textOverlayPromise, videoResumePromise]).then(() => {
      // Resume video if it's still paused
      if (pauseMainVideo && this.videoElement && this.videoElement.paused) {
        this.videoElement.play().catch((error) => {
          console.error("Error resuming video:", error);
        });
      }
    });

    // Handle text overlay cleanup after its duration
    textOverlayPromise.then(() => {
      this.videoOverlayManager?.hideOverlay(instruction.id!);
      if (this.overlayEndedCallback) {
        this.overlayEndedCallback();
      }
    });
  }

  public setOverlayEndedCallback(callback: () => void): void {
    this.overlayEndedCallback = callback;
  }

  private async handleSkipInstruction(
    instruction: SkipInstruction
  ): Promise<void> {
    if (!this.videoElement) return;

    // Skip to the specified time
    this.videoElement.currentTime = instruction.data.skipToTime / 1000;

    // Update the store with the new time
    store.dispatch(seekToTime(instruction.data.skipToTime));
  }
}
