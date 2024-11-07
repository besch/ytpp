import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  setActiveTab,
  setElements,
  setSelectedElementId,
} from "@/store/timelineSlice";
import { addCustomEventListener, dispatchCustomEvent } from "@/lib/eventSystem";

export const useCanvasEvents = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const cleanupFns = [
      addCustomEventListener("SET_ELEMENTS", ({ elements }) => {
        dispatch(setElements(elements));
      }),

      addCustomEventListener("ELEMENT_SELECTED", ({ element }) => {
        if (element && element.id) {
          dispatch(setSelectedElementId(element.id));
          dispatch(setActiveTab("properties"));
        }
      }),

      addCustomEventListener("SELECTION_CLEARED", () => {
        dispatch(setSelectedElementId(null));
      }),
    ];

    // Signal that React app is ready and request initial elements
    (window as any).__REACT_APP_READY__ = true;
    dispatchCustomEvent("REACT_APP_READY");
    dispatchCustomEvent("GET_ELEMENTS");

    return () => cleanupFns.forEach((cleanup) => cleanup());
  }, [dispatch]);
};
