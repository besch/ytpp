import { useEffect } from "react";

export const useContentScript = () => {
  useEffect(() => {
    const loadContentScript = async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tab.id) return;

        // Check if the content script is already loaded
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => (window as any).__CONTENT_SCRIPT_LOADED__,
        });

        if (!result) {
          // If not loaded, inject the script
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
          });

          // Wait for content script to initialize
          await new Promise((resolve) => {
            const listener = (event: MessageEvent) => {
              if (
                event.source === window &&
                event.data === "__CONTENT_SCRIPT_LOADED__"
              ) {
                window.removeEventListener("message", listener);
                resolve(null);
              }
            };
            window.addEventListener("message", listener);
          });
        }
      } catch (error) {
        console.error("Error handling content script:", error);
      }
    };

    loadContentScript();
  }, []);
};
