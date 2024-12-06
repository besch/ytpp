import { FabricObject, Textbox, FabricImage, ImageProps } from "fabric";

// Create a base type for our custom objects
export interface CustomFabricData {
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
}

// Define the base fabric object type
export interface BaseFabricObject extends FabricObject {
  type: string;
  data?: CustomFabricData;
}

// Create specific types for text and image objects
export interface CustomFabricText extends Textbox {
  type: string;
  data?: CustomFabricData;
}

export interface CustomFabricImage extends FabricImage {
  type: string;
  data?: CustomFabricData;
}

// Create a union type for all possible fabric objects
export type CustomFabricObject =
  | BaseFabricObject
  | CustomFabricText
  | CustomFabricImage;

// Options interface for creating image objects
export interface CustomFabricImageOptions extends ImageProps {
  data?: CustomFabricData;
}

export interface TimeInput {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface BaseInstruction {
  id: string;
  type: string;
  triggerTime: number;
}

export interface OverlayInstruction extends BaseInstruction {
  type: "overlay";
  overlayMedia: OverlayMedia | null;
  useOverlayDuration?: boolean;
  muteOverlayMedia?: boolean;
  pauseMainVideo?: boolean;
  pauseDuration?: number;
}

export interface SkipInstruction extends BaseInstruction {
  type: "skip";
  skipToTime: number;
}

export interface TextOverlayMedia {
  text: string;
  style: TextStyle;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  transparentBackground?: boolean;
  textAlign?: "left" | "center" | "right";
  opacity?: number;
  animation?: string;
  textShadow?: boolean;
  borderRadius?: number;
  padding?: number;
}

export interface TextOverlayInstruction extends BaseInstruction {
  type: "text-overlay";
  textOverlay: TextOverlayMedia;
  duration: number;
  pauseDuration?: number;
  pauseMainVideo?: boolean;
}

export type Instruction =
  | SkipInstruction
  | OverlayInstruction
  | TextOverlayInstruction;

export interface InstructionsState {
  instructions: Instruction[];
}

export interface Timeline {
  id: string;
  title: string;
  video_url: string;
  elements: any[];
  instructions: Instruction[];
  user_id: string;
  users?: {
    id: string;
    name: string;
    picture: string;
  };
  isOwner?: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaFile {
  id: string;
  timeline_id: number;
  instruction_id?: string;
  url: string;
  type: "gif" | "video";
  created_at: string;
}

// Add this interface if it doesn't exist
export interface ElementStyle {
  fill: string;
  stroke: string;
  text?: string;
}

// Update the Element interface
export interface Element {
  id: string;
  type: string;
  style: ElementStyle;
  timeRange: {
    from: number;
    to: number;
  };
  properties?: {
    left: number;
    top: number;
    scaleX: number;
    scaleY: number;
    width: number;
    height: number;
    scaleMode: "responsive" | "fixed";
  };
  data?: CustomFabricData;
}

// Update the existing OverlayMedia interface
export interface OverlayMedia {
  url: string;
  duration: number;
  name?: string;
  type: string;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  preview?: React.ReactNode;
}

export interface MediaData {
  file?: File;
  url: string;
  duration?: number;
  name: string;
  type: string;
}
