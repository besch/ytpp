import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setInstructions } from "@/store/instructionsSlice";
import { Instruction } from "@/types";

export const useInstructionsEvents = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleSetInstructions = (
      event: CustomEvent<{ instructions: Instruction[] }>
    ) => {
      dispatch(setInstructions(event.detail.instructions));
    };

    window.addEventListener(
      "SET_INSTRUCTIONS",
      handleSetInstructions as EventListener
    );

    return () => {
      window.removeEventListener(
        "SET_INSTRUCTIONS",
        handleSetInstructions as EventListener
      );
    };
  }, [dispatch]);
};
