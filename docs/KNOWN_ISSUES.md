# KNOWN_ISSUES.md

## LinkedIn AI Networking Assistant — Known Issues

This file tracks all known issues, limitations, and risks. It is updated at the end of each phase.

---

## How to Read This File

| Field | Description |
|-------|-------------|
| **ID** | Unique issue identifier (KI = Known Issue) |
| **Severity** | Critical / High / Medium / Low |
| **Description** | What is the problem? |
| **Temporary Solution** | What can the user do right now? |
| **Planned Fix Version** | Which phase will address this? |
| **Status** | Open / Mitigated / Fixed / Won't Fix |

---

## Issues

---

### KI-001: API Key Must Be Provided by User

- **Severity:** High (adoption barrier)
- **Description:** The user must obtain their own DeepSeek API Key and paste it into the settings page. Non-technical users may not know what an API key is or how to apply for one.
- **Temporary Solution:** User follows the DeepSeek API documentation to apply for a key; developer can provide a step-by-step guide.
- **Planned Fix Version:** Phase 09 (Backend Proxy — proxy provides shared key for free tier users)
- **Status:** Fixed
- **Fix Notes:** Phase 09 introduced Shared Mode — the default mode uses a developer-provided API key via the backend proxy. Users no longer need to obtain their own API key. Custom Mode remains available for users who prefer to use their own key.

---

### KI-002: LLM Cost Borne by User

- **Severity:** Medium
- **Description:** Each message generation consumes the user's own DeepSeek API quota. Heavy users may find this expensive.
- **Temporary Solution:** User sets a low `temperature` to reduce token usage; use short profile data.
- **Planned Fix Version:** Phase 09 (Backend Proxy — server-side quota management or hybrid mode)
- **Status:** Fixed
- **Fix Notes:** Phase 09 Shared Mode uses a developer-provided API key with rate limiting (10 req/min per client). Users no longer bear LLM costs in Shared Mode. Custom Mode users still use their own quota.

---

### KI-003: API Key Stored in `chrome.storage.local` Is Accessible to Other Extensions

- **Severity:** Medium (security)
- **Description:** `chrome.storage.local` is accessible to any Chrome extension that has the `storage` permission. The API key is stored in plaintext.
- **Temporary Solution:** User should only install trusted extensions; avoid using the extension on a shared computer.
- **Planned Fix Version:** Phase 09 (Backend Proxy — eliminates client-side API key storage)
- **Status:** Mitigated
- **Fix Notes:** Phase 09 Shared Mode eliminates client-side API key storage entirely — no API key is stored in the browser. Custom Mode users still store their key in `chrome.storage.local`, but this is now optional. Users concerned about security should use Shared Mode.

---

### KI-004: LinkedIn Terms of Service Risk

- **Severity:** High (compliance)
- **Description:** Using a content script to extract LinkedIn profile data may violate LinkedIn's Terms of Service. The extension could be grounds for account restriction, and the Chrome Web Store may reject the extension.
- **Temporary Solution:** Use the extension only on your own profile or profiles you have permission to view; do not use for bulk scraping.
- **Planned Fix Version:** Phase 08 (legal review + privacy policy + possible architecture adjustment)
- **Status:** Open

---

### KI-005: No "Fill LinkedIn Message Box" Feature

- **Severity:** Low (UX)
- **Description:** After generating a message, the user must manually copy and paste it into LinkedIn's "Connect" message box. There is no one-click "fill" action.
- **Temporary Solution:** Use the "Copy" button, then manually paste into LinkedIn.
- **Planned Fix Version:** V2.0 (requires content script message-box injection)
- **Status:** Open

---

### KI-006: No Usage Statistics or Feedback Mechanism

- **Severity:** Low (product improvement)
- **Description:** The extension does not track how many messages were generated, which styles are most popular, or whether the user found the message helpful.
- **Temporary Solution:** None (manual user feedback via external channel).
- **Planned Fix Version:** After Phase 09 (requires backend proxy for analytics)
- **Status:** Open

---

### KI-007: No Multi-Language Support

- **Severity:** Low (feature scope)
- **Description:** The extension currently only supports English LinkedIn profiles and English message generation. Non-English profiles may produce low-quality results.
- **Temporary Solution:** User can try generating messages; the LLM may handle some non-English content but quality is not guaranteed.
- **Planned Fix Version:** V2.0 (multi-language prompt + UI)
- **Status:** Open

---

### KI-008: No Rate Limiting on API Calls

- **Severity:** Medium (robustness)
- **Description:** If the user clicks "re-generate" rapidly, multiple API calls may be fired without deduplication or rate limiting. This can exhaust the user's API quota quickly.
- **Temporary Solution:** User should wait for a generation to complete before clicking "re-generate".
- **Planned Fix Version:** Phase 07.5 (add debounce + rate limit UI feedback)
- **Status:** Mitigated (Phase 07.5)
- **Fix Notes:** Generate button and individual Regenerate buttons are now disabled during requests. `regeneratingStyles` Set prevents duplicate concurrent calls for the same style.

---

### KI-009: Content Script Performance on Large Profiles

- **Severity:** Low (performance)
- **Description:** Full-page text dump on a profile with a very long "Experience" or "About" section may take >2 seconds to process.
- **Temporary Solution:** None (acceptable for MVP).
- **Planned Fix Version:** Phase 07.5 (performance optimization pass)
- **Status:** Mitigated (Phase 07.5)
- **Fix Notes:** Removed 30+ `debug()` DOM diagnostic calls that were unconditionally scanning the page on every extraction. `debug()` is now a no-op in production. DOM diagnostic code block in `extractTargetProfile` removed.

---

### KI-010: Chrome Web Store Publishing Requires $5 Registration Fee

- **Severity:** Low (operational)
- **Description:** Publishing to the Chrome Web Store requires a one-time $5 registration fee (Google Developer Account). This is a minor financial barrier.
- **Temporary Solution:** User pays the $5 fee; or distributes the extension as a manual load (developer mode) for testers.
- **Planned Fix Version:** Phase 11 (budget approved by user)
- **Status:** Open

---

## Issue Status Summary

| Status | Count |
|--------|-------|
| Open | 5 |
| Mitigated | 3 |
| Fixed | 3 |
| Won't Fix | 0 |

---

## Phase 07.5 Review (2026-06-26)

### Bugs Fixed

| Bug | File | Fix |
|-----|------|-----|
| `onMessage` listener unconditionally returned `true`, leaking message channels for unknown message types | `content/index.ts` | Restructured listener to `return false` for unknown messages |
| `showToast` consecutive calls: first timer prematurely cleared second toast | `popup/App.tsx` | Added `toastTimerRef` to cancel previous timer before setting new one |
| `fetch` to DeepSeek had no timeout: network hang → popup stuck forever | `services/llm.ts` | Added `AbortController` with 30s timeout on all API calls |
| `content.ts` still called `logExtractedProfile()` (dead code after no-op) | `content/index.ts` | Removed the call |
| Background `GET_TARGET_PROFILE` had no error handling when tab doesn't exist | `background/index.ts` | Added tab existence check + `chrome.runtime.lastError` handling |

### Debug Code Removed

- All `console.log` debug statements removed from `content/index.ts`, `content/extractor.ts`
- `debug()` function in `extractor.ts` replaced with no-op
- DOM diagnostic code block in `extractTargetProfile` removed
- `logExtractedProfile` function replaced with no-op

### New Issues Added

None. All issues found in Phase 07.5 were fixed immediately.

---

## Maintenance Rules

1. **At the end of each phase**, review this file and update statuses.
2. **New issues found during development** must be added to this file before the phase is marked complete.
3. **Severity may be re-evaluated** as the project evolves.
4. **Fixed issues** are kept in the file for one more release cycle, then moved to a `RESOLVED.md` archive.

---
