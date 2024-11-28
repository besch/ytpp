interface EventPayloads {
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
