# Privacy Policy — LinkedIn AI Networking Assistant

**Last updated:** 2026-06-27

## Overview

LinkedIn AI Networking Assistant ("the Extension") is a Chrome browser extension that helps you generate personalized LinkedIn connection request messages using AI.

This privacy policy explains what data the Extension processes, how it is stored, and how it is used. It is designed to be transparent and reviewable by both users and platform reviewers.

## Our Core Principle

**Your data stays on your device.** In the current version, the Extension does not have a backend server. All data is stored locally in your browser using Chrome's built-in local storage. No data is uploaded to any server controlled by the Extension developer.

## Browser Permissions

The Extension requests only the minimum permissions required to function:

| Permission | Why it's needed |
|-----------|-----------------|
| `storage` | Used to store your profile, API key, and preferences locally in your browser. |
| `activeTab` | Used to read the currently open LinkedIn profile page after you explicitly click "Generate Messages." |

**Host permissions** are limited to:
- `https://www.linkedin.com/*` — so the content script can read the LinkedIn profile you are viewing.
- `https://api.deepseek.com/*` — so the Extension can call the DeepSeek API for message generation.

The Extension does NOT request: `tabs`, `cookies`, `webRequest`, `history`, `bookmarks`, `management`, or any other broad permission.

## User Control

You remain in full control at all times. The Extension **never**:

- Sends connection requests on your behalf
- Clicks LinkedIn buttons or UI elements
- Posts messages or content to LinkedIn
- Modifies your LinkedIn account or profile
- Operates automatically without your explicit action

Every AI-generated message must be reviewed and manually sent by you. The Extension is a drafting tool — it helps you write, but you decide what to send.

## Data We Collect and Store

### 1. Your Profile Information

- **What:** Your name, headline, company, school, professional background, networking goals, and interests.
- **How collected:** You can manually enter this information in Settings, or use the "Sync My LinkedIn Profile" feature which reads your own LinkedIn profile page text and uses AI to extract structured information.
- **Where stored:** Chrome local storage on your device.
- **Purpose:** Used as context for generating personalized connection messages.

### 2. Target Profile Information

- **What:** The name, headline, company, school, location, about section, and experience of the LinkedIn profile you are currently viewing.
- **How collected:** When you click "Generate Messages," the Extension reads the visible text of the LinkedIn profile page you have open in your browser. The Extension only accesses information that is already visible in your browser at the time you request message generation.
- **Where stored:** Temporarily in browser memory only. This data is NOT persisted to local storage. It is discarded after messages are generated.
- **Purpose:** Used as context for generating personalized connection messages.

### 3. DeepSeek API Key

- **What:** Your DeepSeek API key (starts with `sk-`).
- **How collected:** You enter it manually in Settings.
- **Where stored:** Chrome local storage on your device.
- **Purpose:** Used to authenticate requests required for AI message generation and profile refinement.
- **Security:** Your API key is used only to authenticate requests required for AI message generation. It is never shared with the developer or stored on developer-controlled servers.

### 4. Extension Settings

- **What:** Your preferred AI model name and temperature setting.
- **Where stored:** Chrome local storage on your device.
- **Purpose:** Used to configure AI message generation behavior.

## Data We Do NOT Collect

- **No analytics or tracking.** The Extension does not use Google Analytics, Mixpanel, or any other analytics service.
- **No cookies.** The Extension does not set or read cookies.
- **No browsing history.** The Extension does not track or store your browsing activity.
- **We only process the personal information described in this policy** and do not collect additional categories of personal information beyond what is listed above.
- **No data sold or shared.** We do not sell, rent, or share your data with any third party for marketing purposes.

## Third-Party Services

### DeepSeek API

- **What is sent:** Your profile information, the target profile's text, and your API key are sent directly from your browser to the DeepSeek API endpoint (`https://api.deepseek.com/v1`) to generate messages or refine your profile.
- **Who operates it:** DeepSeek (深度求索).
- **Data retention:** Governed by DeepSeek's own privacy policy and data retention practices. We encourage users to review [DeepSeek's Privacy Policy and Terms of Service](https://www.deepseek.com/) before using their API.
- **Your control:** You can stop sending data to DeepSeek at any time by not using the message generation feature, or by removing your API key from Settings.

### LinkedIn

- The Extension reads publicly visible profile information from LinkedIn pages you visit in your browser.
- The Extension only accesses information that is already visible in your browser at the time you request message generation.
- The Extension does NOT use LinkedIn's official API.
- The Extension does NOT scrape LinkedIn profiles in bulk or automatically. It only reads the page you are currently viewing when you explicitly click "Generate Messages," or when you explicitly request to sync your own profile.
- The Extension does NOT send any data back to LinkedIn.

## How to Delete Your Data

You can delete all Extension data at any time:

1. **Quick method:** Right-click the Extension icon in Chrome, then select "Remove from Chrome." Removing the extension typically removes locally stored extension data.
2. **Granular method:** Go to Chrome Settings > Extensions > LinkedIn AI Assistant > Details > "Storage" to see how much storage is used. Removing the extension clears all data.
3. **Manual method:** Open Chrome DevTools > Application > Local Storage > remove individual entries.

Depending on your browser configuration (e.g., Chrome Sync settings), you may also choose to clear extension storage manually to ensure all data is removed.

## Data Security

- All data is stored in Chrome's local storage, which is isolated per-extension and per-browser profile.
- Your API key is stored in plain text in local storage (Chrome does not provide encrypted storage for extensions). Anyone with physical access to your computer and browser profile could potentially access it. Do not use this Extension on shared or public computers.
- Do not install this Extension on managed enterprise devices unless permitted by your organization.
- API calls to DeepSeek are made over HTTPS, encrypting data in transit.

## Children's Privacy

This Extension is not directed to children under 16. We do not knowingly collect data from children. If you believe a child has provided data through this Extension, please contact us so we can delete it.

## LinkedIn Terms of Service Notice

This Extension is not affiliated with, endorsed by, or sponsored by LinkedIn. The Extension reads publicly visible information from LinkedIn pages for the user's own personal use. The Extension only accesses information that is already visible in your browser at the time you request message generation. Users are responsible for complying with LinkedIn's Terms of Service and User Agreement when using this Extension.

## Changes to This Policy

We may update this privacy policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. For significant changes, we will display a notice in the Extension.

## Disclaimer

This Extension is an independent productivity tool and is not affiliated with, endorsed by, or sponsored by LinkedIn or DeepSeek. Users are solely responsible for complying with the Terms of Service of any third-party platform they use in conjunction with this Extension.

## Contact

If you have questions about this privacy policy or the Extension's data practices, please contact:

- **Email:** stevenli2007@berkeley.edu
- **GitHub Issues:** [repository URL to be configured before publication]

---

*This privacy policy is provided as a Markdown document in the Extension's source code repository at `docs/PRIVACY_POLICY.md`. A standalone HTML version is bundled with the Extension at `privacy.html`.*
