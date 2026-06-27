# ReviewChecklist.md

## LinkedIn AI Networking Assistant — Review Checklist

---

## 1. Purpose

This checklist is used before any phase is declared complete, before any release, and before any significant pull request or code review. Every item must pass for the phase to be approved.

---

## 2. Pre-Review Checklist

### 2.1 Build and Type Safety

- [ ] `npm run build` completes successfully with no errors.
- [ ] `npm run build` produces the expected files in `dist/`:
  - `popup.html`
  - `popup.js`
  - `content.js`
  - `background.js`
  - `manifest.json`
  - icons
- [ ] TypeScript compiles with no type errors.
- [ ] No warnings were introduced by this phase's changes.

### 2.2 Browser Testing

- [ ] Extension loads in Chrome Developer Mode without errors.
- [ ] Core user flow is manually tested on a real LinkedIn profile page.
- [ ] Popup UI renders correctly and matches the Apple-style minimal design.
- [ ] Content script correctly detects and extracts profile data.
- [ ] Settings page is reachable and persists values across reloads.

### 2.3 Console and Runtime

- [ ] No console errors in the popup.
- [ ] No console errors in the content script.
- [ ] No console errors in the service worker.
- [ ] No unhandled promise rejections.

### 2.4 Architecture and Code Quality

- [ ] Architecture matches `docs/Architecture.md`.
- [ ] Data flow remains unidirectional across modules.
- [ ] No module bypasses another module (e.g., popup does not call LLM directly).
- [ ] No completed-phase code was modified unless a blocking bug was fixed.

### 2.5 Coding Rules

- [ ] All rules in `docs/CodingRules.md` were followed.
- [ ] camelCase naming is used consistently.
- [ ] No abbreviations are used in new code.
- [ ] Every change has a clear reason documented in the Done Report or commit message.
- [ ] No public interfaces were renamed without approval.
- [ ] No ambiguous requirements were assumed.

### 2.6 Dependencies

- [ ] No new dependencies were added without user approval.
- [ ] `package-lock.json` is consistent with `package.json`.

### 2.7 Documentation and Reports

- [ ] `phases/PhaseNN_Done.md` is created and complete.
- [ ] `docs/Backlog.md` is updated if the phase affects future priorities.
- [ ] `docs/Decisions.md` is updated if any new technical decisions were made.
- [ ] `docs/Roadmap.md` is updated if phase boundaries or deliverables changed.

### 2.8 Version Control

- [ ] All changes are committed with a clear commit message.
- [ ] Commit message explains what and why, not just how.
- [ ] No unrelated files are included in the commit.
- [ ] `git status` is clean before the phase is marked done.

### 2.9 Security

- [ ] **API Key Storage:** API key is stored only in `chrome.storage.local`, never hardcoded or logged.
- [ ] **API Key Input:** User input field for API key is of type `password` or equivalent (masked).
- [ ] **Token Storage:** No raw tokens are exposed in console, network requests (except to authorized endpoints), or client-side storage without encryption.
- [ ] **Chrome Permissions:** `manifest.json` permissions are minimal — only request what is explicitly needed.
- [ ] **Chrome Permissions:** No `<all_urls>` or overly broad host permissions unless required by the feature.
- [ ] **OAuth:** If OAuth is introduced in the future, use Chrome's `identity` API; do not implement custom OAuth flows in content scripts.
- [ ] **Rate Limiting:** The extension handles API rate limits gracefully (retry with backoff, user-friendly error message, no infinite loops).
- [ ] **Content Security Policy:** `manifest.json` CSP is configured to block `unsafe-eval` and `unsafe-inline` where possible.
- [ ] **No External Tracking:** No analytics, tracking beacons, or data exfiltration to third-party servers without explicit user consent.

### 2.10 Performance

- [ ] **Bundle Size:** `dist/` total size is within Chrome Web Store limits (max 128 MB; aim for <10 MB for fast load).
- [ ] **Bundle Size:** No unused dependencies are included in the production build (`npm run build` + manual inspection of `dist/`).
- [ ] **Popup Startup Time:** Popup renders within 500 ms of being opened.
- [ ] **Content Script Performance:** Content script does not block the main thread; profile extraction completes within 2 seconds on a typical LinkedIn profile.
- [ ] **Content Script Performance:** No continuous polling or `setInterval` left running after the content script's main work is done.
- [ ] **Memory Usage:** No memory leaks — event listeners are cleaned up, `chrome.runtime.sendMessage` callbacks are not accumulated.
- [ ] **Memory Usage:** `chrome.storage.local` data volume is bounded (no unbounded growth of message history or logs).
- [ ] **Network Efficiency:** Only necessary network requests are made; no redundant API calls on popup re-open.

---

## 3. Release-Specific Checklist

In addition to the above, before any Chrome Web Store release:

- [ ] Version number is updated in `package.json` and `manifest.json`.
- [ ] Privacy policy is published and linked in the store listing.
- [ ] Store description and screenshots are final.
- [ ] No auto-send or auto-click functionality exists.
- [ ] No unauthorized analytics or telemetry is included.
- [ ] Beta feedback has been triaged and critical issues resolved.
- [ ] User has explicitly approved the release.

---

## 4. Sign-off

| Role | Name | Date | Signature / Approval |
|------|------|------|----------------------|
| Developer | WorkBuddy | | |
| Reviewer | (User) | | |

No phase is complete without reviewer approval.
