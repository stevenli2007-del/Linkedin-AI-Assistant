# Chrome Web Store Submission Guide — Phase 10-3-7

**Last updated:** 2026-07-12  
**Package:** `linkedin-ai-assistant-v1.0.0-public-beta.zip` (94 KB)  
**Visibility:** Unlisted (Public Beta)

---

This document contains **every piece of content** you need to fill in the Chrome Web Store Developer Dashboard. Just copy-paste each section.

---

## Step 1: Upload the Package

1. Go to https://chrome.google.com/webstore/devconsole/
2. Click **"New Item"**
3. Upload `linkedin-ai-assistant-v1.0.0-public-beta.zip`
   - File location: `C:\Users\18038\OneDrive\桌面\Linkedin Project\linkedin-ai-assistant-v1.0.0-public-beta.zip`
4. After upload, the Dashboard will open with fields to fill in.

---

## Step 2: Store Listing — Basic Information

### 2.1 Extension Name
```
LinkedIn AI Assistant
```

### 2.2 Summary (132 chars max)
```
Generate personalized LinkedIn connection messages with AI. 4 styles, zero setup, zero automation. Your data stays on your device.
```
*(130 characters — within limit)*

### 2.3 Category
```
Productivity
```

### 2.4 Language
```
English
```

---

## Step 3: Privacy Tab

The Dashboard has a **Privacy** tab with several required fields. Fill them as follows:

### 3.1 Single Purpose Description

```
This extension helps users generate personalized LinkedIn connection request messages. It reads the visible profile content of the LinkedIn page the user is currently viewing, compares it with the user's own imported profile, and generates editable message suggestions. The extension does not send connection requests, automate clicks, or post content on behalf of the user.
```

### 3.2 Permission Justification

The form shows three justification fields. Copy the exact text for each:

**`storage justification`:**
```
Stores the user's own LinkedIn profile, app settings, generated message history, and optional custom API key locally in the browser. All data remains on the user's device.
```

**`activeTab justification`:**
```
Reads the currently active LinkedIn profile page only when the user explicitly clicks the "Generate Messages" or "Find Common Points" button in the popup.
```

**`Host permission justification`:**
```
The linkedin.com host permission is required for the content script to read visible profile text on LinkedIn pages. The backend host permission (linkedin-ai-backend.stevenli2007.workers.dev) is required so AI generation requests can be routed through our backend proxy for rate limiting and shared API key management. No direct third-party API calls are made from the extension.
```

### 3.3 Remote Code

**Select:** `No, I am not using remote code`

**Why:** The extension only executes JavaScript bundled inside the package. Calls to the backend proxy return JSON/text responses (AI-generated messages), not executable code. The manifest's `content_security_policy` is `script-src 'self'; object-src 'self'`, which prohibits remote scripts.

*(If the Dashboard pre-selected "Yes", switch it to "No" and leave the Justification field empty.)*

### 3.4 Data Usage

**Check only:** `Website content`

**Leave unchecked:** All other options (PII, Health, Financial, Authentication, Personal communications, Location, Web history, User activity).

**Data usage justification:**
```
The extension reads the visible text content of the LinkedIn profile page the user is currently viewing in order to generate personalized connection messages. This content is sent to our backend proxy, forwarded to the AI provider for message generation, and is not stored on our servers. The user's own imported profile and settings are stored locally using Chrome's storage API.
```

**Certifications — check all three boxes:**
- `I do not sell or transfer user data to third parties, outside of the approved use cases`
- `I do not use or transfer user data for purposes that are unrelated to my item's single purpose`
- `I do not use or transfer user data to determine creditworthiness or for lending purposes`

### 3.5 Privacy Policy URL

```
https://stevenli2007-del.github.io/Linkedin-AI-Assistant/privacy-policy.html
```

---

## Step 4: Detailed Description

Copy the entire block below (between the lines, not including the lines):

---

LinkedIn AI Networking Assistant helps you craft the perfect connection request message — every time.

Stop staring at the blank "Add a note" box. With one click, this extension analyzes both your profile and the profile you're viewing, then generates 4 different connection message styles:

• Professional — formal, respectful, career-focused
• Friendly — warm, casual, conversational
• Entrepreneur — direct, ambitious, opportunity-focused
• Academic — scholarly, intellectual, research-oriented

KEY FEATURES

✦ One-click generation — Open any LinkedIn profile, click "Generate Messages," and get 4 tailored options instantly.
✦ Smart common-ground detection — Click "Find Common Points" and the AI compares your profile with the target's to find shared schools, companies, industries, or interests. Pick one to emphasize in the generated messages.
✦ Copy, Edit, Regenerate — Every message is fully editable. Copy to clipboard, edit inline, or regenerate a single style without affecting the others.
✦ Adjustable message length — Set a custom character limit (50–1000 chars) to control how long your messages are. Saved automatically.
✦ Profile sync — Import your own LinkedIn profile with one click. AI refines it into clean, structured data for better message generation.
✦ Message history — Optionally record when you connect with someone, which style you used, and what common ground you found. Export to CSV anytime. Off by default — you decide whether to enable it.
✦ Zero automation — This extension NEVER sends connection requests, clicks buttons, or posts anything on your behalf. Every message is reviewed and sent manually by you.

TWO MODES

✦ Shared Mode (default) — No setup required. AI requests go through our backend proxy with a shared API key. Free for users, with rate limiting to ensure fair use.
✦ Custom Mode — For users who prefer their own DeepSeek API key. Enter your key in Settings and all requests use your own quota. Your key is stored locally and never sent to our servers.

PRIVACY FIRST

Your profile data and settings stay on your device using Chrome's local storage. AI requests are sent to our backend proxy (linkedin-ai-backend.stevenli2007.workers.dev) which forwards them to the AI provider — your data is never stored on our servers. No analytics, no tracking, no selling data. Read our full Privacy Policy inside the extension.

HOW IT WORKS

1. Click the extension icon — Shared Mode works out of the box (no API key needed)
2. Sync or manually enter your profile
3. Open any LinkedIn profile page
4. Optionally click "Find Common Points" to discover shared connections
5. Click "Generate Messages"
6. Review, edit, and copy your favorite message
7. Paste it into LinkedIn's "Add a note" box

REQUIREMENTS

• Chrome browser (Manifest V3)
• No API key required for Shared Mode. Custom Mode supports user-provided DeepSeek API keys.

DISCLAIMER

This extension is an independent productivity tool and is not affiliated with, endorsed by, or sponsored by LinkedIn or DeepSeek. Users are responsible for complying with LinkedIn's Terms of Service.

---

## Step 5: Upload Screenshots

Upload **all 5 screenshots** from `store-assets/`. Use the `store-screenshot-*` versions (already sized for CWS):

| Order | File | Dimensions |
|-------|------|-----------|
| Screenshot 1 (hero) | `store-assets/store-screenshot-01-hero-1280x800.png` | 1280×800 |
| Screenshot 2 | `store-assets/store-screenshot-02-messages-640x400.png` | 640×400 |
| Screenshot 3 | `store-assets/store-screenshot-03-settings-top-640x400.png` | 640×400 |
| Screenshot 4 | `store-assets/store-screenshot-04-settings-profile-640x400.png` | 640×400 |
| Screenshot 5 | `store-assets/store-screenshot-05-settings-bottom-640x400.png` | 640×400 |

---

## Step 6: Upload Store Icon

Upload the 128×128 icon:
```
public/icons/icon128.png
```
*(This is the same icon already in the package, but CWS requires it separately for the store listing.)*

---

## Step 7: Fill in Links

| Field | Value |
|-------|-------|
| **Homepage URL** | `https://github.com/stevenli2007-del/Linkedin-AI-Assistant` |
| **Support URL / Contact** | `https://github.com/stevenli2007-del/Linkedin-AI-Assistant/issues` |
| **Support Email** | `stevenli2007@berkeley.edu` |
| **Privacy Policy URL** | `https://stevenli2007-del.github.io/Linkedin-AI-Assistant/privacy-policy.html` |


## Step 8: Set Visibility

**CRITICAL — this is what makes it a Public Beta, not a full public release.**

In the Dashboard, find the **Visibility** setting:
- Select **"Unlisted"**
- This means only people with the direct link can install it
- It will NOT appear in search results

---

## Step 9: Submit for Review

1. Double-check all fields are filled
2. Click **"Submit for Review"**
3. Review typically takes **1–7 business days**
4. You'll get an email when it's approved or if changes are needed

### Common rejection reasons (and how we've addressed them):
- **Permission justification unclear** → We've prepared clear justifications (Step 3)
- **Privacy Policy incomplete** → We have a comprehensive policy at a public URL
- **Single purpose violation** → Our single purpose is generating LinkedIn connection messages
- **Host permissions too broad** → We only request linkedin.com (required) and our own backend (required)
- **Remote code policy violation** → We do not execute remote code; all JS is bundled in the package

### If rejected:
- Google will tell you which policy was violated
- Share the feedback with WorkBuddy and we'll fix it together

---

## Quick Checklist Before Clicking "Submit"

- [ ] ZIP uploaded
- [ ] Name: "LinkedIn AI Assistant"
- [ ] Summary filled (130 chars)
- [ ] Category: Productivity
- [ ] Language: English
- [ ] **Privacy Tab**
  - [ ] Single purpose description filled
  - [ ] `storage` justification filled
  - [ ] `activeTab` justification filled
  - [ ] `Host permission` justification filled
  - [ ] Remote code set to **No**
  - [ ] Data usage: only `Website content` checked
  - [ ] Data usage justification filled
  - [ ] All three certifications checked
  - [ ] Privacy Policy URL filled
- [ ] Detailed description pasted
- [ ] 5 screenshots uploaded
- [ ] Store icon uploaded
- [ ] Homepage URL filled
- [ ] Support URL filled
- [ ] Visibility set to **Unlisted**
- [ ] Click "Submit for Review"
