import { Instruction } from "@/types";

interface EventPayloads {
  VIDEO_ELEMENT_FOUND: {
    frameId?: number;
    videoId: string;
  };
  FIND_VIDEO_ELEMENT: void;
  VIDEO_INSTRUCTION: Instruction;
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
