import { FabricObject } from "fabric";

export interface CustomFabricObject extends FabricObject {
  data?: {
    id: string;
    from: number;
    to: number;
    originalLeft: number;
    originalTop: number;
    originalScaleX: number;
    originalScaleY: number;
    originalWidth: number;
    originalHeight: number;
    relativeX: number;
    relativeY: number;
    relativeWidth: number;
    relativeHeight: number;
    scaleMode: "responsive" | "fixed";
    relativeRadius?: number;
    originalRadius?: number;
    relativeFontSize?: number;
    originalFontSize?: number;
  };
}
