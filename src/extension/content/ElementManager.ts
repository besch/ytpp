import { CustomFabricObject, MediaFile, Timeline } from "@/types";
import {
  Canvas,
  FabricObject,
  Rect,
  Circle,
  Textbox,
  Shadow,
  Triangle,
  FabricImage,
} from "fabric";
import { dispatchCustomEvent } from "@/lib/eventSystem";
import { api } from "@/lib/api";

export class ElementManager {
  private animationIntervals: Map<string, number> = new Map();
  private canvas: Canvas | null = null;
  private timelineId: string;

  constructor(
    canvas: Canvas,
    private videoElement: HTMLVideoElement,
    timelineId: string
  ) {
    this.canvas = canvas;
    this.timelineId = timelineId;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.canvas) return;

    this.canvas.on("selection:created", this.handleObjectSelection);
    this.canvas.on("selection:updated", this.handleObjectSelection);
    this.canvas.on("selection:cleared", this.handleSelectionCleared);
  }

  public handleObjectSelection = (e: any): void => {
    const selectedObject = e.selected?.[0] as CustomFabricObject;

    if (selectedObject && selectedObject.data) {
      dispatchCustomEvent("ELEMENT_SELECTED", {
        element: {
          id: selectedObject.data.id,
          type: selectedObject.type,
          timeRange: {
            from: selectedObject.data.from || 0,
            to: selectedObject.data.to || 0,
          },
          style: {
            fill: String(selectedObject.fill || "#000000"),
            stroke: String(selectedObject.stroke || "#000000"),
          },
        },
      });
    }
  };

  public async addElement(elementType: string, gifUrl?: string): Promise<void> {
    if (!this.canvas || !this.videoElement) return;

    let element: CustomFabricObject;
    const id = `element-${Date.now()}`;
    const videoWidth = this.videoElement.clientWidth;
    const videoHeight = this.videoElement.clientHeight;

    const defaultProps = {
      left: videoWidth / 4,
      top: videoHeight / 4,
      scaleMode: "responsive" as const,
      strokeWidth: 2,
      stroke: "#ffffff",
      shadow: new Shadow({
        color: "rgba(0,0,0,0.3)",
        blur: 10,
        offsetX: 0,
        offsetY: 0,
      }),
    };

    // Create element based on type
    switch (elementType) {
      case "circle":
        const radius = Math.min(videoWidth, videoHeight) * 0.1;
        element = new Circle({
          ...defaultProps,
          radius,
          fill: "rgba(66, 135, 245, 0.6)",
          strokeWidth: 3,
          stroke: "#2d74da",
        }) as CustomFabricObject;
        break;

      case "text":
        const fontSize = Math.min(videoWidth, videoHeight) * 0.05;
        element = new Textbox("Sample Text", {
          ...defaultProps,
          fontSize,
          fill: "#ffffff",
          stroke: "rgba(0,0,0,0.5)",
          strokeWidth: 1,
          fontFamily: "Inter, system-ui, sans-serif",
          width: videoWidth * 0.2,
          textAlign: "center",
          shadow: new Shadow({
            color: "rgba(0,0,0,0.5)",
            blur: 15,
            offsetX: 0,
            offsetY: 0,
          }),
        }) as CustomFabricObject;
        break;

      case "rectangle":
        element = new Rect({
          ...defaultProps,
          width: videoWidth * 0.2,
          height: videoHeight * 0.2,
          fill: "rgba(255, 71, 87, 0.6)",
          strokeWidth: 3,
          stroke: "#ff4757",
          rx: 8, // rounded corners
          ry: 8, // rounded corners
        }) as CustomFabricObject;
        break;

      case "triangle":
        const size = Math.min(videoWidth, videoHeight) * 0.2;
        element = new Triangle({
          ...defaultProps,
          width: size,
          height: size,
          fill: "rgba(255, 193, 7, 0.6)",
          strokeWidth: 3,
          stroke: "#ffc107",
        }) as CustomFabricObject;
        break;

      case "gif":
        if (!gifUrl) return;

        const img = new Image();
        img.src = gifUrl;

        await new Promise((resolve) => {
          img.onload = resolve;
        });

        element = new FabricImage(img, {
          ...defaultProps,
          width: videoWidth * 0.2,
          height: videoHeight * 0.2,
          objectFit: "contain",
        }) as CustomFabricObject;

        element.data = {
          id,
          from: 0,
          to: Number.MAX_SAFE_INTEGER,
          originalLeft: element.left || 0,
          originalTop: element.top || 0,
          originalScaleX: element.scaleX || 1,
          originalScaleY: element.scaleY || 1,
          originalWidth: videoWidth,
          originalHeight: videoHeight,
          relativeX: ((element.left || 0) / videoWidth) * 100,
          relativeY: ((element.top || 0) / videoHeight) * 100,
          relativeWidth: ((element.width || 0) / videoWidth) * 100,
          relativeHeight: ((element.height || 0) / videoHeight) * 100,
          scaleMode: "responsive" as const,
          isGif: true,
          gifSrc: gifUrl,
        };

        this.startGifAnimation(element);
        break;

      default:
        return;
    }

    // Add element to canvas and save
    this.canvas.add(element);
    this.canvas.setActiveObject(element);
    this.canvas.requestRenderAll();

    const elements = this.getElements();
    // dispatchCustomEvent("SET_ELEMENTS", { elements });

    await this.saveElements();
  }

  public async loadElements(elements: any[]): Promise<void> {
    if (!this.canvas || !this.videoElement) return;

    const videoWidth = this.videoElement.clientWidth;
    const videoHeight = this.videoElement.clientHeight;

    // Clear existing elements
    this.canvas.clear();

    for (const elementData of elements) {
      let element: CustomFabricObject | null = null;

      // Handle GIF elements specially
      if (elementData.type === "image" && elementData.data?.isGif) {
        const img = new Image();
        img.src = elementData.data.gifSrc;

        await new Promise((resolve) => {
          img.onload = resolve;
        });

        element = new FabricImage(img, elementData) as CustomFabricObject;
        this.startGifAnimation(element);
      } else {
        // Handle other element types
        switch (elementData.type) {
          case "rect":
            element = new Rect(elementData) as CustomFabricObject;
            break;
          case "circle":
            element = new Circle(elementData) as CustomFabricObject;
            break;
          case "textbox":
            element = new Textbox(
              elementData.text || "",
              elementData
            ) as CustomFabricObject;
            break;
          case "triangle":
            element = new Triangle(elementData) as CustomFabricObject;
            break;
        }
      }

      if (element) {
        element.data = {
          ...elementData.data,
          originalWidth: videoWidth,
          originalHeight: videoHeight,
        };
        this.canvas.add(element);
      }
    }

    this.canvas.renderAll();
  }

  private async saveElements(): Promise<void> {
    const elements = this.getElements();
    try {
      const timeline = await api.timelines.update(this.timelineId, {
        elements,
      });
    } catch (error) {
      console.error("Failed to save elements:", error);
    }
  }

  public getElements(): any[] {
    if (!this.canvas) return [];

    return this.canvas.getObjects().map((obj) => {
      const customObj = obj as CustomFabricObject;
      const baseElement = {
        id: customObj.data?.id || `element-${Date.now()}`,
        type: customObj.type,
        style: {
          fill: customObj.fill || "#000000",
          stroke: customObj.stroke || "#000000",
        },
        timeRange: {
          from: customObj.data?.from || 0,
          to: customObj.data?.to || Number.MAX_SAFE_INTEGER,
        },
        properties: {
          left: customObj.left,
          top: customObj.top,
          scaleX: customObj.scaleX,
          scaleY: customObj.scaleY,
          width: customObj.width,
          height: customObj.height,
          scaleMode: customObj.data?.scaleMode || "responsive",
        },
        data: customObj.data,
      };

      // // Add type-specific properties
      // if (customObj.type === "circle") {
      //   baseElement.properties.radius = (customObj as any).radius;
      // } else if (customObj.type === "textbox") {
      //   baseElement.properties.text = (customObj as any).text;
      // }

      return baseElement;
    });
  }

  public update(currentTimeMs: number, elements: any[]): void {
    if (!this.canvas) return;

    this.canvas.getObjects().forEach((obj) => {
      const customObj = obj as CustomFabricObject;
      const element = customObj.data;

      if (!element) return;

      // Check if current time is within the element's time range
      const isVisible =
        currentTimeMs >= element.from && currentTimeMs <= element.to;

      if (customObj.visible !== isVisible) {
        customObj.visible = isVisible;
        if (isVisible) {
          // Reset to original position and scale when becoming visible
          customObj.set({
            left: element.originalLeft,
            top: element.originalTop,
            scaleX: element.originalScaleX,
            scaleY: element.originalScaleY,
          });
        }
      }
    });

    this.canvas.requestRenderAll();
  }

  public updateElementColor(
    color: string,
    type: "fill" | "stroke" | "text"
  ): void {
    if (!this.canvas) return;

    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;

    switch (type) {
      case "fill":
        activeObject.set({ fill: color });
        break;
      case "stroke":
        activeObject.set({ stroke: color });
        break;
      case "text":
        if (activeObject.type === "textbox") {
          activeObject.set({ fill: color });
        }
        break;
    }

    this.canvas.requestRenderAll(); // Force canvas to re-render
    dispatchCustomEvent("UPDATE_ELEMENT", {
      timelineId: this.timelineId,
      element: this.getSelectedElement() as CustomFabricObject,
    });
  }

  public getSelectedElement(): any {
    if (!this.canvas) return null;
    return this.canvas.getActiveObject();
  }

  public updateElementTime(
    element: FabricObject,
    from: number,
    to: number
  ): void {
    const customObj = element as CustomFabricObject;
    if (customObj.data) {
      customObj.data.from = from;
      customObj.data.to = to;
      this.canvas?.renderAll();
      this.saveElements();
      dispatchCustomEvent("UPDATE_ELEMENT", {
        timelineId: this.timelineId,
        element: customObj,
      });
    }
  }

  public deleteSelectedElement(): void {
    if (!this.canvas) return;

    const activeObject = this.canvas.getActiveObject() as CustomFabricObject;
    if (activeObject) {
      if (activeObject.data?.isGif) {
        this.stopGifAnimation(activeObject.data.id);
      }
      this.canvas.remove(activeObject);
      this.canvas.renderAll();
      this.saveElements();

      const elements = this.getElements();
    }
    dispatchCustomEvent("SELECTION_CLEARED");
  }

  public updateVisibility(currentTimeMs: number): void {
    if (!this.canvas) return;

    const objects = this.canvas.getObjects() as CustomFabricObject[];

    objects.forEach((obj) => {
      if (!obj.data) return;

      const isVisible =
        currentTimeMs >= obj.data.from && currentTimeMs <= obj.data.to;

      obj.visible = isVisible;

      if (isVisible) {
        obj.set({
          left: obj.data.originalLeft,
          top: obj.data.originalTop,
          scaleX: obj.data.originalScaleX,
          scaleY: obj.data.originalScaleY,
        });
      }

      // Handle GIF animation when visibility changes
      if (isVisible && obj.data.isGif) {
        this.startGifAnimation(obj);
      } else if (!isVisible && obj.data.isGif) {
        this.stopGifAnimation(obj.data.id);
      }
    });

    this.canvas.requestRenderAll();
  }

  private startGifAnimation(element: CustomFabricObject): void {
    if (!element.data?.isGif || !element.data.gifSrc || !this.canvas) return;

    const frameDelay = 100; // Adjust this value for animation speed
    const gifElement = element as FabricImage;

    // Create a new image for animation frames
    const img = new Image();
    img.src = element.data.gifSrc;

    // Use setInterval for animation
    const intervalId = window.setInterval(() => {
      if (element.visible && this.canvas) {
        // Update the image source to force a redraw
        gifElement.setElement(img);
        this.canvas.requestRenderAll();
      }
    }, frameDelay);

    // Store the interval ID for cleanup
    this.animationIntervals.set(element.data.id, intervalId);
  }

  // Add cleanup method for GIF animations
  private stopGifAnimation(elementId: string): void {
    const intervalId = this.animationIntervals.get(elementId);
    if (intervalId) {
      clearInterval(intervalId);
      this.animationIntervals.delete(elementId);
    }
  }

  // Update dispose method to clean up GIF animations
  public dispose(): void {
    // Clear all GIF animations
    this.animationIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.animationIntervals.clear();

    // Remove event listeners
    if (this.canvas) {
      this.canvas.off("selection:created", this.handleObjectSelection);
      this.canvas.off("selection:updated", this.handleObjectSelection);
      this.canvas.off("selection:cleared", this.handleSelectionCleared);
    }
  }

  public handleSelectionCleared = (): void => {
    dispatchCustomEvent("SELECTION_CLEARED");
  };

  // private async createImageElement(
  //   url: string,
  //   elementData: CustomFabricImageOptions
  // ): Promise<CustomFabricObject> {
  //   return new Promise((resolve, reject) => {
  //     Image.fromURL(
  //       url,
  //       (img: FabricImage) => {
  //         const element = img as unknown as CustomFabricObject;
  //         element.data = elementData.data;
  //         this.startGifAnimation(element);
  //         resolve(element);
  //       },
  //       elementData
  //     );
  //   });
  // }
}
