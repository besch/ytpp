import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setElements, setSelectedElementId } from "@/store/timelineSlice";

export const useCanvasEvents = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleSetElements = (event: CustomEvent) => {
      dispatch(setElements(event.detail.elements));
    };

    const handleElementSelected = (event: CustomEvent) => {
      dispatch(setSelectedElementId(event.detail.element.id));
    };

    const handleSelectionCleared = () => {
      dispatch(setSelectedElementId(null));
    };

    window.addEventListener("SET_ELEMENTS", handleSetElements as EventListener);
    window.addEventListener(
      "ELEMENT_SELECTED",
      handleElementSelected as EventListener
    );
    window.addEventListener("SELECTION_CLEARED", handleSelectionCleared);

    // Signal that React app is ready
    (window as any).__REACT_APP_READY__ = true;
    window.dispatchEvent(new CustomEvent("REACT_APP_READY"));

    return () => {
      window.removeEventListener(
        "SET_ELEMENTS",
        handleSetElements as EventListener
      );
      window.removeEventListener(
        "ELEMENT_SELECTED",
        handleElementSelected as EventListener
      );
      window.removeEventListener("SELECTION_CLEARED", handleSelectionCleared);
    };
  }, [dispatch]);
};
