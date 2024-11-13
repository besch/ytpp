type EventPayload = {
  ADD_ELEMENT: { elementType: string; gifUrl?: string };
  DELETE_ELEMENT: { elementId: string };
  UPDATE_ELEMENT_COLOR: { color: string; type: "fill" | "stroke" | "text" };
  UPDATE_ELEMENT_TIME: { elementId: string; from: number; to: number };
  SEEK_TO_TIME: { timeMs: number };
  SAVE_INSTRUCTIONS: { instructions: any[] };
  SET_ELEMENTS: { elements: any[] };
  ELEMENT_SELECTED: {
    element: {
      id: string;
      type: string;
      timeRange: {
        from: number;
        to: number;
      };
      style: {
        fill: string;
        stroke: string;
      };
    };
  };
  SELECTION_CLEARED: void;
  VIDEO_TIME_UPDATE: { currentTimeMs: number };
  SAVE_ELEMENTS: void;
  GET_ELEMENTS: void;
  REACT_APP_READY: void;
  SET_INSTRUCTIONS: { instructions: any[] };
  SAVE_SUCCESS: { message: string };
  TOGGLE_OVERLAY: void;
  UPDATE_ELEMENT: { element: any };
  LOAD_ELEMENTS: void;
  LOAD_INSTRUCTIONS: void;
  CONTENT_SCRIPT_LOADED: void;
  TOGGLE_CANVAS: { visible: boolean };
};

export const dispatchCustomEvent = <K extends keyof EventPayload>(
  eventName: K,
  detail?: EventPayload[K]
): void => {
  const event = new CustomEvent(eventName, { detail });
  window.dispatchEvent(event);
};

export const addCustomEventListener = <K extends keyof EventPayload>(
  eventName: K,
  callback: (detail: EventPayload[K]) => void
): (() => void) => {
  const handler = ((event: CustomEvent) => {
    callback(event.detail);
  }) as EventListener;

  window.addEventListener(eventName, handler);
  return () => window.removeEventListener(eventName, handler);
};
