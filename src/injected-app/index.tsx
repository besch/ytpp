import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import EditPage from "@/pages/EditPage";
import "../index.css";

function init() {
  const container = document.createElement("div");
  container.id = "extension-root";
  container.style.width = "100%";
  container.style.padding = "16px";

  const secondary = document.getElementById("secondary");
  if (secondary) {
    secondary.prepend(container);

    // Use createRoot with error boundary
    try {
      const root = createRoot(container);
      root.render(
        <React.StrictMode>
          <Provider store={store}>
            <EditPage />
          </Provider>
        </React.StrictMode>
      );
    } catch (error) {
      console.error("Failed to render React app:", error);
      container.textContent = "Failed to load extension interface";
    }
  }
}

init();
