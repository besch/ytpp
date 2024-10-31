import { FabricObject } from "fabric";

export interface CustomFabricObject extends FabricObject {
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
