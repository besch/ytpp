import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setElements, setSelectedElementId } from "@/store/timelineSlice";

export const useCanvasEvents = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleElementsLoaded = (event: CustomEvent) => {
      dispatch(setElements(event.detail.elements));
    };

    const handleElementSelected = (event: CustomEvent) => {
      dispatch(setSelectedElementId(event.detail.element.id));
    };

    const handleSelectionCleared = () => {
      dispatch(setSelectedElementId(null));
    };

    // Add event listeners
    window.addEventListener(
      "ELEMENTS_LOADED",
      handleElementsLoaded as EventListener
    );
    window.addEventListener(
      "ELEMENT_SELECTED",
      handleElementSelected as EventListener
    );
    window.addEventListener("SELECTION_CLEARED", handleSelectionCleared);

    // Cleanup
    return () => {
      window.removeEventListener(
        "ELEMENTS_LOADED",
        handleElementsLoaded as EventListener
      );
      window.removeEventListener(
        "ELEMENT_SELECTED",
        handleElementSelected as EventListener
      );
      window.removeEventListener("SELECTION_CLEARED", handleSelectionCleared);
    };
  }, [dispatch]);
};
