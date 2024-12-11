import { Instruction } from "@/types";

// API Types
export interface APIRequest {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  params?: Record<string, string>;
}

export interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  status: number;
}

// Event Payloads
interface EventPayloads {
  VIDEO_ELEMENT_FOUND: {
    frameId?: number;
    videoId: string;
  };
  FIND_VIDEO_ELEMENT: void;
  VIDEO_INSTRUCTION: Instruction;
  "api:request": APIRequest;
  "api:response": APIResponse;
}

type EventName = keyof EventPayloads;

// Event System Class
class EventSystem {
  private listeners: Map<EventName, Array<(payload: any) => void>> = new Map();

  on<T extends EventName>(
    event: T,
    callback: (payload: EventPayloads[T]) => void
  ) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  once<T extends EventName>(
    event: T,
    callback: (payload: EventPayloads[T]) => void
  ) {
    const onceCallback = (payload: EventPayloads[T]) => {
      this.off(event, onceCallback);
      callback(payload);
    };
    this.on(event, onceCallback);
  }

  off<T extends EventName>(
    event: T,
    callback: (payload: EventPayloads[T]) => void
  ) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      this.listeners.set(
        event,
        listeners.filter((cb) => cb !== callback)
      );
    }
  }

  emit<T extends EventName>(event: T, payload: EventPayloads[T]) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(payload));
    }
  }
}

export const eventSystem = new EventSystem();

// Helper function for making API requests
export async function makeAPIRequest(
  request: APIRequest
): Promise<APIResponse> {
  return new Promise((resolve, reject) => {
    const responseHandler = (response: APIResponse) => {
      console.log("Received API response:", response);
      if (!response.success) {
        reject(
          new Error(
            response.error ||
              `API request failed with status ${response.status}`
          )
        );
      } else {
        resolve(response);
      }
    };

    console.log("Sending API request:", request);
    eventSystem.emit("api:request", request);
    eventSystem.once("api:response", responseHandler);
  });
}

// Legacy event dispatchers (keep for backward compatibility)
export function dispatchCustomEvent<
  T extends Exclude<EventName, "api:request" | "api:response">
>(eventName: T, payload?: EventPayloads[T]): void {
  const event = new CustomEvent("EXTENSION_EVENT", {
    detail: {
      type: eventName,
      payload,
    },
  });
  document.dispatchEvent(event);
}

export function addCustomEventListener<
  T extends Exclude<EventName, "api:request" | "api:response">
>(eventName: T, callback: (payload: EventPayloads[T]) => void): () => void {
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
