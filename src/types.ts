export interface TimeInput {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

export interface BaseInstruction {
  id?: string;
  timeline_id: number;
  data: {
    type: string;
    triggerTime: number;
    pauseMainVideo: boolean;
    overlayDuration?: number;
    textOverlay?: TextOverlayMedia;
    overlayMedia?: OverlayMedia;
    skipToTime?: number;
    muteOverlayMedia?: boolean;
    pauseDuration?: number;
    name: string;
  };
  created_at?: number;
  updated_at?: number;
}

export interface InstructionWithOriginalTimes extends BaseInstruction {
  _originalTriggerTime?: number;
  _originalSkipToTime?: number;
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

export type Instruction = InstructionWithOriginalTimes;

export interface InstructionsState {
  instructions: Instruction[];
}

export interface Timeline {
  id: number;
  title: string;
  video_url: string;
  user_id: string;
  users?: {
    id: string;
    name: string;
    picture: string;
  };
  isOwner?: boolean;
  is_youtube_channel_owner?: boolean;
  created_at: string;
  updated_at: string;
  reactions?: {
    reaction_type: "like" | "dislike";
    user_id: string;
  }[];
  likes_count: number;
  dislikes_count: number;
  user_reaction: "like" | "dislike" | null;
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

export interface InstructionResponse extends BaseInstruction {}

export type InstructionRequest = Omit<
  InstructionResponse,
  "id" | "created_at" | "updated_at"
>;
