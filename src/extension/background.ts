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
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  private async verifyToken(): Promise<boolean> {
    try {
      const auth = await chrome.identity.getAuthToken({ 
        interactive: false 
      } as chrome.identity.TokenDetails);
      
      const token = (auth as { token: string }).token;
      if (!token) return false;

      const response = await fetch(
        "https://www.googleapis.com/oauth2/v3/tokeninfo",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Token verification failed:", error);
      return false;
    }
  }

  private async checkAndRefreshAuthState(
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      const isValid = await this.verifyToken();

      if (!isValid) {
        // Clear invalid auth state
        await chrome.storage.local.remove("user");
        sendResponse({ success: true, user: null });
        return;
      }

      // Token is valid, get user data from storage
      const { user } = await chrome.storage.local.get("user");

      if (user) {
        // Verify user info is still valid
        const auth = await chrome.identity.getAuthToken({ interactive: false });
        const userInfoResponse = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );

        if (userInfoResponse.ok) {
          const userData = await userInfoResponse.json();
          const updatedUser = {
            id: userData.sub,
            email: userData.email,
            name: userData.name,
            picture: userData.picture,
          };

          // Update stored user data
          await chrome.storage.local.set({ user: updatedUser });
          sendResponse({ success: true, user: updatedUser });
        } else {
          // User info fetch failed, clear auth state
          await chrome.storage.local.remove("user");
          sendResponse({ success: true, user: null });
        }
      } else {
        sendResponse({ success: true, user: null });
      }
    } catch (error) {
      console.error("Auth state check failed:", error);
      sendResponse({ success: false, error: "Failed to check auth state" });
    }
  }

  private async onInstalled(): Promise<void> {}

  private async onStartup(): Promise<void> {}

  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    switch (message.action) {
      case "CHECK_AUTH_STATE":
        await this.checkAndRefreshAuthState(sender, sendResponse);
        break;

      case "HANDLE_LOGIN":
        try {
          console.log("Background: Starting login process");
          const auth = await chrome.identity.getAuthToken({
            interactive: true,
          } as chrome.identity.TokenDetails);

          console.log("Background: Auth result:", auth);

          const token = (auth as { token: string }).token;
          if (!token) {
            sendResponse({ success: false, error: "No auth token received" });
            return;
          }

          console.log("Background: Fetching user info");
          const response = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
              headers: {
                Authorization: `Bearer ${token}`,
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
            return;
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
        break;

      case "HANDLE_LOGOUT":
        try {
          const auth = await chrome.identity.getAuthToken({
            interactive: false,
          } as chrome.identity.TokenDetails);

          const token = (auth as { token: string }).token;
          if (token) {
            // First revoke the token
            await fetch(
              `https://accounts.google.com/o/oauth2/revoke?token=${token}`
            );

            // Then remove it from Chrome's cache
            await chrome.identity.removeCachedAuthToken({ token });

            // Clear any additional tokens
            await chrome.identity.clearAllCachedAuthTokens();
          }

          await chrome.storage.local.remove("user");

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
        break;

      default:
        sendResponse({ success: false, error: "Unknown action" });
    }
  }
}

export default new BackgroundService();
