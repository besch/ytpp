class BackgroundService {
  constructor() {
    this.initializeListeners();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.setupClickHandler();
  }

  private setupClickHandler(): void {
    chrome.action.onClicked.addListener(async (tab) => {
      if (tab.id) {
        try {
          const response = await chrome.tabs
            .sendMessage(tab.id, { action: "TOGGLE_APP_VISIBILITY" })
            .catch(() => null);

          if (!response) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"],
            });
            await chrome.tabs.sendMessage(tab.id, {
              action: "TOGGLE_APP_VISIBILITY",
            });
          }
        } catch (error) {
          console.error("Failed to execute content script:", error);
        }
      }
    });
  }

  private initializeListeners(): void {
    chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));
    chrome.runtime.onStartup.addListener(this.onStartup.bind(this));
    chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
  }

  private async onInstalled(): Promise<void> {
    // await chrome.storage.local.clear();
  }

  private async onStartup(): Promise<void> {}

  private async onMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<boolean> {
    switch (message.action) {
      case "HANDLE_LOGIN":
        try {
          console.log("Background: Starting login process");
          const auth = await chrome.identity.getAuthToken({
            interactive: true,
          });

          console.log("Background: Auth result:", auth);

          if (!auth?.token) {
            sendResponse({ success: false, error: "No auth token received" });
            return true;
          }

          console.log("Background: Fetching user info");
          const response = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
              headers: {
                Authorization: `Bearer ${auth.token}`,
              },
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Background: User info fetch failed:", errorText);
            sendResponse({
              success: false,
              error: `Failed to fetch user info: ${response.status}`,
            });
            return true;
          }

          const userData = await response.json();
          const user = {
            id: userData.sub,
            email: userData.email,
            name: userData.name,
            picture: userData.picture,
          };

          console.log("Background: Storing user data", user);
          await chrome.storage.local.set({ user });

          if (sender.tab?.id) {
            console.log("Background: Notifying content script");
            await chrome.tabs.sendMessage(sender.tab.id, {
              action: "AUTH_STATE_CHANGED",
              payload: { user },
            });
          }

          sendResponse({ success: true, user });
        } catch (error) {
          console.error("Background: Login error:", error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
        return true;

      case "HANDLE_LOGOUT":
        try {
          const auth = await chrome.identity.getAuthToken({
            interactive: false,
          });
          if (auth?.token) {
            await chrome.identity.removeCachedAuthToken({ token: auth.token });
          }
          await chrome.storage.local.remove("user");

          // Notify content script
          if (sender.tab?.id) {
            await chrome.tabs.sendMessage(sender.tab.id, {
              action: "AUTH_STATE_CHANGED",
              payload: { user: null },
            });
          }

          sendResponse({ success: true });
        } catch (error) {
          console.error("Logout error:", error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
        return true;
    }
    return true;
  }
}

export default new BackgroundService();
