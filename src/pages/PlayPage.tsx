import React, { useEffect } from "react";

const PlayPage: React.FC = () => {
  useEffect(() => {
    // Enable play mode in content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id!, { action: "ENABLE_PLAY_MODE" });
      }
    });
  }, []);

  return (
    <div className="p-4">
      <h1>Play Page</h1>
      <p>Video playback with overlays will appear here.</p>
    </div>
  );
};

export default PlayPage;
