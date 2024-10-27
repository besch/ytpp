import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import Navigation from "@/pages/Navigation";
import EditPage from "@/pages/EditPage";
import PlayPage from "@/pages/PlayPage";

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const loadContentScript = async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tab.id) {
          return;
        }

        // Check if the content script is already loaded
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => (window as any).__CONTENT_SCRIPT_LOADED__,
        });

        if (!result) {
          // If not loaded, inject the script
          await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
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

  // Example function to enable play mode from the UI
  const enablePlayMode = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "ENABLE_PLAY_MODE" });
      }
    });
  };

  return (
    <Router>
      <div
        className={`h-[600px] min-h-[600px] flex overflow-hidden transition-all duration-300 ease-in-out w-[300px] min-w-[300px]`}
      >
        <div className="w-[350px] h-full flex flex-col overflow-hidden">
          <div className="flex-grow h-[450px] bg-background text-foreground flex flex-col overflow-hidden">
            <Navigation />
            <div className="flex-grow overflow-auto">
              <Routes>
                <Route path="/edit" element={<EditPage />} />
                <Route path="/play" element={<PlayPage />} />
                <Route path="*" element={<Navigate to="/edit" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
