# Architecture.md

## Overview

LinkedIn AI Networking Assistant is a Chrome MV3 extension that generates
personalized LinkedIn connection messages using the DeepSeek API. The extension
runs entirely client-side — no backend, no analytics, no tracking.

---

## Data Flow

### Flow 1: Generate Connection Messages

```
User clicks "Generate Messages" in Popup
      |
      v
Popup sends EXTRACT_PROFILE message to Content Script (chrome.tabs.sendMessage)
      |
      v
Content Script extracts TargetProfile from LinkedIn DOM
      |
      v
Popup receives TargetProfile, calls Prompt Builder
      |
      v
Prompt Builder combines UserProfile + TargetProfile into system/user prompts
      |
      v
LLM Service calls DeepSeek API (with exponential backoff retry)
      |
      v
LLM Service parses JSON response into 4 GeneratedMessages
      |
      v
Popup displays messages — user can Copy, Edit, or Regenerate
      |
      v
User copies message and sends manually on LinkedIn (no auto-send)
```

### Flow 2: Auto-Import Own Profile (Phase 6 + 7)

```
User clicks "Sync My LinkedIn Profile" in Settings
      |
      v
Settings sets importMyProfilePending flag in Chrome Storage (60s TTL)
      |
      v
Settings opens linkedin.com/in/me/ in a new tab
      |
      v
LinkedIn redirects /in/me/ -> /in/[actual-profile-url]
      |
      v
Content Script detects profile page, checks importMyProfilePending flag
      |
      v
Content Script dumps raw profile text -> pendingRawProfileText in Storage
      |
      v
Settings detects pendingRawProfileText via storage.onChanged listener
      |
      v
Settings sends raw text to LLM Service for refinement (refineProfile)
      |
      v
LLM returns structured UserProfile
      |
      v
Settings displays AI-refined profile preview for user review
      |
      v
User clicks "Apply" -> profile saved to appSettings
```

---

## Module Responsibilities

| Module             | File(s)                  | Responsibility                                                              |
| ------------------ | ------------------------ | --------------------------------------------------------------------------- |
| Content Script     | content/index.ts         | Detect LinkedIn profile page, handle EXTRACT_PROFILE message, auto-import   |
| Profile Extractor  | content/extractor.ts     | Read visible profile data from DOM (multiple selector strategies + retry)   |
| Prompt Builder     | services/prompt.ts       | Build prompts for message generation and profile refinement                 |
| LLM Service        | services/llm.ts          | Call DeepSeek API with retry + backoff, parse JSON responses                |
| Settings Service   | services/settings.ts     | Load/save settings, manage import-pending flags and raw text transfer       |
| Popup UI           | popup/App.tsx            | Main UI: generate messages, display results, onboarding guide, footer      |
| Settings UI        | popup/Settings.tsx       | API key, model/temperature, profile fields, LinkedIn import, FAQ            |
| Error Boundary     | popup/ErrorBoundary.tsx  | Catch and display uncaught React render errors                              |
| Background Worker  | background/index.ts      | Service worker (Chrome MV3) — reserved for Phase 09 backend proxy           |
| Types              | types/index.ts           | Shared TypeScript interfaces (UserProfile, TargetProfile, etc.)             |

---

## File Structure (Actual)

```
src/
├── background/
│   └── index.ts            # Service worker — reserved for Phase 09
├── content/
│   ├── extractor.ts        # Profile extraction (multi-selector + async retry)
│   └── index.ts            # Content script entry (message listener + auto-import)
├── popup/
│   ├── App.tsx             # Main popup: generate + display + onboarding
│   ├── Settings.tsx        # Settings page: API key, profile, import, FAQ
│   ├── ErrorBoundary.tsx   # React error boundary
│   ├── main.tsx            # React entry point
│   ├── index.html          # Popup HTML template
│   └── index.css           # Global styles (Tailwind directives)
├── services/
│   ├── llm.ts              # DeepSeek API client (retry, backoff, parsing)
│   ├── prompt.ts           # Prompt builder (messages + profile refinement)
│   └── settings.ts         # Chrome Storage helpers (settings, import flags)
├── types/
│   └── index.ts            # Shared interfaces
└── vite-env.d.ts           # Vite type declarations
```

### Build Output

```
dist/
├── manifest.json           # Copied from public/
├── popup.html              # Renamed from src/popup/index.html by post-build plugin
├── popup.js                # Bundled React app (plain JS, no ES modules)
├── content.js              # Bundled content script (standalone IIFE)
├── background.js           # Bundled service worker
├── privacy.html            # Privacy policy page
└── icons/                  # Extension icons (16/32/48/128px)
```

> **Note:** Content script and background worker are bundled as plain JS (not ES
> modules) because Chrome MV3 service workers and classic script tags do not
> support ES module imports. Vite handles this via separate entry points.

---

## Chrome Storage Schema

| Key                      | Type                      | Description                                          |
| ------------------------ | ------------------------- | ---------------------------------------------------- |
| `appSettings`            | AppSettings               | User profile, API key, model, temperature            |
| `importMyProfilePending` | ImportPendingState \| null | Auto-import flag with 60s TTL                       |
| `pendingRawProfileText`  | string                    | Raw LinkedIn profile text awaiting AI refinement     |

### AppSettings Shape

```typescript
interface AppSettings {
  userProfile: UserProfile;  // User's own profile (name, headline, school, etc.)
  apiKey: string;            // DeepSeek API key (stored locally, never transmitted except to DeepSeek)
  model: string;             // DeepSeek model name (default: "deepseek-chat")
  temperature: number;       // LLM temperature 0–2 (default: 0.7)
}
```

---

## Message Types

| Message Type       | Direction               | Purpose                                    |
| ------------------ | ----------------------- | ------------------------------------------ |
| `EXTRACT_PROFILE`  | Popup -> Content Script | Request target profile extraction from tab |

---

## LLM Service (DeepSeek API)

- **Endpoint:** `https://api.deepseek.com/v1/chat/completions`
- **Protocol:** OpenAI-compatible Chat Completions format
- **Model:** Configurable (default: `deepseek-chat`)
- **Retry:** Exponential backoff for 429/500/502/503/timeout/network errors
  - Max 3 retries with 1s -> 2s -> 4s delays
  - No retry for 401 (invalid key) or 402 (insufficient balance)
- **Timeout:** 30 seconds per request
- **Response parsing:** Handles markdown code-fenced JSON, validates message styles

---

## Security Architecture

| Layer                  | Measure                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| Content Security Policy| `script-src 'self'; object-src 'self'` (no inline scripts, no eval)  |
| Host Permissions       | `linkedin.com` + `api.deepseek.com` only                             |
| Content Script Scope   | `https://www.linkedin.com/*` and `https://linkedin.com/*` only       |
| API Key Storage        | `chrome.storage.local` — never transmitted except to DeepSeek API    |
| No Auto-Send           | User always copies message and sends manually                        |
| No Analytics           | No tracking, no telemetry, no third-party scripts                    |
| web_accessible_resources | None — privacy.html opens as an extension page via `chrome.tabs.create` |

---

## Background Service Worker

Currently minimal — only registers `chrome.runtime.onInstalled` listener.
Reserved for Phase 09 (Backend Proxy) which will add API key proxying to
avoid exposing user API keys in client-side code.

---

## Key Design Decisions

1. **Content script bundles as standalone IIFE** — Storage helpers are inlined
   in `content/index.ts` rather than imported from `services/settings.ts`,
   because Vite emits ES-module chunks that Chrome executes as classic scripts.

2. **Raw text dump over CSS selector parsing (Phase 7)** — Instead of fragile
   CSS selectors that break on LinkedIn layout changes, the auto-import flow
   dumps all visible text and lets the LLM parse it into structured fields.

3. **Import-pending guard (Phase 08 Critical Fix)** — The content script checks
   `importMyProfilePending` before dumping profile text, preventing automatic
   scraping on every LinkedIn profile visit.
