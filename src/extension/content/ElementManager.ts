import { CustomFabricObject } from "@/types";
import { Canvas, FabricObject, Rect, Circle, Textbox } from "fabric";

export class ElementManager {
  constructor(private canvas: Canvas) {}

  public addElement(elementType: string): void {
    if (!this.canvas) return;

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
        }) as CustomFabricObject;
        break;
      case "circle":
        element = new Circle({
          left: 100,
          top: 100,
          radius: 30,
          fill: "green",
          opacity: 0.5,
        }) as CustomFabricObject;
        break;
      case "text":
        element = new Textbox("Sample Text", {
          left: 100,
          top: 100,
          fill: "blue",
        }) as CustomFabricObject;
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

  public loadElements(elements: any[]): void {
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

      this.canvas.add(element);
    });
    this.canvas.renderAll();
  }

  public update(currentTimeMs: number, elements: any[]): void {
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

  public handleSelectionCleared = (): void => {
    window.dispatchEvent(new CustomEvent("SELECTION_CLEARED"));
  };

  public deleteSelectedElement(): void {
    if (!this.canvas) return;

    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      this.canvas.remove(activeObject);
      this.canvas.renderAll();
      this.saveElementsToStorage();

      // Dispatch updated elements
      const elements = this.getElements();
      window.dispatchEvent(
        new CustomEvent("SET_ELEMENTS", {
          detail: { elements },
        })
      );
    }
  }
}
