# Changelog

All notable changes to the **LinkedIn AI Networking Assistant** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Nothing yet.

### Changed
- Nothing yet.

### Fixed
- Nothing yet.

### Removed
- Nothing yet.

### Breaking Changes
- None.

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
