import { CustomFabricObject } from "@/types";
import {
  Canvas,
  FabricObject,
  Rect,
  Circle,
  Textbox,
  TPointerEventInfo,
  TPointerEvent,
} from "fabric";

export class CanvasManager {
  private canvas: Canvas | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(private isEditing: boolean) {}

  public initialize(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement;
    this.createCanvas();
    if (this.isEditing) {
      this.setupEditing();
    }
    this.setupResizeObservers();
    this.preventEventPropagation();
  }

  private createCanvas(): void {
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = "0";
    wrapper.style.top = "0";
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.pointerEvents = "all";

    const canvasElement = document.createElement("canvas");
    canvasElement.width = this.videoElement!.clientWidth;
    canvasElement.height = this.videoElement!.clientHeight;
    canvasElement.style.position = "absolute";
    canvasElement.style.left = "0";
    canvasElement.style.top = "0";
    canvasElement.style.width = "100%";
    canvasElement.style.height = "100%";
    canvasElement.style.pointerEvents = "all";

    wrapper.appendChild(canvasElement);

    const videoContainer = this.videoElement!.parentElement;
    if (videoContainer) {
      videoContainer.style.position = "relative";
      videoContainer.appendChild(wrapper);
    }

    this.canvas = new Canvas(canvasElement, {
      selection: this.isEditing,
      preserveObjectStacking: true,
    });
  }

  private setupResizeObservers(): void {
    window.addEventListener("resize", this.handleResize);

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.videoElement) {
          this.updateCanvasSize();
        }
      }
    });

    if (this.videoElement) {
      this.resizeObserver.observe(this.videoElement);
    }
  }

  private handleResize = (): void => {
    this.updateCanvasSize();
  };

  private updateCanvasSize(): void {
    if (!this.canvas || !this.videoElement) return;

    const canvasElement = this.canvas.getElement() as HTMLCanvasElement;
    const containerWidth = this.videoElement.clientWidth;
    const containerHeight = this.videoElement.clientHeight;

    canvasElement.width = containerWidth;
    canvasElement.height = containerHeight;
    canvasElement.style.left = `${this.videoElement.offsetLeft}px`;
    canvasElement.style.top = `${this.videoElement.offsetTop}px`;

    this.canvas.setDimensions({
      width: containerWidth,
      height: containerHeight,
    });

    // Scale all elements according to their scaleMode
    this.canvas.getObjects().forEach((obj: CustomFabricObject) => {
      if (!obj.data) return;

      if (obj.data.scaleMode === "responsive") {
        const smallerDimension = Math.min(containerWidth, containerHeight);

        // Calculate new position based on stored relative values
        const newLeft = (obj.data.relativeX / 100) * containerWidth;
        const newTop = (obj.data.relativeY / 100) * containerHeight;

        // Handle different types of objects
        switch (obj.type) {
          case "circle": {
            const circle = obj as Circle & CustomFabricObject;
            const relativeRadius = circle.data?.relativeRadius ?? 10;
            const newRadius = (relativeRadius / 100) * smallerDimension;
            circle.set({
              left: newLeft,
              top: newTop,
              radius: newRadius,
              scaleX: obj.data.currentScaleX || 1,
              scaleY: obj.data.currentScaleY || 1,
            });
            break;
          }

          case "textbox": {
            const textbox = obj as Textbox & CustomFabricObject;
            const relativeFontSize = textbox.data?.relativeFontSize ?? 5;
            const relativeWidth = textbox.data?.relativeWidth ?? 20;
            const newFontSize = (relativeFontSize / 100) * smallerDimension;
            const newWidth = (relativeWidth / 100) * containerWidth;
            textbox.set({
              left: newLeft,
              top: newTop,
              fontSize: newFontSize,
              width: newWidth,
              scaleX: obj.data.currentScaleX || 1,
              scaleY: obj.data.currentScaleY || 1,
            });
            break;
          }

          default: {
            const newWidth = (obj.data.relativeWidth / 100) * containerWidth;
            const newHeight = (obj.data.relativeHeight / 100) * containerHeight;
            obj.set({
              left: newLeft,
              top: newTop,
              width: newWidth,
              height: newHeight,
              scaleX: obj.data.currentScaleX || 1,
              scaleY: obj.data.currentScaleY || 1,
            });
          }
        }

        // Update the stored dimensions while preserving current scale
        obj.data = {
          ...obj.data,
          originalWidth: containerWidth,
          originalHeight: containerHeight,
          currentScaleX: obj.scaleX,
          currentScaleY: obj.scaleY,
        };
      }
    });

    this.canvas.renderAll();
  }

  private preventEventPropagation(): void {
    const wrapper = this.canvas!.getElement()!.parentElement!;
    wrapper.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      true
    );
  }

  public getCanvas(): Canvas | null {
    return this.canvas;
  }

  public dispose(): void {
    if (this.canvas) {
      const canvasElement = this.canvas.getElement() as HTMLCanvasElement;
      const wrapper = canvasElement.parentElement;

      if (wrapper && wrapper.parentElement) {
        wrapper.parentElement.removeChild(wrapper);
      }

      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }

      window.removeEventListener("resize", this.handleResize);

      this.canvas.dispose();
      this.canvas = null;
    }
  }

  private setupEditing(): void {
    if (!this.canvas) return;

    // Prevent click events from reaching the video when interacting with canvas
    this.canvas.on("mouse:down", this.handleCanvasMouseDown);
    this.canvas.on("mouse:up", this.handleCanvasMouseUp);
    this.canvas.on("mouse:move", this.handleCanvasMouseMove);

    // Add event listener to the canvas element
    const canvasElement = this.canvas.getElement() as HTMLCanvasElement;
    canvasElement.addEventListener("click", this.handleCanvasClick);
  }

  private handleCanvasClick = (e: MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  private handleCanvasMouseDown = (
    e: TPointerEventInfo<TPointerEvent>
  ): void => {
    const canvasElement = this.canvas!.getElement() as HTMLCanvasElement;
    canvasElement.style.pointerEvents = "all";
  };

  private handleCanvasMouseUp = (e: TPointerEventInfo<TPointerEvent>): void => {
    const canvasElement = this.canvas!.getElement() as HTMLCanvasElement;
    canvasElement.style.pointerEvents = "all";
  };

  private handleCanvasMouseMove = (
    e: TPointerEventInfo<TPointerEvent>
  ): void => {
    const canvasElement = this.canvas!.getElement() as HTMLCanvasElement;
    canvasElement.style.pointerEvents = "all";
  };
}
