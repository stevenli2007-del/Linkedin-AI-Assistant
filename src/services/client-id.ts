// Client ID persistence — generates and stores anonymous client ID
// Phase 09: Extension generates UUID on first install and persists it.
// This ID is sent as X-Client-Id header to backend for anonymous tracking.

const CLIENT_ID_KEY = "clientId";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function loadClientId(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get([CLIENT_ID_KEY], (result) => {
      const stored = result[CLIENT_ID_KEY] as string | undefined;
      if (stored && typeof stored === "string" && stored.length > 0) {
        resolve(stored);
      } else {
        // First install — generate and save
        const newId = generateUUID();
        saveClientId(newId).then(() => resolve(newId));
      }
    });
  });
}

export async function saveClientId(clientId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [CLIENT_ID_KEY]: clientId }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}
