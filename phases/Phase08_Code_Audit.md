# Phase 08 — Code Audit Report

**Date:** 2026-06-27
**Auditor:** WorkBuddy
**Scope:** All `src/` files + `manifest.json` + `vite.config.ts` + `tailwind.config.js`
**Reference:** `docs/CodingRules.md`, `docs/Architecture.md`, `docs/ReviewChecklist.md`

---

## Audit Methodology

Every source file was read in full and checked against:
1. CodingRules.md (naming, architecture, no-silent-refactor, etc.)
2. Architecture.md (module responsibilities, data flow)
3. ReviewChecklist.md 2.1–2.10 + Release-Specific items
4. KNOWN_ISSUES.md (verify mitigations, find new issues)

---

## Findings by Severity

### Critical

#### C-1: Content Script Auto-Import Fires on Every LinkedIn Profile Visit

- **File:** `src/content/index.ts` — `attemptAutoImportOwnProfile()` (line 99)
- **Description:** The function checks `isLinkedInProfilePage()` but does NOT check `isImportPending()` before dumping and saving profile text. The `isImportPending()` function is defined (line 23) but never called. This means:
  1. Every time the user visits ANY LinkedIn profile page, the content script dumps the entire page text and saves it to `chrome.storage.local`.
  2. The "Profile text captured!" banner appears on every profile visit, confusing the user.
  3. When the user next opens Settings, the pending raw text triggers an LLM refinement call — costing API credits for profiles the user never intended to import.
  4. This could be perceived as indiscriminate scraping by LinkedIn, increasing ToS risk (KI-004).
- **Root Cause:** The `isImportPending()` guard was likely present in an earlier version but was accidentally removed during Phase 7 or 07.5 refactoring.
- **Fix:** Add `const pending = await isImportPending(); if (!pending) return;` at the start of `attemptAutoImportOwnProfile()`, after the `isLinkedInProfilePage()` check.
- **CodingRules Impact:** 3.1 (modifying completed-phase code) — this is a blocking bug fix, allowed under the rules.

---

### High

#### H-1: No Content Security Policy in manifest.json

- **File:** `public/manifest.json`
- **Checklist:** 2.9 Security — "manifest.json CSP is configured to block unsafe-eval and unsafe-inline where possible"
- **Description:** `manifest.json` has no `content_security_policy` field. Chrome MV3 requires explicit CSP for store submission.
- **Fix:** Add `"content_security_policy": { "extension_pages": "script-src 'self'; object-src 'self'" }` to manifest.json.

#### H-2: Residual console.log in Background Service Worker

- **File:** `src/background/index.ts` — line 5
- **Code:** `console.log("LinkedIn AI Assistant installed")`
- **Checklist:** Phase 07.5 exit criteria — "No Debug Code (console.log...) remains"
- **Description:** This `console.log` was missed during Phase 07.5 debug code cleanup. It fires on every extension install/update.
- **Fix:** Remove the `console.log` line. The `onInstalled` listener can remain empty or be removed entirely if no initialization is needed.

#### H-3: No Retry with Backoff for API Rate Limiting

- **File:** `src/services/llm.ts`
- **Checklist:** 2.9 Security — "The extension handles API rate limits gracefully (retry with backoff, user-friendly error message, no infinite loops)"
- **Description:** When DeepSeek API returns HTTP 429 (rate limit), the code throws an error immediately. No retry is attempted. KI-008 was "mitigated" by disabling buttons during requests, but the checklist explicitly requires retry with backoff.
- **Fix:** Add an exponential backoff retry wrapper for 429 and 500/502/503 errors. Max 3 retries with 1s, 2s, 4s delays.

#### H-4: refineProfile() Missing 500/502/503 Error Handling

- **File:** `src/services/llm.ts` — `refineProfile()` (line 250)
- **Description:** `generateMessages()` handles HTTP 500/502/503 with a user-friendly message ("DeepSeek server error. Please try again in a moment."). However, `refineProfile()` only handles 401, 402, 429 — server errors fall through to the generic default case with raw error body. This is an inconsistency that results in poor error messages for server-side failures during profile refinement.
- **Fix:** Add 500/502/503 cases to the switch statement in `refineProfile()`, matching the pattern in `generateMessages()`.

---

### Medium

#### M-1: Version Number Still 0.1.0

- **Files:** `public/manifest.json` (line 4), `package.json`, `src/popup/App.tsx` (line 453)
- **Checklist:** 3. Release-Specific — "Version number is updated in package.json and manifest.json"
- **Description:** All three locations still show version `0.1.0`. For production readiness, these should be updated to `1.0.0`.
- **Fix:** Update version to `1.0.0` in all three files.

#### M-2: Dead Code — Unused Types in types/index.ts

- **File:** `src/types/index.ts` — lines 36-46
- **Description:** `AppSettings` interface (lines 36-41) and `ExtensionMessage` interface (lines 43-46) are defined but never imported by any module. The actual `AppSettings` used throughout the codebase is defined in `src/services/settings.ts` with a different shape. These dead types could cause confusion.
- **Fix:** Remove the unused `AppSettings` and `ExtensionMessage` interfaces from `types/index.ts`.

#### M-3: Dead Code — GET_TARGET_PROFILE Handler in background/index.ts

- **File:** `src/background/index.ts` — lines 8-33
- **Description:** The background service worker has a `GET_TARGET_PROFILE` message handler, but no code in the extension sends this message. App.tsx directly calls `chrome.tabs.query` + `chrome.tabs.sendMessage` to communicate with the content script, bypassing the background entirely. This handler is dead code.
- **Fix:** Remove the `GET_TARGET_PROFILE` handler. If the background script has no other purpose, reduce it to just the `onInstalled` listener (or remove it entirely and delete the `background` entry from manifest.json — but this would be a larger change requiring user approval).

#### M-4: No Privacy Policy

- **Checklist:** 3. Release-Specific — "Privacy policy is published and linked in the store listing"
- **Backlog:** M2 — Privacy Policy Finalization
- **Description:** No privacy policy document exists in the project. This is a Phase 08 deliverable.
- **Fix:** Create `docs/PRIVACY_POLICY.md` and add a link in the Settings page.

---

### Low

#### L-1: Code Duplication in llm.ts

- **File:** `src/services/llm.ts`
- **Description:** `generateMessages()` (lines 108-218) and `refineProfile()` (lines 250-373) share ~60 lines of near-identical fetch + error handling logic. This violates DRY and makes maintenance error-prone (as evidenced by H-4).
- **Note:** Per CodingRules 3.10 (No Silent Refactor), this is recorded but not fixed unless the user approves a refactoring task.

#### L-2: Architecture.md File Structure Does Not Match Actual

- **File:** `docs/Architecture.md`
- **Description:** Architecture.md plans `src/storage/`, `src/popup/components/`, `src/popup/pages/` directories, and a `src/content/parser.ts` file. None of these exist. Storage helpers are in `src/services/settings.ts`, and the popup is a flat structure. The parser functionality is split between `extractor.ts` and `llm.ts`.
- **Note:** This is a documentation drift issue. Updating Architecture.md to match reality is a documentation-only change, not a code change.

#### L-3: prompt.ts Uses Inline import() Types

- **File:** `src/services/prompt.ts` — lines 123, 136, 174
- **Description:** Uses `import("@/types").MessageStyle` inline instead of importing `MessageStyle` at the top of the file. This is valid TypeScript but unusual and slightly harder to read.
- **Note:** Style issue only. Not a bug.

#### L-4: README.md Outdated

- **File:** `README.md`
- **Description:** README still references the old Phase structure (Phase 0-5) and doesn't mention Phase 07.5, the governance patch, or the Roadmap split into MVP/Production tracks.
- **Note:** Documentation issue to be fixed as part of Phase 08 store preparation.

---

## ReviewChecklist Gap Summary

| Checklist Item | Status | Finding |
|----------------|--------|---------|
| 2.1 Build & Type Safety | ⏳ Pending | Need to run `npm run build` after fixes |
| 2.2 Browser Testing | ⏳ Pending | Manual testing after all fixes |
| 2.3 Console & Runtime | ❌ Fail | H-2: console.log in background |
| 2.4 Architecture & Code Quality | ⚠️ Partial | L-2: Architecture.md drift; M-3: dead code |
| 2.5 Coding Rules | ⚠️ Partial | M-2: dead types; L-1: code duplication |
| 2.6 Dependencies | ✅ Pass | No new dependencies needed |
| 2.7 Documentation | ❌ Fail | No Phase08_Done.md yet; README outdated |
| 2.8 Version Control | ⏳ Pending | After all changes committed |
| 2.9 Security | ❌ Fail | H-1: no CSP; H-3: no retry/backoff |
| 2.10 Performance | ⚠️ Partial | C-1: unnecessary work on every page load |
| 3. Release-Specific | ❌ Fail | M-1: version; M-4: no privacy policy |

---

## Recommended Fix Order

1. **C-1** (Critical) — Fix content script auto-import guard
2. **H-1** — Add CSP to manifest.json
3. **H-2** — Remove console.log from background
4. **H-3** — Add retry with backoff to llm.ts
5. **H-4** — Add 500/502/503 handling to refineProfile()
6. **M-1** — Update version to 1.0.0
7. **M-2** — Remove dead types
8. **M-3** — Remove dead GET_TARGET_PROFILE handler
9. **M-4** — Create privacy policy (separate task)
10. **L-2** — Update Architecture.md (documentation)
11. **L-4** — Update README.md (documentation)

Items L-1 and L-3 are noted but not recommended for immediate action (per CodingRules 3.10).

---

## Sign-off

This audit report is for user review. No code changes have been made yet. Each fix will follow the Diff First principle (CodingRules 3.12) before implementation.
