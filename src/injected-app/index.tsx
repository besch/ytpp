import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import Timeline from "@/components/Timeline/Timeline";
import VisibilityToggle from "@/components/VisibilityToggle";
import "@/index.css";
import App from "@/App";
import { MemoryRouter as Router } from "react-router-dom";
import { VideoManager } from "@/lib/VideoManager";
import { setVideoElement } from "@/store/timelineSlice";
import { setUser } from "@/store/authSlice";

function init() {
  // Listen for messages from content script
  window.addEventListener('message', (event) => {
    if (event.data.source === 'content-script') {
      switch (event.data.type) {
        case 'AUTH_STATE_CHANGED':
          store.dispatch(setUser(event.data.payload.user));
          break;
      }
    }
  });

  // Initialize VideoManager first
  const videoManager = new VideoManager();
  videoManager.findAndStoreVideoElement().then(() => {
    const videoElement = videoManager.getVideoElement();
    if (videoElement) {
      // Store the video element's ID instead of the element itself
      store.dispatch(setVideoElement(videoElement.id || "video-player"));
    }
  });

  // Create toggle button container
  const toggleContainer = document.createElement("div");
  toggleContainer.id = "timeline-toggle-container";
  toggleContainer.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 2147483647;
    contain: layout style;
    isolation: isolate;
  `;

  // Create container for Timeline
  const timelineContainer = document.createElement("div");
  timelineContainer.id = "timeline-container";

  // Safe access to player element with fallback
  const playerElement = document.querySelector("video");
  const playerRect = playerElement?.getBoundingClientRect();

  timelineContainer.style.cssText = `
    position: absolute;
    top: ${playerRect ? playerRect.bottom + 20 : 20}px;
    left: ${playerRect ? playerRect.left : 20}px;
    width: ${playerRect ? `${playerRect.width}px` : "auto"};
    min-width: 400px;
    z-index: 2147483647;
    contain: layout style;
    isolation: isolate;
    pointer-events: auto !important;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background-color: rgb(31 41 55) !important;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    cursor: pointer;
    opacity: 1;
    border: 1px dashed white;
  `;

  // Create container for other components
  const container = document.createElement("div");
  container.id = "react-overlay-root";
  container.style.cssText = `
    position: absolute;
    top: 80px;
    right: 20px;
    width: 350px;
    z-index: 9999;
    contain: content;
    isolation: isolate;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    border: 1px dashed white;
  `;

  document.body.appendChild(toggleContainer);
  document.body.appendChild(timelineContainer);
  document.body.appendChild(container);

  // Create ResizeObserver for video element
  const updateTimelinePosition = () => {
    const playerElement = document.querySelector("video");
    const timelineContainer = document.getElementById("timeline-container");

    if (playerElement && timelineContainer) {
      const playerRect = playerElement.getBoundingClientRect();
      timelineContainer.style.top = `${playerRect.bottom + 20}px`;
      timelineContainer.style.left = `${playerRect.left}px`;
      timelineContainer.style.width = `${playerRect.width}px`;
    }
  };

  const resizeObserver = new ResizeObserver(() => {
    updateTimelinePosition();
  });

  if (playerElement) {
    resizeObserver.observe(playerElement);
  }

  // Initial position setup
  updateTimelinePosition();

  // Render the components
  try {
    // Render toggle button
    const toggleRoot = createRoot(toggleContainer);
    toggleRoot.render(
      <React.StrictMode>
        <Provider store={store}>
          <VisibilityToggle />
        </Provider>
      </React.StrictMode>
    );

    // Render Timeline
    const timelineRoot = createRoot(timelineContainer);
    timelineRoot.render(
      <React.StrictMode>
        <Provider store={store}>
          <Timeline />
        </Provider>
      </React.StrictMode>
    );

    // Render other components
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <Router>
          <Provider store={store}>
            <App />
          </Provider>
        </Router>
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Failed to render React app:", error);
    container.textContent = "Failed to load extension interface";
  }

  // Clean up observer when extension is unloaded
  window.addEventListener("unload", () => {
    resizeObserver.disconnect();
  });
}

init();
