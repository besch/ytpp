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
    currentScaleX?: number;
    currentScaleY?: number;
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
    originalCoords?: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
    isGif?: boolean;
    gifSrc?: string;
  };
}

export interface Instruction {
  id: string;
  stopTime: number;
  pauseDuration: number;
}

export interface InstructionsState {
  instructions: Instruction[];
}
