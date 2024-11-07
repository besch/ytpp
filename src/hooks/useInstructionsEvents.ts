import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setInstructions } from "@/store/timelineSlice";
import { addCustomEventListener } from "@/lib/eventSystem";

export const useInstructionsEvents = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const cleanup = addCustomEventListener(
      "SET_INSTRUCTIONS",
      ({ instructions }) => {
        dispatch(setInstructions(instructions));
      }
    );

    return cleanup;
  }, [dispatch]);
};
