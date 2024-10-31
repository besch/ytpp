class BackgroundService {
  constructor() {
    this.initializeListeners();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.initializeStorage();
    this.setupClickHandler();
  }

  private setupClickHandler(): void {
    chrome.action.onClicked.addListener(async (tab) => {
      if (tab.id) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
          });
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
    await this.initializeStorage();
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

  private async initializeStorage(): Promise<void> {
    const { scriptState } = await chrome.storage.local.get("scriptState");
    chrome.storage.local.set({ scriptState: scriptState ?? {} });
  }

  private async getCurrentTabUrl(): Promise<string> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]?.url || "");
      });
    });
  }
}

export default new BackgroundService();
