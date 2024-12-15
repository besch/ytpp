export interface TimeInput {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

export interface BaseInstruction {
  id: string;
  type: string;
  triggerTime: number;
  name?: string;
}

export interface OverlayInstruction extends BaseInstruction {
  type: "overlay";
  overlayMedia: OverlayMedia | null;
  overlayDuration: number;
  pauseMainVideo: boolean;
  muteOverlayMedia?: boolean;
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
  overlayDuration: number;
  pauseMainVideo: boolean;
  pauseDuration?: number;
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
