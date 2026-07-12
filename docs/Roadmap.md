# Roadmap.md

## LinkedIn AI Networking Assistant — Project Roadmap

---

## 1. Overview

This document defines the complete lifecycle of the LinkedIn AI Networking Assistant project. It is divided into three tracks:

1. **MVP Track (Completed):** Phases 0–7 delivered the functional extension prototype.
2. **Stabilization Track:** Phase 07.5 hardens the MVP before production readiness.
3. **Production Track (Future):** Phases 08–12 prepare the prototype for public release, backend scale, and long-term growth.

Phases are executed in order. Each phase has a clear Goal, Dependencies, Deliverables, and Exit Criteria. No phase is considered complete until its Done Report is written and reviewed.

---

## 2. Track Diagram

```
MVP TRACK (Completed)
=====================
Phase 0: Project Governance
        ↓
Phase 1: Vite + React + Chrome MV3 Scaffold
        ↓
Phase 2: Profile Extractor Content Script
        ↓
Phase 3: DeepSeek API Integration
        ↓
Phase 4: Message Selection UI
        ↓
Phase 5: Settings Page + Polish
        ↓
Phase 6: Auto-sync User's Own LinkedIn Profile
        ↓
Phase 7: Optimize Imported Profile Data

STABILIZATION TRACK
=====================
        ↓
Phase 07.5: Stabilization

PRODUCTION TRACK (Future)
=========================
        ↓
Phase 08: Production Readiness
        ↓
Phase 09: Backend Proxy
        ↓
Phase 10: Beta Testing
        ↓
Phase 11: Chrome Web Store Release
        ↓
Phase 12: Growth
        ↓
Phase 13: SaaS Transformation (RAG Memory, Cloud Sync, Subscriptions)
```

---

## 3. MVP Track — Phases 0 to 7

These phases are complete. Their code is protected under `CodingRules.md` and should not be modified unless a blocking bug is found.

### Phase 0 — Project Governance

- **Goal:** Establish project governance, rules, and documentation before any new feature development.
- **Dependencies:**
  - None (this is the first phase)
- **Deliverables:**
  - `docs/Roadmap.md`
  - `docs/Decisions.md`
  - `docs/CodingRules.md`
  - `docs/ReleasePlan.md`
  - `phases/Phase00_Done.md`
- **Exit Criteria:**
  - All governance documents are created and reviewed by the user.
  - No new feature code is written.

### Phase 1 — Vite + React + Chrome MV3 Scaffold

- **Goal:** Set up the minimum extension scaffold that can be loaded into Chrome.
- **Dependencies:**
  - Phase 0 Completed
  - Required Documents Ready (`docs/TechStack.md`)
- **Deliverables:**
  - Vite project configured for Chrome MV3.
  - `manifest.json` with popup, content script, and service worker entries.
  - Build output generates `popup.html`, `popup.js`, `content.js`, `background.js`, `manifest.json`, and icons.
- **Exit Criteria:**
  - Extension loads successfully in Chrome Developer Mode.
  - Build command completes without errors.
  - `phases/Phase01_Done.md` is completed.

### Phase 2 — Profile Extractor Content Script

- **Goal:** Detect LinkedIn profile pages and extract publicly visible profile data.
- **Dependencies:**
  - Phase 1 Completed
- **Deliverables:**
  - Content script detects LinkedIn profile URL.
  - Extractor reads name, headline, company, school, about, and experience.
  - Parser normalizes extracted data into `TargetProfile`.
- **Exit Criteria:**
  - Profile data is correctly extracted on real LinkedIn profile pages.
  - All data fields map to `Database.md` schema.
  - `phases/Phase02_Done.md` is completed.

### Phase 3 — DeepSeek API Integration

- **Goal:** Connect the extension to the LLM and generate connection messages.
- **Dependencies:**
  - Phase 2 Completed
  - Required Documents Ready (`docs/Decisions.md` D03 — LLM Provider decision)
- **Deliverables:**
  - LLM Service sends requests to DeepSeek API.
  - Prompt Builder combines `UserProfile` + `TargetProfile`.
  - Response Parser returns four message variants.
- **Exit Criteria:**
  - API key is stored securely in `chrome.storage.local`.
  - Messages are generated successfully and returned to the popup.
  - `phases/Phase03_Done.md` is completed.

### Phase 4 — Message Selection UI

- **Goal:** Allow users to view, copy, edit, and regenerate messages.
- **Dependencies:**
  - Phase 3 Completed
- **Deliverables:**
  - Popup UI displays four message styles.
  - Copy, Edit, and Regenerate actions are implemented.
  - Toast notifications confirm user actions.
- **Exit Criteria:**
  - Users can copy, edit, and regenerate messages without errors.
  - UI matches minimal Apple-style design in `TechStack.md`.
  - `phases/Phase04_Done.md` is completed.

### Phase 5 — Settings Page + Polish

- **Goal:** Add user settings and polish the extension experience.
- **Dependencies:**
  - Phase 4 Completed
- **Deliverables:**
  - Settings page for API key, model, temperature, and language.
  - User profile management UI.
  - Error handling, loading states, and final UI polish.
- **Exit Criteria:**
  - All settings persist across sessions.
  - Settings UI is reachable and functional.
  - `phases/Phase05_Done.md` is completed.

### Phase 6 — Auto-sync User's Own LinkedIn Profile

- **Goal:** Allow users to import their own LinkedIn profile data automatically.
- **Dependencies:**
  - Phase 5 Completed
- **Deliverables:**
  - Content script can extract the current user's own profile.
  - Sync action writes user data to `chrome.storage.local`.
  - User profile is auto-filled in settings.
- **Exit Criteria:**
  - User profile can be imported from LinkedIn.
  - Imported data is saved and mapped to `UserProfile` schema.
  - `phases/Phase06_Done.md` is completed.

### Phase 7 — Optimize Imported Profile Data

- **Goal:** Improve the quality and usability of imported profile data.
- **Dependencies:**
  - Phase 6 Completed
- **Deliverables:**
  - Sub-phase 7a: Extract and store raw profile HTML or structured data.
  - Sub-phase 7b: Parse and clean imported data.
  - Sub-phase 7c: Allow user review and editing before saving.
  - Sub-phase 7d: Validate data against `Database.md` schema.
  - Sub-phase 7e: Optimize profile field display in settings.
- **Exit Criteria:**
  - Imported data is clean, validated, and user-editable.
  - Settings UI displays optimized profile fields.
  - `phases/Phase07_Done.md` is completed.

---

## 4. Stabilization Track — Phase 07.5

This phase improves system stability without adding any new features. It serves as a quality gate between the MVP Track and the Production Track.

### Phase 07.5 — Stabilization

- **Goal:** Improve system stability, code quality, and test coverage. No new features are added.
- **Dependencies:**
  - Phase 7 Completed
  - Architecture Review Approved
- **Deliverables:**
  - Bug Fixes (all known Critical and High issues resolved)
  - Refactoring (limited to the current module being fixed; no cross-module silent refactors)
  - Performance Optimization (bundle size, popup startup time, content script efficiency)
  - Error Handling (structured error types, user-friendly messages, no unhandled promise rejections)
  - Logging (consistent, actionable log format; no debug code left in production)
  - Test Coverage Improvement (happy path and edge case tests for core flows)
  - UX Polish (micro-interactions, loading states, empty states, accessibility basics)
- **Exit Criteria:**
  - No Critical Bugs remain
  - Console has no Errors (only intentional, structured warnings)
  - All core flows (profile extract → message generate → copy/edit/regenerate) pass manual testing
  - No Debug Code (console.log, TODO, FIXME without tracking) remains
  - All TODOs are either resolved or registered in `docs/KNOWN_ISSUES.md`
  - Architecture Review Passed (code structure matches `docs/Architecture.md`)
  - `phases/Phase07.5_Done.md` is completed

---

## 5. Production Track — Phases 08 to 12

These phases prepare the stabilized MVP for real users, backend scale, and public distribution. They are not yet started and will be executed sequentially.

### Phase 08 — Production Readiness ✅

- **Goal:** Harden the MVP so it can be safely exposed to external users and the Chrome Web Store.
- **Status:** Completed and Approved (2026-06-27)
- **Dependencies:**
  - Phase 07.5 Completed
  - Architecture Review Approved
  - Required Documents Ready (`docs/ReviewChecklist.md` updated with Security and Performance items)
- **Deliverables:**
  - Complete code review against `docs/CodingRules.md` and `docs/Architecture.md`.
  - Finalize and publish the privacy policy.
  - Improve error handling, logging, and recovery paths.
  - Add onboarding and help content for new users.
  - Prepare store-ready assets (screenshots, icons, descriptions).
  - Update `docs/ReviewChecklist.md` and verify all checklist items pass.
- **Exit Criteria:**
  - All items in `docs/ReviewChecklist.md` pass.
  - No critical or high-priority bugs remain.
  - User approves the MVP as production-ready.
  - `phases/Phase08_Done.md` is completed.

### Phase 09 — Backend Proxy ✅

- **Goal:** Introduce a lightweight backend proxy to manage API keys, rate limits, and future cloud features without exposing sensitive logic in the extension.
- **Status:** Completed (2026-06-27)
- **Dependencies:**
  - Phase 08 Completed
  - Architecture Review Approved
  - Required Documents Ready (`docs/Decisions.md` D11 — Backend Proxy decision)
- **Deliverables:**
  - Design proxy architecture (serverless or small dedicated service).
  - Implement secure API key management on the server side.
  - Add rate limiting and request logging.
  - Migrate the extension from direct DeepSeek calls to proxy calls.
  - Update `docs/Architecture.md` and `docs/Decisions.md` to reflect the new proxy.
- **Exit Criteria:**
  - Proxy handles production traffic without errors.
  - Extension still works end-to-end after migration.
  - User approves the backend proxy design.
  - `phases/Phase09_Done.md` is completed.

### Phase 10 — Beta Testing

- **Goal:** Validate the extension with real users before public release.
- **Dependencies:**
  - Phase 09 Completed
  - Required Documents Ready (Privacy Policy published)
- **Deliverables:**
  - Closed beta with 10–50 users.
  - Public beta with 100–500 users.
  - Feedback collection system and bug triage process.
  - Update help content and FAQ based on feedback.
- **Exit Criteria:**
  - No critical or high-priority bugs remain.
  - User retention and message quality meet success criteria.
  - User approves progression to Chrome Web Store release.
  - `phases/Phase10_Done.md` is completed.

#### Phase 10 Sub-tasks

##### Closed Beta Feedback Fixes (10-2 series)

| ID | Task | Status |
|----|------|--------|
| 10-2-1 | Fix Profile persistence bug (data lost after reopening popup) | ✅ Complete (2026-06-28) |
| 10-2-2 | Add user-configurable message length limit | ✅ Complete (2026-06-28) |
| 10-2-2-1 | Add "Find Common Points" button (AI finds 5 commonalities, user selects one before generating) | ✅ Complete (2026-06-28) |
| 10-2-3 | Improve Profile Sync data completeness (capture company, background, location, etc.) | ✅ Complete (2026-06-28) |
| 10-2-4 | Add History feature + CSV export | ✅ Complete (2026-06-28) |

##### Phase 9.5 Engineering Audit Fixes (I1–I6)

| ID | Task | Status |
|----|------|--------|
| I1 | Move backend test files to `backend/tests/`, update `.gitignore` | ✅ Resolved (2026-06-28) |
| I2 | Extract hardcoded backend URL to `src/config.ts` (`BACKEND_URL`) | ✅ Resolved (2026-06-28) |
| I3 | Extract hardcoded API version to `src/config.ts` (`API_ENDPOINTS`) | ✅ Resolved (2026-06-28) |
| I4 | Deduplicate `DEFAULT_SETTINGS` — single export from `settings.ts` | ✅ Resolved (2026-06-28) |
| I5 | Replace magic numbers in `extractor.ts` with named constants | ✅ Resolved (2026-06-28) |
| I6 | Restrict CORS to `chrome-extension://` origins only (was wildcard `*`) | ✅ Resolved (2026-06-28) |

### Phase 11 — Chrome Web Store Release

- **Goal:** Publish Version 1.0 to the Chrome Web Store.
- **Dependencies:**
  - Phase 10 Completed
  - Required Documents Ready (Store assets, Privacy Policy link, store description)
- **Deliverables:**
  - Final production build.
  - Chrome Web Store listing with screenshots, description, and privacy policy.
  - Store-optimized promotional images.
  - Version 1.0 release notes.
- **Exit Criteria:**
  - Extension is approved by Google and listed on the Chrome Web Store.
  - First 100 installs within 30 days of launch.
  - Average rating of 4.0+ within 60 days.
  - `phases/Phase11_Done.md` is completed.

### Phase 12 — Growth

- **Goal:** Grow user base and plan future features.
- **Dependencies:**
  - Phase 11 Completed
  - Required Documents Ready (Growth metrics defined)
- **Deliverables:**
  - Landing page or simple marketing site.
  - Content strategy (LinkedIn posts, tutorials, case studies).
  - Referral or share feature (if approved).
  - Analytics dashboard (only if approved and compliant with privacy policy).
  - Roadmap for Version 2.0 features documented in `docs/Backlog.md`.
- **Exit Criteria:**
  - Growth metrics are defined and tracked weekly.
  - V2.0 feature candidates are documented and prioritized.
  - User approves the growth plan.
  - `phases/Phase12_Done.md` is completed.

### Phase 13 — SaaS Transformation (Future, Post-V1)

- **Goal:** Transform the extension from a free local tool into a SaaS product with cloud-backed intelligence.
- **Dependencies:**
  - Phase 12 Completed
  - Sufficient user base and validated demand
  - User approves the SaaS pivot decision
- **Deliverables:**
  - **User Account System** — registration, authentication, subscription tiers (free/pro/enterprise).
  - **RAG (Retrieval-Augmented Generation) Memory** — vector database stores all past networking interactions (connection targets, message styles used, common points identified, response outcomes). When generating new messages, the system retrieves semantically relevant history and feeds it to the AI, enabling it to learn from past successes and personalize messages over time.
    - Vector DB: Pinecone or Supabase pgvector
    - Embedding model: text-embedding-3-small (OpenAI) or DeepSeek embedding
    - Retrieval flow: user generates message → system embeds query → retrieves top-K relevant past interactions → augmented prompt → AI generates context-aware message
  - **Cloud History Sync** — migrate local history to cloud, enable cross-device access.
  - **Analytics Dashboard** — success rate tracking (accepted vs. ignored), style effectiveness, commonality patterns.
  - **Team Features** — shared templates, team analytics (enterprise tier).
  - **Payment Integration** — Stripe or Lemon Squeezy for subscription management.
- **Exit Criteria:**
  - SaaS architecture is deployed and stable.
  - RAG memory demonstrably improves message quality (A/B tested against V1).
  - At least 50 paying users within 90 days of SaaS launch.
  - `phases/Phase13_Done.md` is completed.

> **Note:** This phase is exploratory and will be fully scoped when the team is ready to pivot from a free extension to a SaaS product. The RAG architecture in particular requires careful design around data privacy, user consent, and GDPR/CCPA compliance.

---

## 6. Done Report Convention

Each phase must end with a `phases/PhaseNN_Done.md` file containing:

1. Summary of work completed.
2. Files created or modified.
3. Verification steps performed.
4. Known issues or limitations.
5. Approval sign-off from the user.

No phase is considered complete without this report and explicit user review.

---

## 7. Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-06-26 | Initial Roadmap with Phases 0–10 | WorkBuddy |
| 2026-06-26 | Split into MVP Track (0–7) and Production Track (08–12) | WorkBuddy |
| 2026-06-26 | Added Dependencies to every Phase | WorkBuddy |
| 2026-06-26 | Inserted Phase 07.5 Stabilization between MVP and Production Tracks | WorkBuddy |
| 2026-06-28 | Phase 10: Added sub-task table (10-2-1 to 10-2-4); marked 10-2-1 and 10-2-2 as complete | WorkBuddy |
| 2026-06-28 | Phase 10: Added 10-2-2-1 (Find Common Points feature); marked complete | WorkBuddy |
| 2026-06-28 | Added Phase 13: SaaS Transformation (RAG memory, cloud sync, subscriptions) | WorkBuddy |
| 2026-07-12 | Phase 10: Added I1–I6 audit fix sub-task table; added completion dates to 10-2 series | WorkBuddy |
