# Backlog.md

## LinkedIn AI Networking Assistant — Product Backlog

---

## 1. Purpose

This document captures known future work, opportunities, and explicit non-goals. Items are prioritized using the MoSCoW method:

- **Must:** Required for the next phase or release. Must be done.
- **Should:** Important but not blocking. Should be done if time allows.
- **Could:** Nice to have. Can be deferred without harming the product.
- **Won't:** Explicitly out of scope or intentionally postponed.

This backlog is a planning document only. Items here are not implemented unless they are formally assigned to a phase in `docs/Roadmap.md`.

---

## 2. Must

### M1 — Production Readiness Audit

- Audit all MVP code against `docs/CodingRules.md` and `docs/Architecture.md`.
- Fix all critical and high-priority bugs.
- Complete all items in `docs/ReviewChecklist.md`.
- **Phase:** Phase 08
- **Status:** ✅ Complete (2026-06-27) — 1 Critical + 4 High fixed, 12/12 checklist categories passed

### M2 — Privacy Policy Finalization

- Publish a privacy policy that accurately describes data collection, storage, and API usage.
- Link the privacy policy in the Chrome Web Store listing and in the extension settings.
- **Phase:** Phase 08
- **Status:** ✅ Complete (2026-06-27) — PRIVACY_POLICY.md + privacy.html + Terms of Use + store checklist created

### M3 — Backend Proxy for API Key Management

- Introduce a secure backend proxy to hold and manage LLM API keys.
- Migrate the extension from direct DeepSeek calls to proxy calls.
- Add rate limiting and request logging.
- **Phase:** Phase 09

### M4 — Beta Testing Program

- Recruit closed beta users (10–50) and public beta users (100–500).
- Collect feedback and triage bugs.
- Fix all critical bugs before store submission.
- **Phase:** Phase 10

### M5 — Chrome Web Store Release

- Submit Version 1.0 to the Chrome Web Store.
- Pass Google review and publish the extension.
- **Phase:** Phase 11

---

## 3. Should

### S1 — Error Handling and Recovery

- Improve error messages shown to users when API calls fail.
- Add retry logic with exponential backoff.
- Distinguish between user-recoverable errors (e.g., invalid API key) and system errors.
- **Phase:** Phase 08
- **Status:** ✅ Complete (2026-06-27) — shared callDeepSeekAPI() with 3-retry exponential backoff

### S2 — Onboarding and Help Content

- Add a first-run onboarding screen or tooltip.
- Write a short FAQ inside the settings page.
- Provide a link to documentation or support.
- **Phase:** Phase 08
- **Status:** ✅ Complete (2026-06-27) — 3-step onboarding card + 5-item FAQ + support links

### S3 — Store-Ready Assets

- Create screenshots of the popup and settings pages.
- Design promotional images for the Chrome Web Store.
- Write a compelling store description.
- **Phase:** Phase 08
- **Status:** ✅ Complete (2026-06-27) — 4 icons + 5 screenshots + store description drafts + submission checklist

### S4 — Proxy Health and Monitoring

- Add basic health checks and alerting for the backend proxy.
- Log error rates and response times.
- Set up cost alerts for API usage.
- **Phase:** Phase 09

### S5 — Beta Feedback Collection

- Add a simple in-app feedback form or support email link.
- Send a follow-up survey to closed beta participants.
- **Phase:** Phase 10

### S6 — Expanded Message Options (Premium)

- Increase from 4 free message styles to 8 total (4 free + 4 premium).
- Premium styles could include: Direct/Concise, Storytelling, Humorous/Warm, Industry-Specific.
- **Phase:** Phase 14
- **Status:** Planned — depends on Phase 13 subscription infrastructure

### S7 — AI LinkedIn Post Generation (Premium)

- Premium users can upload an image (e.g., event photo, project screenshot).
- AI generates a full LinkedIn post based on the image content and user context.
- **Phase:** Phase 14
- **Status:** Planned — depends on Phase 13 subscription infrastructure

### S8 — Subscription System

- Integrate payment processing (Stripe or equivalent) for monthly/annual tiers.
- Free tier: 4 message styles + refinement + preference memory.
- Premium tier: 8 styles + Post generation + advanced memory.
- **Phase:** Phase 14 (infrastructure in Phase 13)
- **Status:** Planned

---

## 4. Could

### C1 — Dark Mode Theme

- Add an optional dark mode toggle.
- Default remains light/Apple-style.
- **Phase:** Phase 12 or later

### C2 — Custom Message Styles

- Allow users to define their own message styles or tone preferences.
- **Phase:** Phase 12 or later

### C3 — Message History

- Store generated messages locally so users can revisit them.
- Add a simple history view in the popup.
- **Phase:** Phase 12 or later

### C4 — Multi-Language Support

- Localize UI text into additional languages.
- **Phase:** Phase 12 or later

### C5 — Analytics Dashboard

- Track anonymized usage metrics (with explicit user consent and privacy policy update).
- Build a simple dashboard for growth metrics.
- **Phase:** Phase 12 or later

### C6 — Landing Page or Marketing Site

- Create a simple landing page explaining the extension.
- Use it for distribution and SEO.
- **Phase:** Phase 12 or later

---

## 5. Won't

### W1 — Automatic LinkedIn Message Sending

- The extension will never send LinkedIn messages automatically.
- Any feature that clicks "Send" or bypasses manual review is out of scope.
- **Reason:** Legal risk, LinkedIn Terms of Service, and user trust.

### W2 — Scraping Beyond Public Profile Data

- The extension will not scrape private messages, connection lists, or hidden profile data.
- Only publicly visible profile page data is in scope.
- **Reason:** Privacy, compliance, and LinkedIn policy.

### W3 — Cloud Sync or External User Databases in V1

- User data will not be stored on external servers in Version 1.
- Cloud sync may be considered in a future version with explicit privacy controls.
- **Reason:** Privacy-first design and minimal operational overhead.

### W4 — Multi-Browser Support in V1

- Firefox, Safari, or Edge versions are not planned for Version 1.
- Chrome is the only target browser.
- **Reason:** Focus on a single store and extension platform for the initial release.

### W5 — Built-in Contact CRM

- The extension will not manage contact lists, tags, or outreach pipelines.
- Integration with external CRMs is out of scope.
- **Reason:** Keeps the product focused on message generation.

---

## 6. Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-06-26 | Initial Backlog with MoSCoW prioritization | WorkBuddy |
| 2026-06-27 | M1, M2, S1, S2, S3 marked complete (Phase 08 done) | WorkBuddy |
| 2026-07-30 | Added S6–S8 (premium content + subscription), C7–C9 (mobile, per-target memory, true RAG) for Phase 14/15 planning | WorkBuddy |
