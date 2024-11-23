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

  // Safe access to player element with fallback
  const playerElement = document.getElementById("player");
  const playerRect = playerElement?.getBoundingClientRect();

  timelineContainer.style.cssText = `
    position: absolute;
    top: ${playerRect ? playerRect.bottom + 20 : 20}px;
    left: ${playerRect ? playerRect.left : 20}px;
    width: ${playerRect ? `${playerRect.width}px` : "auto"};
    cursor: move;
    z-index: 9999;
  `;

  // Create container for other components
  const container = document.createElement("div");
  container.id = "react-overlay-root";
  container.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    cursor: move;
    width: 350px;
    z-index: 9999;
  `;

  // Add containers to body instead of specific elements
  document.body.appendChild(timelineContainer);
  document.body.appendChild(container);

  // Add drag functionality with proper types
  [timelineContainer, container].forEach((elem) => {
    let isDragging = false;
    let currentX: number;
    let currentY: number;
    let initialX: number;
    let initialY: number;

    elem.addEventListener("mousedown", (e: MouseEvent) => {
      isDragging = true;
      initialX = e.clientX - elem.offsetLeft;
      initialY = e.clientY - elem.offsetTop;
    });

    document.addEventListener("mousemove", (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        elem.style.left = `${currentX}px`;
        elem.style.top = `${currentY}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  });

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
