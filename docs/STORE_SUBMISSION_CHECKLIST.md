# Chrome Web Store Submission Checklist

**Last updated:** 2026-06-27

This checklist covers all requirements for submitting the LinkedIn AI Networking Assistant to the Chrome Web Store. It is organized by submission phase.

---

## 1. Developer Account

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1.1 | Google account registered | ⬜ | Required for Chrome Web Store Developer Dashboard |
| 1.2 | One-time $5 registration fee paid | ⬜ | Required for publishing any extension |
| 1.3 | Developer identity verified | ⬜ | Google may require identity verification |

---

## 2. Extension Package

| # | Item | Status | Notes |
|---|------|--------|-------|
| 2.1 | `npm run build` passes with 0 errors | ✅ | Verified 2026-06-27 |
| 2.2 | `dist/` directory is the submission package | ✅ | Contains popup.html, popup.js, content.js, background.js, manifest.json, icons/, privacy.html |
| 2.3 | `manifest.json` version is `1.0.0` | ✅ | Updated in Phase 08 |
| 2.4 | No `console.log` / debug code in production build | ✅ | Verified in Phase 08 audit |
| 2.5 | CSP configured in manifest.json | ✅ | `script-src 'self'; object-src 'self'` |
| 2.6 | All icons present (16, 32, 48, 128 px) | ✅ | Located in `dist/icons/` |
| 2.7 | `privacy.html` bundled and accessible | ✅ | Registered in `web_accessible_resources` |
| 2.8 | No unnecessary permissions requested | ✅ | Only `storage` + `activeTab`; host: linkedin.com + api.deepseek.com |
| 2.9 | Package as `.zip` of `dist/` contents | ⬜ | Do before uploading: `cd dist && zip -r ../extension-v1.0.0.zip .` |

---

## 3. Store Listing Content

### 3.1 Basic Information

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.1.1 | Extension name | ✅ | "LinkedIn AI Assistant" |
| 3.1.2 | Summary (132 chars max) | ⬜ | Draft needed. Suggestion: "Generate personalized LinkedIn connection messages with AI. 4 styles, one click, zero automation." |
| 3.1.3 | Detailed description (16,000 chars max) | ⬜ | Draft needed — see Section 8 below |
| 3.1.4 | Category | ⬜ | Suggested: "Productivity" |
| 3.1.5 | Language | ⬜ | "English" (or "English + Chinese" if multilingual listing) |

### 3.2 Visual Assets

| # | Item | Status | Spec | Notes |
|---|------|--------|------|-------|
| 3.2.1 | Store icon (128×128 PNG) | ✅ | Replaced with custom design: speech bubble + AI sparkles + user avatar, blue gradient, no trademarks |
| 3.2.2 | Small promo tile (440×280 PNG) | ⬜ | Optional — nice to have if you have branding | See Section 11 |
| 3.2.3 | Marquee promo tile (1400×560 PNG) | ⬜ | Optional — for featured placement | See Section 11 |
| 3.2.4–8 | Screenshots 1–5 | ✅ | 5 screenshots in `store-assets/` (see below) |

### 3.3 Links

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.3.1 | Privacy Policy URL | ✅ | Bundle `privacy.html` with extension; also host at a public URL for the store listing field |
| 3.3.2 | Terms of Use URL | ✅ | `docs/TERMS_OF_USE.md` created; host at public URL for store |
| 3.3.3 | Support URL / contact | ✅ | stevenli2007@berkeley.edu; GitHub Issues page (repo URL needed) |
| 3.3.4 | Homepage URL | ⬜ | Optional — GitHub repo or landing page |

---

## 4. Privacy & Permissions Justification

Google requires you to justify each permission and explain your data usage.

| # | Item | Status | Notes |
|---|------|--------|-------|
| 4.1 | Justify `storage` permission | ✅ | "Stores user profile, API key, and settings locally in browser" |
| 4.2 | Justify `activeTab` permission | ✅ | "Reads the currently open LinkedIn profile when user clicks Generate" |
| 4.3 | Justify `host_permissions: linkedin.com` | ✅ | "Content script reads visible profile text for message generation" |
| 4.4 | Justify `host_permissions: api.deepseek.com` | ✅ | "Direct API calls to DeepSeek for AI message generation" |
| 4.5 | Data usage disclosure (Privacy Policy) | ✅ | `privacy.html` bundled + `docs/PRIVACY_POLICY.md` |
| 4.6 | No remote code execution | ✅ | CSP blocks `unsafe-eval` and `unsafe-inline` |
| 4.7 | No `eval()` or dynamic script injection | ✅ | Verified in code audit |

---

## 5. Functional Testing Before Submission

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 5.1 | Install unpacked from `dist/` in Chrome | ⬜ | Load via `chrome://extensions` > Developer mode > Load unpacked |
| 5.2 | Popup opens without errors | ⬜ | Check console for errors |
| 5.3 | Generate messages on a LinkedIn profile | ⬜ | Verify 4 styles appear |
| 5.4 | Copy a message to clipboard | ⬜ | Verify toast appears |
| 5.5 | Edit a message and save | ⬜ | Verify edited content persists in session |
| 5.6 | Regenerate a single message style | ⬜ | Verify only that style updates |
| 5.7 | Open Settings, enter API key, save | ⬜ | Verify key persists after popup close/reopen |
| 5.8 | Sync LinkedIn profile (auto-import) | ⬜ | Verify C-1 fix: only fires when user clicks sync |
| 5.9 | Open Privacy Policy link | ⬜ | Verify opens in new tab |
| 5.10 | API error handling (invalid key) | ⬜ | Enter wrong key, verify friendly error |
| 5.11 | API rate limit retry | ⬜ | Hard to test manually; verify no infinite loop |
| 5.12 | Uninstall clears data | ⬜ | Check `chrome://extensions` storage before/after |

---

## 6. Chrome Web Store Policies Compliance

| # | Policy Area | Status | Notes |
|---|-------------|--------|-------|
| 6.1 | Single purpose | ✅ | Generate LinkedIn connection messages — one clear purpose |
| 6.2 | No deceptive behavior | ✅ | No impersonation, no fake UI |
| 6.3 | No malware / harmful code | ✅ | Code audited; no external script loading |
| 6.4 | Limited use of permissions | ✅ | Only `storage` + `activeTab` |
| 6.5 | No interference with third-party sites | ✅ | Content script only reads, never modifies LinkedIn DOM |
| 6.6 | No scraping at scale | ✅ | Only reads page user is viewing on explicit action |
| 6.7 | User data transparency | ✅ | Privacy Policy bundled and linked |
| 6.8 | No selling user data | ✅ | Stated explicitly in Privacy Policy |
| 6.9 | No ads or monetization | ✅ | Free, no ads, no in-app purchases |
| 6.10 | Content security | ✅ | CSP configured; no remote code |

---

## 7. Post-Submission

| # | Item | Status | Notes |
|---|------|--------|-------|
| 7.1 | Upload `.zip` to Chrome Web Store Developer Dashboard | ⬜ | |
| 7.2 | Fill in all store listing fields | ⬜ | Use drafts from Section 8 |
| 7.3 | Submit for review | ⬜ | Review typically takes 1–7 business days |
| 7.4 | Respond to reviewer feedback if rejected | ⬜ | Common: permission justification, privacy policy clarity |
| 7.5 | Publish after approval | ⬜ | |
| 7.6 | Update `docs/ReleasePlan.md` with launch date | ⬜ | |

---

## 8. Draft Store Description

### Short Summary (132 chars)

> Generate personalized LinkedIn connection messages with AI. 4 styles, one click, zero automation. Your data stays on your device.

### Detailed Description

```
LinkedIn AI Networking Assistant helps you craft the perfect connection request message — every time.

Stop staring at the blank "Add a note" box. With one click, this extension analyzes both your profile and the profile you're viewing, then generates 4 different connection message styles:

• Professional — formal, respectful, career-focused
• Friendly — warm, casual, conversational
• Entrepreneur — direct, ambitious, opportunity-focused
• Academic — scholarly, intellectual, research-oriented

KEY FEATURES

✦ One-click generation — Open any LinkedIn profile, click "Generate Messages," and get 4 tailored options instantly.
✦ Smart common-ground detection — The AI compares your profile with the target's to find shared schools, companies, industries, or interests, and naturally weaves them into each message.
✦ Copy, Edit, Regenerate — Every message is fully editable. Copy to clipboard, edit inline, or regenerate a single style without affecting the others.
✦ Profile sync — Import your own LinkedIn profile with one click. AI refines it into clean, structured data for better message generation.
✦ Zero automation — This extension NEVER sends connection requests, clicks buttons, or posts anything on your behalf. Every message is reviewed and sent manually by you.

PRIVACY FIRST

Your data stays on your device. No backend server, no analytics, no tracking. Your DeepSeek API key and profile data are stored locally in Chrome and never uploaded to any developer-controlled server. Read our full Privacy Policy inside the extension.

HOW IT WORKS

1. Enter your DeepSeek API key in Settings (get one at platform.deepseek.com)
2. Sync or manually enter your profile
3. Open any LinkedIn profile page
4. Click "Generate Messages"
5. Review, edit, and copy your favorite message
6. Paste it into LinkedIn's "Add a note" box

REQUIREMENTS

• Chrome browser (Manifest V3)
• A DeepSeek API key (user-provided, stored locally)

DISCLAIMER

This extension is an independent productivity tool and is not affiliated with, endorsed by, or sponsored by LinkedIn or DeepSeek. Users are responsible for complying with LinkedIn's Terms of Service.
```

---

## 9. Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-06-27 | Initial production release. 4 message styles, profile sync, copy/edit/regenerate, privacy policy bundled. |

---

## 10. Screenshot Guide

> **Status: ✅ COMPLETED (2026-06-27)**
>
> All 5 screenshots captured by user, processed to Chrome Web Store spec, and stored in `store-assets/`.

### Actual Files

| File | Dimensions | Content | For Store Upload |
|------|-----------|---------|-----------------|
| `store-screenshot-01-hero-1280x800.png` | 1280×800 (471 KB) | LinkedIn profile + extension popup overlay — hero image | ✅ Use as-is |
| `store-screenshot-02-messages-640x400.png` | 640×400 (69 KB) | 3 message styles (Professional/Friendly/Entrepreneur) with Copy/Edit/Regenerate | ✅ Use as-is |
| `store-screenshot-03-settings-top-640x400.png` | 640×400 (35 KB) | Settings: Import, API Key, Model, Temperature | ✅ Use as-is |
| `store-screenshot-04-settings-profile-640x400.png` | 640×400 (53 KB) | Settings: Profile fields filled in | ✅ Use as-is |
| `store-screenshot-05-settings-bottom-640x400.png` | 640×400 (18 KB) | Settings: Interests, Save button, Privacy/Support links, FAQ | ✅ Use as-is |

**Note:** Original unprocessed screenshots (`screenshot-01~05-*.png`) are also kept in `store-assets/` for reference.

**Privacy note:** Screenshots contain user's own profile data (Youcheng Li / UC Berkeley) and a sample LinkedIn profile (Rubi Wu). Both are public information or user's own data — acceptable for store listing.

---

## 11. Icon Design Notes

**Status: ✅ COMPLETED (2026-06-27)**

All 4 icon files have been replaced with a custom design:

| File | Size | Status |
|------|------|--------|
| `public/icons/icon16.png` | 16×16 | ✅ Replaced (635 B) |
| `public/icons/icon32.png` | 32×32 | ✅ Replaced (1.7 KB) |
| `public/icons/icon48.png` | 48×48 | ✅ Replaced (3.0 KB) |
| `public/icons/icon128.png` | 128×128 | ✅ Replaced (13.4 KB) |

**Design:** Speech bubble (blue gradient) + AI sparkle stars + user silhouette avatar + connection arc — no LinkedIn or DeepSeek trademarks. Source was a 1254×1254 PNG resized with LANCZOS resampling.

---

## 12. Sign-off

This checklist must be fully completed before submitting to the Chrome Web Store.

**Prerequisites (must complete first):**
- [x] Icons replaced with proper design (Section 11)
- [x] Screenshots captured (Section 10)
- [ ] All functional tests passed (Section 5) — user must test manually
- [ ] Extension packaged as zip (Item 2.9)

**Final sign-off:**
- [ ] Developer review: all items verified ✅ / ⬜
- [ ] Privacy review: policy reviewed by user ✅ / ⬜
- [ ] Functional testing: Section 5 all pass ✅ / ⬜
- [ ] Final submission approved: ready to upload ✅ / ⬜
