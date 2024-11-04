import { CustomFabricObject } from "@/types";
import {
  Canvas,
  FabricObject,
  Rect,
  Circle,
  Textbox,
  Shadow,
  Triangle,
  Line,
  FabricImage,
} from "fabric";

export class ElementManager {
  private animationIntervals: Map<string, number> = new Map();

  constructor(private canvas: Canvas, private videoElement: HTMLVideoElement) {}

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

        // Create image element to load the GIF
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

        // Store GIF-specific data
        element.data = {
          id: `element-${Date.now()}`,
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

        // Start GIF animation
        this.startGifAnimation(element);
        break;

      default:
        return;
    }

    // Store original dimensions and positions
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
      scaleMode: "responsive",
    };

    // For circles, store the radius as a percentage of the smaller dimension
    if (element instanceof Circle) {
      const circleElement = element as CustomFabricObject & Circle;
      const smallerDimension = Math.min(videoWidth, videoHeight);
      circleElement.data = {
        ...circleElement.data!,
        relativeRadius: ((circleElement.radius || 0) / smallerDimension) * 100,
        originalRadius: circleElement.radius || 0,
      };
    }

    // For textboxes, store the font size as a percentage of the smaller dimension
    if (element instanceof Textbox) {
      const textElement = element as CustomFabricObject & Textbox;
      const smallerDimension = Math.min(videoWidth, videoHeight);
      textElement.data = {
        ...textElement.data!,
        relativeFontSize:
          ((textElement.fontSize || 20) / smallerDimension) * 100,
        originalFontSize: textElement.fontSize || 20,
        relativeWidth: ((textElement.width || 0) / videoWidth) * 100,
      };
    }

    this.canvas.add(element);
    this.canvas.setActiveObject(element);
    this.canvas.requestRenderAll();

    const elements = this.getElements();
    window.dispatchEvent(
      new CustomEvent("SET_ELEMENTS", {
        detail: { elements },
      })
    );

    this.saveElementsToStorage();
  }

  public getElements(): any[] {
    if (!this.canvas) return [];
    const elements = this.canvas.getObjects().map((obj) => {
      const customObj = obj as CustomFabricObject;
      return {
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
          radius: (customObj as any).radius, // for circles
          text: (customObj as any).text, // for textboxes
        },
      };
    });
    return elements;
  }

  public async loadElements(elements: any[]): Promise<void> {
    if (!this.canvas || !this.videoElement) return;

    const videoWidth = this.videoElement.clientWidth;
    const videoHeight = this.videoElement.clientHeight;

    for (const elementData of elements) {
      let element: CustomFabricObject | null = null; // Initialize as null
      const props = {
        ...elementData.properties,
        fill: elementData.style.fill,
        stroke: elementData.style.stroke,
      };

      switch (elementData.type) {
        case "rect":
          element = new Rect(props) as CustomFabricObject;
          break;
        case "circle":
          element = new Circle(props) as CustomFabricObject;
          break;
        case "textbox":
          element = new Textbox(props.text || "", props) as CustomFabricObject;
          break;
        case "triangle":
          element = new Triangle(props) as CustomFabricObject;
          break;
        case "image":
          if (elementData.properties.gifSrc) {
            const img = new Image();
            img.src = elementData.properties.gifSrc;

            await new Promise((resolve) => {
              img.onload = resolve;
            });

            element = new FabricImage(img, props) as CustomFabricObject;
          }
          break;
        default:
          continue;
      }

      // Only proceed if element was successfully created
      if (element) {
        element.data = {
          id: elementData.id,
          from: elementData.timeRange.from,
          to: elementData.timeRange.to,
          originalLeft: props.left,
          originalTop: props.top,
          originalScaleX: props.scaleX || 1,
          originalScaleY: props.scaleY || 1,
          currentScaleX: props.scaleX || 1,
          currentScaleY: props.scaleY || 1,
          originalWidth: videoWidth,
          originalHeight: videoHeight,
          relativeX: ((props.left || 0) / videoWidth) * 100,
          relativeY: ((props.top || 0) / videoHeight) * 100,
          relativeWidth: ((props.width || 0) / videoWidth) * 100,
          relativeHeight: ((props.height || 0) / videoHeight) * 100,
          scaleMode:
            elementData.properties.scaleMode || ("responsive" as const),
        };

        // Add GIF-specific properties if it's a GIF
        if (elementData.type === "image" && elementData.properties.gifSrc) {
          element.data = {
            ...element.data,
            isGif: true,
            gifSrc: elementData.properties.gifSrc,
          };
        }

        this.canvas.add(element);

        if (element && element.data?.isGif) {
          this.startGifAnimation(element);
        }
      }
    }
    this.canvas.renderAll();
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
      this.saveElementsToStorage();
    }
  }

  private saveElementsToStorage(): void {
    const elements = this.getElements();
    chrome.storage.local.set({ elements }, () => {
      console.log("Elements saved to storage.");
    });
  }

  public handleObjectSelection = (event: {
    selected: CustomFabricObject[];
  }): void => {
    const selectedObject = event.selected[0];
    if (selectedObject) {
      const videoWidth = this.videoElement.clientWidth;
      const videoHeight = this.videoElement.clientHeight;

      if (!selectedObject.data) {
        selectedObject.data = {
          id: `element-${Date.now()}`,
          from: 0,
          to: 0,
          originalLeft: selectedObject.left || 0,
          originalTop: selectedObject.top || 0,
          originalScaleX: selectedObject.scaleX || 1,
          originalScaleY: selectedObject.scaleY || 1,
          originalWidth: videoWidth,
          originalHeight: videoHeight,
          relativeX: ((selectedObject.left || 0) / videoWidth) * 100,
          relativeY: ((selectedObject.top || 0) / videoHeight) * 100,
          relativeWidth: ((selectedObject.width || 0) / videoWidth) * 100,
          relativeHeight: ((selectedObject.height || 0) / videoHeight) * 100,
          scaleMode: "responsive" as const,
        };
      }

      window.dispatchEvent(
        new CustomEvent("ELEMENT_SELECTED", {
          detail: {
            element: {
              id: selectedObject.data.id,
              type: selectedObject.type,
              timeRange: {
                from: selectedObject.data.from || 0,
                to: selectedObject.data.to || 0,
              },
              style: {
                fill: selectedObject.fill || "#000000",
                stroke: selectedObject.stroke || "#000000",
              },
              properties: {
                left: selectedObject.left,
                top: selectedObject.top,
                scaleX: selectedObject.scaleX,
                scaleY: selectedObject.scaleY,
                width: selectedObject.width,
                height: selectedObject.height,
                radius: (selectedObject as any).radius,
                text: (selectedObject as any).text,
              },
            },
          },
        })
      );
    }
  };

  public handleSelectionCleared = (): void => {
    window.dispatchEvent(new CustomEvent("SELECTION_CLEARED"));
  };

  public deleteSelectedElement(): void {
    if (!this.canvas) return;

    const activeObject = this.canvas.getActiveObject() as CustomFabricObject;
    if (activeObject) {
      if (activeObject.data?.isGif) {
        this.stopGifAnimation(activeObject.data.id);
      }
      this.canvas.remove(activeObject);
      this.canvas.renderAll();
      this.saveElementsToStorage();

      const elements = this.getElements();
      window.dispatchEvent(
        new CustomEvent("SET_ELEMENTS", {
          detail: { elements },
        })
      );
    }
  }

  public updateVisibility(currentTimeMs: number): void {
    if (!this.canvas) return;

    const objects = this.canvas.getObjects() as CustomFabricObject[];

    objects.forEach((obj) => {
      if (!obj.data) return;

      const isVisible =
        currentTimeMs >= obj.data.from && currentTimeMs <= obj.data.to;

      if (obj.visible !== isVisible) {
        obj.visible = isVisible;

        // Handle GIF animation when visibility changes
        if (isVisible && obj.data.isGif) {
          this.startGifAnimation(obj);
        } else if (!isVisible && obj.data.isGif) {
          this.stopGifAnimation(obj.data.id);
        }

        if (isVisible) {
          obj.set({
            left: obj.data.originalLeft,
            top: obj.data.originalTop,
            scaleX: obj.data.originalScaleX,
            scaleY: obj.data.originalScaleY,
          });
        }
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

    // ... existing dispose code ...
  }
}
