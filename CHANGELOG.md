# Changelog

All notable changes to the **LinkedIn AI Networking Assistant** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] — Phase 10 Beta Testing

### Added
- User-configurable message length limit — input field on main popup (default 300 characters, range 50–1000), auto-saved to `chrome.storage.local`, passed to LLM prompt to constrain output length.
- "Find Common Points" feature — AI identifies 5 shared commonalities between user and target profile, user selects one, message generation incorporates the selection for personalized outreach.
- History feature with CSV export — new `History.tsx` component recording timestamp, target name, message style, common points used, and generated message content. CSV download for spreadsheet analysis. Default off (opt-in via Settings toggle).
- `src/config.ts` — single source of truth for `BACKEND_URL` and `API_ENDPOINTS`, eliminating hardcoded URLs and API version strings.
- `docs/BETA_FEEDBACK_GUIDE.md` — beta testing guide with installation instructions and bug report template.
- Beta distribution artifact (`linkedin-ai-assistant-v1.0.0-beta.zip`) for closed beta distribution.
- `userLocation` field added to `UserProfile` type for better profile completeness.
- History-related types (`HistoryEntry`) added to `types/index.ts`.
- `historyEnabled` toggle added to `AppSettings`.

### Changed
- `refineProfile()` prompt rewritten with field-level extraction instructions — LLM now receives explicit guidance per field (name, headline, company, school, location, about, experience) instead of a generic "extract everything" instruction.
- Raw profile text cap increased from 12,000 to 16,000 characters to capture more profile data.
- `handlePreviewConfirm` now writes to `chrome.storage.local` immediately on confirmation, instead of only updating React state (fixes data loss on popup close).
- `DEFAULT_SETTINGS` deduplicated — now exported once from `settings.ts` and imported in `App.tsx`, eliminating parallel definitions.
- Magic numbers in `extractor.ts` replaced with named constants (`SCROLL_STEP_WAIT_MS`, `MAX_SCROLL_ATTEMPTS`, etc.).
- CORS policy in `backend/src/middleware/cors.ts` restricted to `chrome-extension://` origins only (was wildcard `*`).
- Backend test files moved from `backend/` root to `backend/tests/` directory; `.gitignore` updated accordingly.

### Fixed
- **10-2-1:** Profile data lost after reopening popup — `handlePreviewConfirm` now persists to `chrome.storage.local` immediately.
- **10-2-2:** AI-generated messages exceeding LinkedIn's 300-character connection note limit — user-configurable length limit now constrains LLM output.
- **10-2-3:** Profile sync capturing incomplete data — rewritten `refineProfile` prompt with field-level instructions and increased raw text cap.
- **10-3-8-1:** Maximum message length not enforced — LLM could generate messages exceeding the configured character limit (e.g., 235 chars when set to 200). Fixed by adding `enforceMaxLength()` post-processing in `llm.ts` with smart truncation (sentence boundary → word boundary → hard truncate). Both `generateMessages()` and `regenerateMessage()` now accept and enforce `maxMessageLength` parameter. Calling code in `App.tsx` passes the setting through.
- **I1:** Backend test files (`test-*.js`) scattered in `backend/` root — moved to `backend/tests/`.
- **I2:** Hardcoded backend URL throughout extension code — extracted to `src/config.ts` (`BACKEND_URL`).
- **I3:** Hardcoded API version string (`/api/v1/`) — extracted to `src/config.ts` (`API_ENDPOINTS`).
- **I4:** `DEFAULT_SETTINGS` duplicated in `settings.ts` and `App.tsx` — unified to single export.
- **I5:** Magic numbers in `extractor.ts` (scroll delays, attempt counts) — replaced with named constants.
- **I6:** CORS `Access-Control-Allow-Origin: *` in backend — restricted to `chrome-extension://` origins only.

---

## [1.0.0] — Production Readiness (Phase 08)

### Added
- Privacy policy (`docs/PRIVACY_POLICY.md` + `public/privacy.html`) with Chrome Web Store compliant language: browser permissions table, user control section, disclaimer, LinkedIn ToS notice.
- Terms of Use (`docs/TERMS_OF_USE.md`) — 14 sections covering user responsibilities, disclaimers, liability.
- Store submission checklist (`docs/STORE_SUBMISSION_CHECKLIST.md`) — 11 sections with screenshot guide, icon notes, functional test cases, policy compliance.
- 3-step first-run onboarding card in popup (API key → profile → generate).
- Collapsible FAQ in Settings (5 common questions).
- Privacy Policy and Support links in popup footer and Settings footer.
- Content Security Policy in manifest.json: `script-src 'self'; object-src 'self'`.
- Exponential backoff retry for DeepSeek API calls (429/5xx/timeout, 3 retries, 1s→2s→4s).
- Custom extension icons (speech bubble + AI sparkles) in 16/32/48/128px.
- 5 store screenshots processed to Chrome Web Store specs.
- Git repository initialized with `.gitignore`.
- ADR-011 (Exponential Backoff Retry) and ADR-012 (Content Security Policy) in Decisions.md.

### Changed
- Version bumped from 0.1.0 to 1.0.0 (manifest.json, package.json, App.tsx footer).
- `generateMessages()` and `refineProfile()` now share a common `callDeepSeekAPI()` helper (DRY).
- Simple "add API key" hint replaced with structured 3-step onboarding card.

### Fixed
- **Critical:** Content script no longer auto-imports profile text on every LinkedIn profile visit — `isImportPending()` guard restored.
- **High:** Removed residual `console.log` from background service worker.
- **High:** `refineProfile()` now handles HTTP 500/502/503 with user-friendly error messages (was inconsistent with `generateMessages()`).
- KI-008 (no rate limiting) resolved — retry with backoff implemented.
- KI-004 (LinkedIn ToS risk) mitigated — privacy policy explicitly states user-initiated action, no automation, data scope limited.

### Removed
- Dead code: unused `AppSettings` and `ExtensionMessage` interfaces in `types/index.ts`.
- Dead code: `GET_TARGET_PROFILE` message handler in `background/index.ts`.
- Temp file `_resize_icons.py`.

---

## [0.7.0] — MVP Feature Complete (Phase 7)

### Added
- Sub-phase 7a: Full-page text dump extraction (no longer dependent on CSS selectors).
- Sub-phase 7b: LLM-based raw text refinement into structured profile.
- Sub-phase 7c: Import preview confirmation UI.
- Sub-phase 7d: Preview UI polish (fixed popup occlusion).
- Sub-phase 7e: Common-ground intelligent matching (same school / same company / same city / same field).

### Changed
- Profile import flow now uses full-page text dump + LLM refinement instead of direct DOM selector extraction.
- Settings page displays optimized profile fields after import.

### Fixed
- Popup occlusion issue in preview UI (7d).

---

## [0.6.0] — Auto-Sync User Profile (Phase 6)

### Added
- One-click sync of the user's own LinkedIn profile.
- Content script can extract the current user's profile data.
- Synced data is written to `chrome.storage.local` and auto-fills the settings page.

---

## [0.5.0] — Settings Page (Phase 5)

### Added
- Settings page for API key, model, temperature, and language.
- User profile management UI.
- Error handling, loading states, and UI polish.

### Changed
- All settings now persist across browser sessions.

---

## [0.4.0] — Message Selection UI (Phase 4)

### Added
- Popup UI displays four message styles (Professional / Friendly / Entrepreneur / Academic).
- Copy action: copy message to clipboard.
- Edit action: inline edit of generated message.
- Regenerate action: re-generate a single message style.
- Toast notifications confirming user actions.

---

## [0.3.0] — DeepSeek API Integration (Phase 3)

### Added
- LLM Service sends requests to DeepSeek API (OpenAI-compatible endpoint).
- Prompt Builder combines `UserProfile` + `TargetProfile` into a structured prompt.
- Response Parser returns four message variants.
- API key stored securely in `chrome.storage.local`.

---

## [0.2.0] — Profile Extractor (Phase 2)

### Added
- Content script detects LinkedIn profile URL.
- Profile Extractor reads name, headline, company, school, about, and experience.
- Profile Parser normalizes extracted data into `TargetProfile` type.

---

## [0.1.0] — Scaffold (Phase 1)

### Added
- Vite project configured for Chrome Manifest V3.
- `manifest.json` with popup, content script, and service worker entries.
- Build output generates `popup.html`, `popup.js`, `content.js`, `background.js`, `manifest.json`, and icons.
- Extension loads in Chrome Developer Mode.

---

## [0.0.1] — Project Governance (Phase 0)

### Added
- `docs/PRD.md` — Product Requirements Document.
- `docs/TechStack.md` — Technology stack and coding style.
- `docs/Database.md` — Data schema and storage conventions.
- `docs/Architecture.md` — Module responsibilities and data flow.
- `docs/Roadmap.md` — Phase plan (MVP + Production tracks).
- `docs/Decisions.md` — Architecture Decision Records (ADR).
- `docs/CodingRules.md` — AI coding rules and constraints.
- `docs/ReleasePlan.md` — Release strategy.
- `docs/ReviewChecklist.md` — Pre-phase and pre-release checklist.
- `docs/Backlog.md` — MoSCoW backlog.
- `phases/Phase00_Done.md` — Phase 0 completion report.

---

## Changelog Maintenance Rules

1. **Every phase must update CHANGELOG.md** before its Done Report is written.
2. **Unreleased section** collects changes as they are developed; move entries to a version section when the version is tagged or released.
3. **Version numbers** follow Semantic Versioning:
   - `0.x.y` = MVP / pre-release (no stability guarantee).
   - `1.0.0` = first public release (Chrome Web Store).
4. **Each entry** must be attributable to a specific phase or bug fix.
5. **Breaking Changes** must be explicitly listed and explained.

---
