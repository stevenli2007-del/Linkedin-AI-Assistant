// Content Script — injected into LinkedIn profile pages
import {
  extractTargetProfile,
  extractTargetProfileAsync,
  isLinkedInProfilePage,
  logExtractedProfile,
  dumpProfileRawText,
} from "./extractor";
import type { TargetProfile } from "@/types";

// Inline storage helpers so content.js bundles as a standalone IIFE.
// Importing from shared modules causes Vite to emit an ES-module chunk that
// Chrome executes as a classic script, breaking the content script.
const IMPORT_PENDING_KEY = "importMyProfilePending";
const PENDING_RAW_TEXT_KEY = "pendingRawProfileText";
const IMPORT_EXPIRATION_MS = 60_000;

interface ImportPendingState {
  pending: true;
  startedAt: number;
}

async function isImportPending(): Promise<boolean> {
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

async function clearImportPending(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(IMPORT_PENDING_KEY, () => {
      resolve();
    });
  });
}

async function savePendingRawText(rawText: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [PENDING_RAW_TEXT_KEY]: rawText }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}



chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "EXTRACT_PROFILE") {
    (async () => {
      try {
        if (!isLinkedInProfilePage()) {
          sendResponse({
            success: false,
            error:
              "Please open a LinkedIn profile page first (https://www.linkedin.com/in/...).",
          });
          return;
        }

        // Try fast extraction first, then async retry if name is missing.
        let profile: TargetProfile;
        try {
          profile = extractTargetProfile();
        } catch {
          profile = await extractTargetProfileAsync();
        }

        sendResponse({ success: true, data: profile });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while extracting the profile.";
        console.warn("[LinkedIn AI Assistant] Extraction failed:", errorMessage);
        sendResponse({ success: false, error: errorMessage });
      }
    })();
    return true; // Keep channel open for async response
  }
  return false; // Unknown message type: no async response planned
});

// Auto-import the user's own profile when the extension opened linkedin.com/in/me/
async function attemptAutoImportOwnProfile(): Promise<void> {
  if (!isLinkedInProfilePage()) {
    return;
  }

  // Only auto-import when the user explicitly triggered it (Phase 6 flow).
  // Without this guard, the content script would dump and save profile text
  // on every LinkedIn profile visit — wasting API credits and increasing
  // ToS risk (KI-004).
  const pending = await isImportPending();
  if (!pending) {
    return;
  }

  try {
    // Phase 7: Dump the entire visible profile text instead of precisely
    // parsing CSS selectors. The LLM will refine the raw text into a clean
    // structured profile.
    const rawText = dumpProfileRawText();
    await savePendingRawText(rawText);
    await clearImportPending();
    showImportBanner(
      "Profile text captured! Reopen the extension settings to review the AI-refined result."
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown import error";
    console.warn("[LinkedIn AI Assistant] Auto-import failed:", message);
    // Do NOT clear the pending flag on failure: the /in/me/ redirect may
    // still be in progress, so the redirected profile page should retry.
    showImportBanner(
      "Could not import profile yet. It may retry automatically."
    );
  }
}

function showImportBanner(text: string): void {
  const existing = document.getElementById("linkedin-ai-assistant-banner");
  if (existing) existing.remove();

  const banner = document.createElement("div");
  banner.id = "linkedin-ai-assistant-banner";
  banner.textContent = text;
  banner.style.cssText = `
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999999;
    padding: 10px 16px;
    background: #0c8ee8;
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 13px;
    font-weight: 500;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: none;
    max-width: 90vw;
    text-align: center;
    line-height: 1.4;
  `;

  document.body.appendChild(banner);
  window.setTimeout(() => {
    banner.style.opacity = "0";
    banner.style.transition = "opacity 300ms ease";
    window.setTimeout(() => banner.remove(), 300);
  }, 4500);
}

// Give the LinkedIn SPA time to render after a redirect from /in/me/
window.setTimeout(attemptAutoImportOwnProfile, 2500);

export {};
