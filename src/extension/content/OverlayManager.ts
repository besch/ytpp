import { CanvasManager } from "./CanvasManager";
import { ElementManager } from "./ElementManager";
import { CustomFabricObject } from "@/types";

export class OverlayManager {
  private static canvasManager: CanvasManager | null = null;
  public static elementManager: ElementManager | null = null;

  public static createOverlay(
    videoElement: HTMLVideoElement,
    timelineId: string
  ): void {
    if (this.canvasManager) {
      this.removeOverlay();
    }

    this.canvasManager = new CanvasManager(false);
    this.canvasManager.initialize(videoElement);

    const canvas = this.canvasManager.getCanvas();
    if (canvas) {
      const canvasElement = canvas.getElement() as HTMLCanvasElement;
      const wrapper = canvasElement.parentElement;
      if (wrapper) {
        wrapper.style.display = "none";
      }

      this.elementManager = new ElementManager(
        canvas,
        videoElement,
        timelineId
      );

      videoElement.addEventListener("timeupdate", () => {
        this.update(videoElement.currentTime * 1000);
      });
    }
  }

  public static removeOverlay(): void {
    if (this.canvasManager) {
      this.canvasManager.dispose();
      this.canvasManager = null;
    }
    this.elementManager = null;
  }

  public static addElement(elementType: string, gifUrl?: string): void {
    this.elementManager?.addElement(elementType, gifUrl);
  }

  public static getElements(): any[] {
    return this.elementManager?.getElements() || [];
  }

  public static loadElements(elements: any[]): void {
    this.elementManager?.loadElements(elements);
  }

  public static update(currentTimeMs: number): void {
    if (this.elementManager) {
      this.elementManager.updateVisibility(currentTimeMs);
    }
  }

  public static updateElementColor(
    color: string,
    type: "fill" | "stroke" | "text"
  ): void {
    this.elementManager?.updateElementColor(color, type);
  }

  public static getSelectedElement(): any {
    return this.elementManager?.getSelectedElement() || null;
  }

  public static updateElementTime(
    element: CustomFabricObject,
    from: number,
    to: number
  ): void {
    this.elementManager?.updateElementTime(element, from, to);
  }

  public static setCanvasVisibility(visible: boolean): void {
    if (this.canvasManager) {
      const canvas = this.canvasManager.getCanvas();
      if (canvas) {
        const canvasElement = canvas.getElement() as HTMLCanvasElement;
        const wrapper = canvasElement.parentElement;
        if (wrapper) {
          wrapper.style.display = visible ? "block" : "none";
        }
      }
    }
  }
}
