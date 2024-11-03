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

export class OverlayManager {
  private static canvas: Canvas | null = null;
  private static videoElement: HTMLVideoElement | null = null;
  private static resizeObserver: ResizeObserver | null = null;

  public static createOverlay(
    videoElement: HTMLVideoElement,
    isEditing: boolean
  ): void {
    this.videoElement = videoElement;
    if (this.canvas) {
      this.removeOverlay();
    }

    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = "0";
    wrapper.style.top = "0";
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.pointerEvents = "all";

    const canvasElement = document.createElement("canvas");
    canvasElement.width = videoElement.clientWidth;
    canvasElement.height = videoElement.clientHeight;
    canvasElement.style.position = "absolute";
    canvasElement.style.left = "0";
    canvasElement.style.top = "0";
    canvasElement.style.width = "100%";
    canvasElement.style.height = "100%";
    canvasElement.style.pointerEvents = "all";

    wrapper.appendChild(canvasElement);

    const videoContainer = videoElement.parentElement;
    if (videoContainer) {
      videoContainer.style.position = "relative";
      videoContainer.appendChild(wrapper);
    }

    this.canvas = new Canvas(canvasElement, {
      selection: isEditing,
      preserveObjectStacking: true,
    });

    if (isEditing) {
      this.setupEditing();
    }

    this.setupResizeObservers();

    wrapper.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      true
    );
  }

  private static setupResizeObservers(): void {
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

  private static updateCanvasSize(): void {
    if (!this.canvas || !this.videoElement) return;

    const canvasElement = this.canvas.getElement() as HTMLCanvasElement;

    canvasElement.width = this.videoElement.clientWidth;
    canvasElement.height = this.videoElement.clientHeight;
    canvasElement.style.left = `${this.videoElement.offsetLeft}px`;
    canvasElement.style.top = `${this.videoElement.offsetTop}px`;

    this.canvas.setDimensions({
      width: canvasElement.width,
      height: canvasElement.height,
    });

    this.adjustElementPositions();
  }

  private static handleResize = (): void => {
    this.updateCanvasSize();
  };

  private static adjustElementPositions(): void {
    if (!this.canvas || !this.videoElement) return;

    const scaleX = this.canvas.width / this.videoElement.clientWidth;
    const scaleY = this.canvas.height / this.videoElement.clientHeight;

    this.canvas.getObjects().forEach((obj) => {
      const customObj = obj as CustomFabricObject;
      if (customObj.originalScaleX !== undefined) {
        customObj.scaleX = customObj.originalScaleX * scaleX;
      }
      if (customObj.originalScaleY !== undefined) {
        customObj.scaleY = customObj.originalScaleY * scaleY;
      }
      if (customObj.originalLeft !== undefined) {
        customObj.left = customObj.originalLeft * scaleX;
      }
      if (customObj.originalTop !== undefined) {
        customObj.top = customObj.originalTop * scaleY;
      }
      customObj.setCoords();
    });
    this.canvas.renderAll();
  }

  public static update(currentTimeMs: number, elements: any[]): void {
    if (!this.canvas) return;

    this.canvas.getObjects().forEach((obj) => {
      const customObj = obj as CustomFabricObject;
      const element = customObj.data;

      if (!element) return;

      if (currentTimeMs >= element.from && currentTimeMs <= element.to) {
        customObj.visible = true;
      } else {
        customObj.visible = false;
      }
    });
    this.canvas.renderAll();
  }

  private static setupEditing(): void {
    if (!this.canvas) return;

    // Add event listeners for selection events
    this.canvas.on("selection:created", this.onObjectSelected as any);
    this.canvas.on("selection:updated", this.onObjectSelected as any);
    this.canvas.on("selection:cleared", this.onSelectionCleared);

    // Prevent click events from reaching the video when interacting with canvas
    this.canvas.on("mouse:down", this.handleCanvasMouseDown);
    this.canvas.on("mouse:up", this.handleCanvasMouseUp);
    this.canvas.on("mouse:move", this.handleCanvasMouseMove);

    // Add event listener to the canvas element
    const canvasElement = this.canvas.getElement() as HTMLCanvasElement;
    canvasElement.addEventListener("click", this.handleCanvasClick);
  }

  private static handleCanvasClick = (e: MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  private static handleCanvasMouseDown = (
    e: TPointerEventInfo<TPointerEvent>
  ): void => {
    const canvasElement = this.canvas?.getElement() as HTMLCanvasElement;
    canvasElement.style.pointerEvents = "all";
  };

  private static handleCanvasMouseUp = (
    e: TPointerEventInfo<TPointerEvent>
  ): void => {
    const canvasElement = this.canvas?.getElement() as HTMLCanvasElement;
    canvasElement.style.pointerEvents = "all";
  };

  private static handleCanvasMouseMove = (
    e: TPointerEventInfo<TPointerEvent>
  ): void => {
    const canvasElement = this.canvas?.getElement() as HTMLCanvasElement;
    canvasElement.style.pointerEvents = "all";
  };

  private static onObjectSelected = (event: {
    selected: CustomFabricObject[];
  }) => {
    const selectedObject = event.selected[0];
    if (selectedObject) {
      if (!selectedObject.data) {
        selectedObject.data = {
          id: `element-${Date.now()}`,
          from: 0,
          to: 0,
          originalLeft: selectedObject.left || 0,
          originalTop: selectedObject.top || 0,
          originalScaleX: selectedObject.scaleX || 1,
          originalScaleY: selectedObject.scaleY || 1,
        };
      } else if (!selectedObject.data.id) {
        selectedObject.data.id = `element-${Date.now()}`;
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
            },
          },
        })
      );
    }
  };

  private static onSelectionCleared = () => {
    window.dispatchEvent(new CustomEvent("SELECTION_CLEARED"));
  };

  private static showPropertiesPanel(object: FabricObject): void {
    const customObject = object as CustomFabricObject;
    let panel = document.getElementById("element-properties-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "element-properties-panel";
      panel.style.position = "absolute";
      panel.style.right = "20px";
      panel.style.top = "20px";
      panel.style.padding = "16px";
      panel.style.borderRadius = "8px";
      panel.style.backgroundColor = "hsl(222.2 84% 4.9%)";
      panel.style.color = "hsl(210 40% 98%)";
      panel.style.boxShadow =
        "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)";
      panel.style.border = "1px solid hsl(217.2 32.6% 17.5%)";
      document.body.appendChild(panel);
    }

    panel.innerHTML = "";

    const fromLabel = document.createElement("label");
    fromLabel.textContent = "From (ms): ";
    const fromInput = document.createElement("input");
    fromInput.type = "number";
    fromInput.value = customObject.data?.from?.toString() || "0";
    fromLabel.appendChild(fromInput);
    panel.appendChild(fromLabel);

    panel.appendChild(document.createElement("br"));

    const toLabel = document.createElement("label");
    toLabel.textContent = "To (ms): ";
    const toInput = document.createElement("input");
    toInput.type = "number";
    toInput.value = customObject.data?.to?.toString() || "0";
    toLabel.appendChild(toInput);
    panel.appendChild(toLabel);

    panel.appendChild(document.createElement("br"));

    fromInput.addEventListener("change", (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      customObject.data!.from = value;
    });

    toInput.addEventListener("change", (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      customObject.data!.to = value;
    });

    panel.appendChild(document.createElement("br"));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete Element";
    deleteButton.addEventListener("click", () => {
      this.canvas?.remove(object);
      this.hidePropertiesPanel();
    });
    panel.appendChild(deleteButton);
  }

  private static hidePropertiesPanel(): void {
    const panel = document.getElementById("element-properties-panel");
    if (panel) {
      document.body.removeChild(panel);
    }
  }

  public static addElement(elementType: string): void {
    if (!this.canvas || !this.videoElement) return;

    let element: CustomFabricObject;
    const id = `element-${Date.now()}`;

    switch (elementType) {
      case "rectangle":
        element = new Rect({
          left: 100,
          top: 100,
          width: 60,
          height: 70,
          fill: "red",
          opacity: 0.5,
        });
        break;
      case "circle":
        element = new Circle({
          left: 100,
          top: 100,
          radius: 30,
          fill: "green",
          opacity: 0.5,
        });
        break;
      case "text":
        element = new Textbox("Sample Text", {
          left: 100,
          top: 100,
          fill: "blue",
        });
        break;
      default:
        return;
    }

    element.data = {
      id,
      from: 0,
      to: 0,
      originalLeft: element.left || 0,
      originalTop: element.top || 0,
      originalScaleX: element.scaleX || 1,
      originalScaleY: element.scaleY || 1,
    };

    this.canvas.add(element);
    this.saveElementsToStorage();
  }

  public static getElements(): any[] {
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

  public static loadElements(elements: any[]): void {
    if (!this.canvas) return;

    elements.forEach((elementData) => {
      let element: CustomFabricObject;
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
        default:
          return;
      }

      element.data = {
        id: elementData.id,
        from: elementData.timeRange.from,
        to: elementData.timeRange.to,
        originalLeft: props.left,
        originalTop: props.top,
        originalScaleX: props.scaleX,
        originalScaleY: props.scaleY,
      };

      this.canvas?.add(element);
    });
    this.canvas.renderAll();
  }

  public static removeOverlay(): void {
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

  public static updateElementColor(
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

  public static getSelectedElement(): any {
    if (!this.canvas) return null;
    return this.canvas.getActiveObject();
  }

  // New Method to Update Element Time
  public static updateElementTime(
    element: FabricObject,
    from: number,
    to: number
  ): void {
    const customObj = element as CustomFabricObject;
    if (customObj.data) {
      customObj.data.from = from;
      customObj.data.to = to;
      this.canvas?.renderAll();
    }
  }

  // New Method to Save Elements to Storage
  private static saveElementsToStorage(): void {
    const elements = this.getElements();
    chrome.storage.local.set({ elements }, () => {
      console.log("Elements saved to storage.");
    });
  }
}
