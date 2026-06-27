# ReleasePlan.md

## LinkedIn AI Networking Assistant — Release Plan

---

## 1. Overview

This document defines the release strategy from first internal testing to the Chrome Web Store and beyond. Each stage has a clear goal, audience, success criteria, and exit criteria.

Releases are gated. A stage cannot begin until the previous stage's exit criteria are met.

---

## 2. Release Stages

### Stage 1 — Internal Alpha

- **Goal:** Verify that the extension builds, loads, and generates messages on real LinkedIn profiles in a controlled environment.
- **Audience:** Developer only.
- **Duration:** 1–2 days.
- **Deliverables:**
  - Build passes on `npm run build`.
  - Extension loads in Chrome Developer Mode.
  - Core user flow works end-to-end on 3–5 real LinkedIn profiles.
- **Success Criteria:**
  - No build errors or console errors.
  - Four message styles are generated correctly.
  - Copy, Edit, and Regenerate actions work.
- **Exit Criteria:**
  - All success criteria are met.
  - Developer sign-off.

---

### Stage 2 — Closed Beta

- **Goal:** Gather early feedback from a small group of trusted users and fix critical issues before wider exposure.
- **Audience:** 10–50 users selected by the project owner. Students, researchers, founders, job seekers, and professionals.
- **Duration:** 1–2 weeks.
- **Deliverables:**
  - Distribute extension as a packed `.zip` or via Chrome Web Store private testers.
  - Feedback form or interview process.
  - Bug triage and priority fixes.
- **Success Criteria:**
  - At least 50% of beta users complete the core flow successfully.
  - No critical or high-priority bugs remain.
  - Message quality is rated "good" or better by 70% of users.
- **Exit Criteria:**
  - Success criteria met.
  - User feedback is documented.
  - Critical bugs resolved.
  - User approval to proceed to Public Beta.

---

### Stage 3 — Public Beta

- **Goal:** Validate the extension at a larger scale and collect broader feedback before Version 1.0.
- **Audience:** 100–500 users. Shared via LinkedIn, personal networks, and relevant communities.
- **Duration:** 2–4 weeks.
- **Deliverables:**
  - Chrome Web Store "Unlisted" listing or public beta landing page.
  - In-app feedback mechanism or support email.
  - FAQ and basic help documentation.
- **Success Criteria:**
  - At least 100 active installs.
  - 4.0+ average rating or equivalent positive feedback.
  - Less than 5% crash or error rate.
  - Users can complete the core flow without assistance.
- **Exit Criteria:**
  - Success criteria met for 2 consecutive weeks.
  - No open critical bugs.
  - User approval to publish Version 1.0.

---

### Stage 4 — Version 1.0

- **Goal:** Publish a stable, polished extension to the Chrome Web Store as the official release.
- **Audience:** General public.
- **Duration:** One-time release event with ongoing support.
- **Deliverables:**
  - Final production build.
  - Chrome Web Store listing with screenshots, description, and privacy policy.
  - Store-optimized assets (icon, screenshots, promotional images).
  - Version 1.0 release notes.
- **Success Criteria:**
  - Extension is approved by Google and listed on the Chrome Web Store.
  - First 100 installs within 30 days of launch.
  - Average rating of 4.0+ within 60 days.
- **Exit Criteria:**
  - Extension is live on the Chrome Web Store.
  - User approval that the release is complete.

---

### Stage 5 — Growth

- **Goal:** Increase user base and iterate toward Version 2.0.
- **Audience:** Public users and potential new user segments.
- **Duration:** Ongoing after Version 1.0.
- **Deliverables:**
  - Landing page or simple marketing site.
  - Content strategy (LinkedIn posts, tutorials, case studies).
  - Referral or share feature (if approved).
  - Analytics dashboard (only if approved and compliant with privacy policy).
- **Success Metrics:**
  - Monthly active users (MAU).
  - Chrome Web Store installs and rating.
  - User retention rate (7-day and 30-day).
  - Message generation success rate.
- **Exit Criteria:**
  - Growth metrics are tracked and reviewed weekly.
  - V2.0 feature roadmap is documented and prioritized.

---

## 3. Versioning Strategy

- Follow semantic versioning: `MAJOR.MINOR.PATCH`.
- **MAJOR:** Breaking changes or major architectural shifts.
- **MINOR:** New features that are backward compatible.
- **PATCH:** Bug fixes, security patches, and minor improvements.
- Example progression: `0.1.0-alpha` → `0.5.0-beta` → `0.9.0-public-beta` → `1.0.0`.

---

## 4. Release Checklist

Before any release to the Chrome Web Store:

- [ ] `npm run build` succeeds with no errors.
- [ ] All TypeScript errors are resolved.
- [ ] Extension loads in Chrome Developer Mode.
- [ ] Core user flow is tested on real LinkedIn profiles.
- [ ] Privacy policy is updated and accurate.
- [ ] Store description and screenshots are ready.
- [ ] No auto-send or auto-click functionality exists.
- [ ] No new dependencies were added without approval.
- [ ] Done Report for the current phase is complete.
- [ ] User has approved the release.

---

## 5. Rollback Plan

If a release introduces critical issues:

1. Immediately pull the affected version from the Chrome Web Store if possible.
2. Revert to the last known good version.
3. Publish a patch release (`x.x.x+1`) with the fix.
4. Document the incident in the next phase's Done Report.
