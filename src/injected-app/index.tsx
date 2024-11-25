import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import Timeline from "@/components/Timeline/Timeline";
import "@/index.css";
import App from "@/App";
import { MemoryRouter as Router } from "react-router-dom";

function init() {
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
    z-index: 9999;
    contain: layout style;
    isolation: isolate;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: theme("colors.background");
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  `;

  // Create container for other components
  const container = document.createElement("div");
  container.id = "react-overlay-root";
  container.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    width: 350px;
    z-index: 9999;
    contain: content;
    isolation: isolate;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  `;

  document.body.appendChild(timelineContainer);
  document.body.appendChild(container);

  // Render the components
  try {
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
}

init();
