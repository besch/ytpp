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
            .sendMessage(tab.id, { action: "TOGGLE_OVERLAY" })
            .catch(() => null);

          if (!response) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"],
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

  private onMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): boolean {
    switch (message.action) {
      default:
        break;
    }
    return true;
  }
}

export default new BackgroundService();
