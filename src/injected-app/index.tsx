import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import Timeline from "@/components/Timeline/Timeline";
import "../index.css";
import App from "@/App";
import { MemoryRouter as Router } from "react-router-dom";

function init() {
  // Create container for Timeline
  const timelineContainer = document.createElement("div");
  timelineContainer.id = "timeline-container";
  timelineContainer.style.width = "100%";

  // Find the primary-inner element and the player
  const primaryInner = document.getElementById("primary-inner");
  const player = document.getElementById("player");

  // Insert timeline after player if both elements exist
  if (primaryInner && player) {
    // Find the next element after player to insert before
    const nextElement = player.nextElementSibling;
    if (nextElement) {
      primaryInner.insertBefore(timelineContainer, nextElement);
    } else {
      primaryInner.appendChild(timelineContainer);
    }
  }

  // Create container for other components
  const container = document.createElement("div");
  container.id = "react-overlay-root";
  container.style.width = "100%";

  const secondary = document.getElementById("secondary");
  if (secondary) {
    secondary.prepend(container);
  }

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
