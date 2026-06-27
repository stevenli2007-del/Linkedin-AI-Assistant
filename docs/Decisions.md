# Decisions.md

## LinkedIn AI Networking Assistant — Architecture Decision Record (ADR)

---

## 1. Purpose

This document records all important technical decisions made during the project in standard ADR (Architecture Decision Record) format.

Each ADR includes: ADR ID, Status, Context, Decision, Alternatives Considered, Consequences, and Review Date.

No new decision that conflicts with these records can be made without updating this document first.

---

## 2. ADR Status Definitions

| Status | Meaning |
|--------|---------|
| **Proposed** | Decision is under discussion, not yet approved. |
| **Accepted** | Decision is approved and active. |
| **Deprecated** | Decision is no longer relevant but kept for historical reference. |
| **Superseded** | Decision has been replaced by a newer ADR (link to replacement). |

---

## 3. Architecture Decision Records

---

### ADR-001: Frontend Stack — React + TypeScript + Tailwind CSS + Vite

- **Status:** Accepted
- **Context:** The extension needs a popup UI that is maintainable, type-safe, and quick to style. A component-based framework is required to manage UI state cleanly.
- **Decision:** Use React with TypeScript, Tailwind CSS, and Vite as the frontend build system.
- **Alternatives Considered:**
  - Vue.js: Rejected because the user is more familiar with React-like component patterns.
  - Plain HTML/CSS/JS: Rejected due to long-term maintainability concerns for a non-trivial UI.
  - Webpack: Rejected because Vite is faster and requires less configuration.
- **Consequences:**
  - Strong ecosystem and hiring pool for future contributors.
  - Fast build iteration during development.
  - Requires ongoing React/Vite maintenance and dependency updates.
  - Bundle size must be monitored as features grow.
- **Date:** 2026-06-26
- **Review Date:** 2026-12-31

---

### ADR-002: Browser Extension Platform — Chrome Manifest V3

- **Status:** Accepted
- **Context:** The extension must be accepted by the Chrome Web Store. Chrome has deprecated Manifest V2 and requires new extensions to use MV3.
- **Decision:** Build the extension as a Chrome Manifest V3 extension.
- **Alternatives Considered:**
  - Manifest V2: Rejected because it is deprecated and will not be accepted for new extensions.
  - Firefox extension: Rejected for V1 scope; may be considered in V2.
- **Consequences:**
  - Ensures long-term compatibility with Chrome Web Store.
  - Service worker model requires careful handling of async state and message passing.
  - Firefox or cross-browser support will require a separate build later.
- **Date:** 2026-06-26
- **Review Date:** 2027-06-26

---

### ADR-003: LLM Provider — DeepSeek API (Direct Call)

- **Status:** Accepted (planned to be superseded by ADR-011 in Phase 09)
- **Context:** The extension needs an LLM to generate personalized connection messages. Cost, quality, and simplicity are the main concerns for V1.
- **Decision:** Call the DeepSeek API directly from the extension using an OpenAI-compatible endpoint.
- **Alternatives Considered:**
  - OpenAI GPT-4o: Rejected because it increases cost and the user is comfortable with DeepSeek.
  - Self-hosted model: Rejected due to infrastructure complexity and cost.
- **Consequences:**
  - API keys must be stored in the extension and kept secure.
  - Rate limits, retries, and error handling are the extension's responsibility.
  - Future backend proxy (Phase 09) will likely supersede this decision.
- **Date:** 2026-06-26
- **Review Date:** 2026-09-30

---

### ADR-004: No Backend in Version 1

- **Status:** Accepted (will be superseded by backend proxy in Phase 09)
- **Context:** A backend server adds hosting cost, complexity, and compliance overhead. The V1 scope is a personal-use Chrome extension with local data.
- **Decision:** The extension will not have a backend server in Version 1.
- **Alternatives Considered:**
  - Node.js + Express backend: Rejected for V1; may be added in V2 if analytics, rate limiting, or cloud sync are needed.
- **Consequences:**
  - Faster time to market and lower operational cost.
  - API keys are exposed in the client, which is acceptable for private V1 use but becomes a security concern at scale.
  - A backend proxy will eventually be required for public beta and store release.
- **Date:** 2026-06-26
- **Review Date:** 2026-09-30

---

### ADR-005: Storage — Chrome Local Storage Only

- **Status:** Accepted
- **Context:** The extension needs to store user profile, settings, and message history. Privacy is a core product value; data should stay on the user's device.
- **Decision:** Use `chrome.storage.local` as the only data storage mechanism in V1.
- **Alternatives Considered:**
  - IndexedDB: Rejected because the data volume is small and `chrome.storage.local` is simpler.
  - Cloud sync: Rejected because it conflicts with privacy goals and is out of V1 scope.
- **Consequences:**
  - User data stays on the device, supporting privacy claims.
  - Data cannot be synced across devices unless cloud storage is added later.
  - Storage limits are small but sufficient for this use case.
- **Date:** 2026-06-26
- **Review Date:** 2027-06-26

---

### ADR-006: State Management — React State Only (No Redux)

- **Status:** Accepted
- **Context:** The application state is small (user profile, settings, generated messages). An external state library adds bundle size and complexity.
- **Decision:** Use React built-in state management. No Redux or external state library.
- **Alternatives Considered:**
  - Redux Toolkit: Rejected as overkill for this scope.
  - Zustand: Rejected because built-in React hooks are sufficient.
- **Consequences:**
  - Smaller bundle and simpler mental model.
  - Prop drilling may become painful if the UI grows beyond two or three nested layers.
  - Easy to adopt Zustand or Context later if state becomes complex.
- **Date:** 2026-06-26
- **Review Date:** 2026-12-31

---

### ADR-007: Message Generation — Four Fixed Styles

- **Status:** Accepted
- **Context:** Users need message tone variety, but free-text prompt input adds prompt engineering complexity and UI scope creep.
- **Decision:** Generate four connection message styles: Professional, Friendly, Entrepreneur, and Academic.
- **Alternatives Considered:**
  - Custom style input: Rejected for V1 to keep prompt engineering and UI scope manageable.
  - More than four styles: Rejected because it increases cognitive load and generation time.
- **Consequences:**
  - Users can quickly choose a tone without writing prompts.
  - May not satisfy users with highly specific needs; custom styles can be added in V2.
  - Prompt engineering is bounded to four well-defined outputs.
- **Date:** 2026-06-26
- **Review Date:** 2026-12-31

---

### ADR-008: No Automatic Message Sending

- **Status:** Accepted (non-negotiable)
- **Context:** Auto-sending LinkedIn messages violates LinkedIn's Terms of Service, risks account bans, and removes user agency over their own messaging.
- **Decision:** The extension will never automatically send LinkedIn messages.
- **Alternatives Considered:**
  - Auto-send with confirmation: Rejected because even one-click send increases compliance risk.
- **Consequences:**
  - Reduces legal and account-ban risk.
  - Keeps user in full control of every message sent.
  - May feel slower than fully automated tools, but this is a deliberate trust trade-off.
- **Date:** 2026-06-26
- **Review Date:** Never (non-negotiable)
- **Note:** This decision cannot be changed without explicit user written approval.

---

### ADR-009: Naming Convention — camelCase, No Abbreviations

- **Status:** Accepted
- **Context:** Inconsistent naming increases onboarding cost for future contributors and makes code harder to read.
- **Decision:** Use camelCase for all variables, functions, and storage keys. No abbreviations. Use complete English words.
- **Alternatives Considered:**
  - snake_case: Rejected because TypeScript/JavaScript convention is camelCase.
  - Abbreviated naming: Rejected because it harms readability.
- **Consequences:**
  - Code is easier to read and maintain for new contributors.
  - Slightly longer variable names, but clarity outweighs length.
  - Must be enforced in code review and automated linting.
- **Date:** 2026-06-26
- **Review Date:** Never (coding standard, stable)

---

### ADR-010: UI Style — Minimal, Apple-style, Clean White, Rounded Corners

- **Status:** Accepted
- **Context:** The extension is a professional productivity tool for LinkedIn users. The UI should feel calm, trustworthy, and visually consistent with the user's stated preference.
- **Decision:** Adopt a minimal, Apple-style UI with clean white backgrounds and rounded corners.
- **Alternatives Considered:**
  - Dark mode by default: Rejected because the user prefers light, clean UI.
  - Material Design: Rejected because it does not match the desired minimal aesthetic.
- **Consequences:**
  - Distinctive, calm visual identity that fits LinkedIn's professional context.
  - Dark mode or themes may be requested later and should be additive, not replacing the default style.
  - Requires careful spacing and typography to avoid looking unfinished.
- **Date:** 2026-06-26
- **Review Date:** 2027-06-26

---

### ADR-011: Exponential Backoff Retry for DeepSeek API Calls

- **Status:** Accepted
- **Context:** DeepSeek API may return HTTP 429 (rate limit) or 500/502/503 (server errors) under load. Phase 07.5 mitigated this by disabling buttons during requests, but ReviewChecklist 2.9 explicitly requires "retry with backoff". Without retry, transient failures produce poor user experience.
- **Decision:** Implement a shared `callDeepSeekAPI()` helper that retries retriable errors (429, 500, 502, 503, timeout, network error) up to 3 times with exponential backoff (1s → 2s → 4s). Non-retriable errors (401, 402, other 4xx) throw immediately.
- **Alternatives Considered:**
  - No retry (current Phase 07.5 state): Rejected — ReviewChecklist explicitly requires it.
  - Linear backoff (1s, 1s, 1s): Rejected — exponential is more effective for rate limits.
  - Retry all errors: Rejected — 401/402 are authentication failures that won't resolve with retry.
- **Consequences:**
  - Transient API failures are handled gracefully without user intervention.
  - Worst-case added latency: ~7s (1+2+4) for 3 consecutive failures before final error.
  - Both `generateMessages()` and `refineProfile()` share the same retry logic, ensuring consistency.
  - Resolves KI-008.
- **Date:** 2026-06-27
- **Review Date:** 2026-12-31

---

### ADR-012: Content Security Policy for Chrome MV3

- **Status:** Accepted
- **Context:** Chrome Web Store requires extensions to have a Content Security Policy that blocks unsafe-eval and unsafe-inline. The manifest.json had no CSP field, which would fail ReviewChecklist 2.9 and likely cause store rejection.
- **Decision:** Add `"content_security_policy": { "extension_pages": "script-src 'self'; object-src 'self'" }` to manifest.json. This is the strictest practical CSP for a Chrome MV3 extension — only allows scripts from the extension itself, no inline scripts, no eval, no remote code.
- **Alternatives Considered:**
  - No CSP: Rejected — fails ReviewChecklist and store requirements.
  - Allow 'unsafe-inline': Rejected — unnecessary and increases attack surface.
  - Allow specific remote scripts: Rejected — no remote scripts are needed.
- **Consequences:**
  - Blocks all inline scripts and eval, reducing XSS risk.
  - No impact on functionality — the extension uses only bundled scripts.
  - May need adjustment if future phases require external script loading (unlikely).
- **Date:** 2026-06-27
- **Review Date:** 2027-06-26

---

## 4. How to Add a New ADR

When a new technical decision is made:

1. Assign the next ADR ID (e.g., if the last is ADR-010, the next is ADR-011).
2. Use the template below.
3. Set Status to `Proposed` first; change to `Accepted` after user approval.
4. If an ADR is superseded, update its Status to `Superseded` and add a reference to the new ADR number.
5. Any change must be reviewed and approved by the user.

### ADR Template

```
### ADR-XXX: [Decision Title]

- **Status:** Proposed / Accepted / Deprecated / Superseded
- **Context:** [What is the situation or problem that led to this decision?]
- **Decision:** [What was decided? Be specific.]
- **Alternatives Considered:**
  - [Alternative 1]: [Why it was rejected.]
  - [Alternative 2]: [Why it was rejected.]
- **Consequences:**
  - [Positive consequences]
  - [Negative consequences / risks / limitations]
  - [Future unlocks or constraints]
- **Date:** YYYY-MM-DD
- **Review Date:** YYYY-MM-DD (or "Never" if the decision is stable)
```

---

## 5. ADR Index

| ADR ID | Title | Status | Review Date |
|--------|-------|--------|-------------|
| ADR-001 | Frontend Stack | Accepted | 2026-12-31 |
| ADR-002 | Chrome Manifest V3 | Accepted | 2027-06-26 |
| ADR-003 | DeepSeek API Direct Call | Accepted (→ADR-011) | 2026-09-30 |
| ADR-004 | No Backend in V1 | Accepted (→backend in Phase 09) | 2026-09-30 |
| ADR-005 | Chrome Local Storage Only | Accepted | 2027-06-26 |
| ADR-006 | React State Only | Accepted | 2026-12-31 |
| ADR-007 | Four Fixed Message Styles | Accepted | 2026-12-31 |
| ADR-008 | No Automatic Message Sending | Accepted (non-negotiable) | Never |
| ADR-009 | camelCase, No Abbreviations | Accepted | Never |
| ADR-010 | Minimal Apple-style UI | Accepted | 2027-06-26 |
| ADR-011 | Exponential Backoff Retry | Accepted | 2026-12-31 |
| ADR-012 | Content Security Policy | Accepted | 2027-06-26 |

---
