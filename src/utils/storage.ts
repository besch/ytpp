export const storage = {
  get: async <T>(key: string): Promise<T | undefined> => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      return new Promise((resolve) => {
        chrome.storage.local.get(key, (result) => resolve(result[key]));
      });
    }
    return undefined;
  },

  set: async <T>(key: string, value: T): Promise<void> => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      });
    }
  },
};
