import { useEffect } from "react";
import { addCustomEventListener, dispatchCustomEvent } from "@/lib/eventSystem";

export const useContentScript = () => {
  useEffect(() => {
    const loadContentScript = async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tab.id) return;

        // Check if content script is loaded
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => (window as any).__CONTENT_SCRIPT_LOADED__,
        });

        if (!result) {
          // Inject script if not loaded
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
          });

          // Wait for initialization
          const cleanup = addCustomEventListener("REACT_APP_READY", () => {
            dispatchCustomEvent("CONTENT_SCRIPT_LOADED", undefined);
          });

          return cleanup;
        }
      } catch (error) {
        console.error("Error handling content script:", error);
      }
    };

    loadContentScript();
  }, []);
};
