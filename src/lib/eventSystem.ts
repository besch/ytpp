import { Timeline, Instruction, CustomFabricObject } from "@/types";

interface ElementPayload {
  id: string;
  type: string;
  timeRange: {
    from: number;
    to: number;
  };
  style: {
    fill: string;
    stroke: string;
    text?: string;
  };
}

// Define all possible event payloads
interface EventPayloads {
  ADD_ELEMENT: {
    timelineId: string;
    elementType: string;
    gifUrl?: string;
  };
  UPDATE_ELEMENT_COLOR: {
    timelineId: string;
    elementId: string;
    color: string;
    type: "fill" | "stroke" | "text";
  };
  UPDATE_ELEMENT_TIME: {
    timelineId: string;
    elementId: string;
    from: number;
    to: number;
  };
  DELETE_ELEMENT: {
    timelineId: string;
    elementId: string;
  };
  SAVE_ELEMENTS: undefined;
  LOAD_ELEMENTS: undefined;
  LOAD_INSTRUCTIONS: undefined;
  GET_ELEMENTS: undefined;
  SET_ELEMENTS: {
    elements: any[];
  };
  TOGGLE_CANVAS: {
    visible: boolean;
  };
  INITIALIZE_TIMELINE: undefined;
  LOAD_TIMELINE: {
    timelineId: string;
  };
  DELETE_TIMELINE: {
    timelineId: string;
  };
  GET_TIMELINES: undefined;
  SET_TIMELINES: {
    timelines: Timeline[];
  };
  SET_CURRENT_TIMELINE: {
    timeline: Timeline;
  };
  TIMELINE_INITIALIZED: {
    timeline: Timeline;
  };
  TIMELINE_DELETED: {
    timelineId: string;
  };
  SAVE_SUCCESS: {
    message: string;
  };
  SAVE_ERROR: {
    message: string;
  };
  ELEMENT_SELECTED: {
    element: ElementPayload;
  };
  SELECTION_CLEARED: undefined;
  UPDATE_ELEMENT: {
    timelineId: string;
    element: CustomFabricObject;
  };
  SEEK_TO_TIME: {
    timeMs: number;
  };
  SAVE_INSTRUCTIONS: {
    instructions: Instruction[];
  };
  VIDEO_TIME_UPDATE: {
    currentTimeMs: number;
  };
  REACT_APP_READY: undefined;
  CONTENT_SCRIPT_LOADED: undefined;
}

type EventName = keyof EventPayloads;

export function dispatchCustomEvent<T extends EventName>(
  eventName: T,
  payload?: EventPayloads[T]
): void {
  const event = new CustomEvent("EXTENSION_EVENT", {
    detail: {
      type: eventName,
      payload,
    },
  });
  document.dispatchEvent(event);
}

export function addCustomEventListener<T extends EventName>(
  eventName: T,
  callback: (payload: EventPayloads[T]) => void
): () => void {
  const handler = (event: CustomEvent) => {
    if (event.detail.type === eventName) {
      callback(event.detail.payload);
    }
  };

  document.addEventListener("EXTENSION_EVENT", handler as EventListener);
  return () => {
    document.removeEventListener("EXTENSION_EVENT", handler as EventListener);
  };
}
