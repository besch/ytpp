import {
  Canvas,
  FabricObject,
  Rect,
  Circle,
  Textbox,
  TPointerEventInfo,
  TPointerEvent,
} from "fabric";

interface CustomFabricObject extends FabricObject {
  data?: {
    from: number;
    to: number;
    originalLeft: number;
    originalTop: number;
    originalScaleX: number;
    originalScaleY: number;
  };
  originalScaleX?: number;
  originalScaleY?: number;
  originalLeft?: number;
  originalTop?: number;
}

export class OverlayManager {
  private static canvas: Canvas | null = null;
  private static isEditing: boolean = false;
  private static videoElement: HTMLVideoElement | null = null;
  private static resizeObserver: ResizeObserver | null = null;

  public static createOverlay(
    videoElement: HTMLVideoElement,
    isEditing: boolean
  ): void {
    this.videoElement = videoElement;
    this.isEditing = isEditing;

    if (this.canvas) {
      this.removeOverlay();
    }

    const canvasElement = document.createElement("canvas");
    canvasElement.width = videoElement.clientWidth;
    canvasElement.height = videoElement.clientHeight;
    canvasElement.style.position = "absolute";
    canvasElement.style.left = `${videoElement.offsetLeft}px`;
    canvasElement.style.top = `${videoElement.offsetTop}px`;
    canvasElement.style.pointerEvents = "all";

    videoElement.parentElement?.appendChild(canvasElement);

    this.canvas = new Canvas(canvasElement, {
      selection: isEditing,
      preserveObjectStacking: true,
    });

    if (isEditing) {
      this.setupEditing();
    }

    this.setupResizeObservers();
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
      if (currentTimeMs >= element!.from && currentTimeMs <= element!.to) {
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
    // Stop event propagation if we're in edit mode
    if (this.isEditing) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  private static handleCanvasMouseDown = (
    e: TPointerEventInfo<TPointerEvent>
  ): void => {
    if (
      this.isEditing &&
      (e.target || this.canvas?.getActiveObjects().length)
    ) {
      const canvasElement = this.canvas?.getElement() as HTMLCanvasElement;
      canvasElement.style.pointerEvents = "all";
    }
  };

  private static handleCanvasMouseUp = (
    e: TPointerEventInfo<TPointerEvent>
  ): void => {
    if (this.isEditing) {
      const canvasElement = this.canvas?.getElement() as HTMLCanvasElement;
      canvasElement.style.pointerEvents = "all";
    }
  };

  private static handleCanvasMouseMove = (
    e: TPointerEventInfo<TPointerEvent>
  ): void => {
    if (
      this.isEditing &&
      (e.target || this.canvas?.getActiveObjects().length)
    ) {
      const canvasElement = this.canvas?.getElement() as HTMLCanvasElement;
      canvasElement.style.pointerEvents = "all";
    }
  };

  private static onObjectSelected = (event: {
    selected: CustomFabricObject[];
  }) => {
    const selectedObject = event.selected[0];
    if (selectedObject) {
      this.showPropertiesPanel(selectedObject);
    }
  };

  private static onSelectionCleared = () => {
    this.hidePropertiesPanel();
  };

  private static showPropertiesPanel(object: FabricObject): void {
    const customObject = object as CustomFabricObject;
    let panel = document.getElementById("element-properties-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "element-properties-panel";
      panel.style.position = "fixed";
      panel.style.top = "10px";
      panel.style.right = "10px";
      panel.style.backgroundColor = "white";
      panel.style.border = "1px solid #ccc";
      panel.style.padding = "10px";
      panel.style.zIndex = "10000";
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
      from: 0,
      to: Number.MAX_SAFE_INTEGER,
      originalLeft: element.left,
      originalTop: element.top,
      originalScaleX: element.scaleX,
      originalScaleY: element.scaleY,
    };

    this.canvas.add(element);
  }

  public static getElements(): any[] {
    if (!this.canvas) return [];
    const elements = this.canvas.getObjects().map((obj) => {
      const customObj = obj as CustomFabricObject;
      return {
        type: customObj.type,
        properties: customObj.toObject(),
        data: customObj.data,
      };
    });
    return elements;
  }

  public static loadElements(elements: any[]): void {
    if (!this.canvas) return;
    elements.forEach((elementData) => {
      let element: CustomFabricObject;
      const props = { ...elementData.properties };

      delete props.type;

      switch (elementData.type) {
        case "rect":
          element = new Rect(props) as CustomFabricObject;
          break;
        case "circle":
          element = new Circle(props) as CustomFabricObject;
          break;
        case "textbox":
          const { text, ...textProps } = props;
          element = new Textbox(text, textProps) as CustomFabricObject;
          break;
        default:
          return;
      }
      element.data = elementData.data;
      this.canvas!.add(element);
    });
  }

  public static removeOverlay(): void {
    if (this.canvas) {
      const canvasElement = this.canvas.getElement() as HTMLCanvasElement;
      canvasElement.removeEventListener("click", this.handleCanvasClick);

      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }

      window.removeEventListener("resize", this.handleResize);

      canvasElement.parentElement?.removeChild(canvasElement);
      this.canvas.dispose();
      this.canvas = null;

      if (this.videoElement) {
        this.videoElement.style.pointerEvents = "auto";
      }
    }
  }
}
