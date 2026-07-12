import type { UserProfile, HistoryEntry } from "@/types";

export interface AppSettings {
  userProfile: UserProfile;
  apiKey: string;
  apiMode: "shared" | "custom";
  model: string;
  temperature: number;
  maxMessageLength: number;
  historyEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  userProfile: {
    userName: "",
    userHeadline: "",
    userSchool: "",
    userCompany: "",
    userLocation: "",
    userBackground: "",
    userGoals: "",
    userInterests: "",
  },
  apiKey: "",
  apiMode: "shared",
  model: "deepseek-chat",
  temperature: 0.7,
  maxMessageLength: 300,
  historyEnabled: false,
};

const STORAGE_KEY = "appSettings";

export async function loadSettings(): Promise<AppSettings> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(`Failed to load settings: ${chrome.runtime.lastError.message}`));
        return;
      }
      const stored = result[STORAGE_KEY] as Partial<AppSettings> | undefined;
      resolve(mergeSettings(stored));
    });
  });
}

export async function saveSettings(
  partial: Partial<AppSettings>
): Promise<void> {
  const current = await loadSettings();
  const next: AppSettings = {
    ...current,
    ...partial,
    userProfile: {
      ...current.userProfile,
      ...(partial.userProfile ?? {}),
    },
  };

  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEY]: next }, async () => {
      if (chrome.runtime.lastError) {
        reject(new Error(`Failed to save settings: ${chrome.runtime.lastError.message}`));
        return;
      }
      // Verify write succeeded by reading back
      try {
        const verified = await loadSettings();
        if (verified.userProfile.userName !== next.userProfile.userName) {
          reject(new Error("Settings save verification failed. Please try again."));
          return;
        }
      } catch {
        // If verification read fails, still resolve — save itself succeeded
      }
      resolve();
    });
  });
}

function mergeSettings(stored: Partial<AppSettings> | undefined): AppSettings {
  if (!stored || typeof stored !== "object") {
    return DEFAULT_SETTINGS;
  }

  return {
    userProfile: {
      ...DEFAULT_SETTINGS.userProfile,
      ...(stored.userProfile ?? {}),
    },
    apiKey: typeof stored.apiKey === "string" ? stored.apiKey : DEFAULT_SETTINGS.apiKey,
    apiMode: stored.apiMode === "custom" ? "custom" : "shared",
    model: typeof stored.model === "string" ? stored.model : DEFAULT_SETTINGS.model,
    temperature:
      typeof stored.temperature === "number"
        ? clampTemperature(stored.temperature)
        : DEFAULT_SETTINGS.temperature,
    maxMessageLength:
      typeof stored.maxMessageLength === "number" && stored.maxMessageLength > 0
        ? Math.min(1000, Math.max(50, stored.maxMessageLength))
        : DEFAULT_SETTINGS.maxMessageLength,
    historyEnabled:
      typeof stored.historyEnabled === "boolean" ? stored.historyEnabled : false,
  };
}

function clampTemperature(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_SETTINGS.temperature;
  return Math.min(2, Math.max(0, value));
}

const IMPORT_PENDING_KEY = "importMyProfilePending";
const IMPORT_EXPIRATION_MS = 60_000;

interface ImportPendingState {
  pending: true;
  startedAt: number;
}

export async function setImportPending(pending: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const value: ImportPendingState | null = pending
      ? { pending: true, startedAt: Date.now() }
      : null;
    chrome.storage.local.set({ [IMPORT_PENDING_KEY]: value }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

export async function isImportPending(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get([IMPORT_PENDING_KEY], (result) => {
      const value = result[IMPORT_PENDING_KEY] as
        | ImportPendingState
        | null
        | undefined;
      if (!value || !value.pending || !value.startedAt) {
        resolve(false);
        return;
      }
      const elapsed = Date.now() - value.startedAt;
      resolve(elapsed <= IMPORT_EXPIRATION_MS);
    });
  });
}

export async function clearImportPending(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(IMPORT_PENDING_KEY, () => {
      resolve();
    });
  });
}

// Phase 7: Raw profile text (dumped from LinkedIn page, to be refined by LLM)
const PENDING_RAW_TEXT_KEY = "pendingRawProfileText";

export async function loadPendingRawText(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([PENDING_RAW_TEXT_KEY], (result) => {
      const value = result[PENDING_RAW_TEXT_KEY] as string | undefined;
      resolve(value && typeof value === "string" && value.length > 0 ? value : null);
    });
  });
}

export async function clearPendingRawText(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(PENDING_RAW_TEXT_KEY, () => {
      resolve();
    });
  });
}

// ── History (Phase 10-2-4) ────────────────────────────────────────────────

const HISTORY_KEY = "messageHistory";
const HISTORY_MAX_ENTRIES = 500;

export async function loadHistory(): Promise<HistoryEntry[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([HISTORY_KEY], (result) => {
      const stored = result[HISTORY_KEY];
      if (!Array.isArray(stored)) {
        resolve([]);
        return;
      }
      resolve(stored as HistoryEntry[]);
    });
  });
}

export async function saveHistoryEntry(entry: HistoryEntry): Promise<void> {
  const current = await loadHistory();
  const next = [entry, ...current].slice(0, HISTORY_MAX_ENTRIES);
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [HISTORY_KEY]: next }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

export async function clearHistory(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(HISTORY_KEY, () => {
      resolve();
    });
  });
}
