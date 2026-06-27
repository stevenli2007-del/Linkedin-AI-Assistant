# Architecture.md

## Overview

LinkedIn AI Networking Assistant is a Chrome MV3 extension that generates
personalized LinkedIn connection messages using AI. The extension supports two
API modes:

- **Shared Mode**: Use the extension owner's API key (via backend proxy)
- **Custom Mode**: Use your own DeepSeek API key

All AI requests go through a backend proxy (Cloudflare Workers) to support
future SaaS features, rate limiting, and API key management.

---

## Data Flow

### Flow 1: Generate Connection Messages (Phase 09+)

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
LLM Service calls Backend Proxy API (with exponential backoff retry)
      |
      v
Backend Proxy calls AI Provider (DeepSeek API or custom key)
      |
      v
Backend Proxy returns JSON response to Extension
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
LLM Service calls Backend Proxy API
      |
      v
Backend Proxy calls AI Provider
      |
      v
Backend Proxy returns structured UserProfile
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
| LLM Service        | services/llm.ts          | Call Backend Proxy API with retry + backoff, parse JSON responses           |
| Client ID Service  | services/client-id.ts    | Generate and persist anonymous Client ID (UUID) in Chrome Storage          |
| Settings Service   | services/settings.ts     | Load/save settings, manage import-pending flags and raw text transfer       |
| Popup UI           | popup/App.tsx            | Main UI: generate messages, display results, onboarding guide, footer      |
| Settings UI        | popup/Settings.tsx       | API mode selector, API key, profile fields, LinkedIn import, FAQ            |
| Error Boundary     | popup/ErrorBoundary.tsx  | Catch and display uncaught React render errors                              |
| Background Worker  | background/index.ts      | Service worker (Chrome MV3) — handles extension lifecycle events            |
| Types              | types/index.ts           | Shared TypeScript interfaces (UserProfile, TargetProfile, etc.)             |

### Backend Proxy (Cloudflare Workers)

| Module             | File(s)                              | Responsibility                                                              |
| ------------------ | ------------------------------------ | --------------------------------------------------------------------------- |
| Worker Entry       | backend/src/index.ts                 | Request routing, CORS, rate limiting, request context builder              |
| Provider Factory   | backend/src/services/provider-factory.ts | Create AI provider instance based on configuration                     |
| DeepSeek Provider  | backend/src/services/providers/deepseek.ts | DeepSeek API integration (OpenAI-compatible)                       |
| Generate Route     | backend/src/routes/generate.ts       | POST /api/v1/generate endpoint                                             |
| Refine Profile Route | backend/src/routes/refine-profile.ts | POST /api/v1/refine-profile endpoint                                     |
| Rate Limiter       | backend/src/middleware/rate-limiter.ts | Rate limiting middleware (10 req/min per client)                        |
| Error Handler      | backend/src/middleware/error-handler.ts | Unified error handling with error codes                                |
| Response Utils     | backend/src/utils/response.ts        | successResponse(), errorResponse() with errorCode support                  |

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

## LLM Service (Backend Proxy API)

- **Endpoint:** `https://linkedin-ai-backend.stevenli2007.workers.dev/api/v1/generate`
- **Protocol:** HTTP POST with JSON body
- **Model:** Configured in backend (currently DeepSeek)
- **Retry:** Exponential backoff for 429/500/502/503/timeout/network errors
  - Max 3 retries with 1s -> 2s -> 4s delays
  - No retry for 401 (invalid key) or 402 (insufficient balance)
- **Timeout:** 30 seconds per request
- **Response parsing:** Handles backend response format, validates message styles
- **API Modes:**
  - `shared`: Use backend's API key (no setup needed)
  - `custom`: Use user's own DeepSeek API key (sent via X-Custom-Api-Key header)

---

## Security Architecture

| Layer                  | Measure                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| Content Security Policy| `script-src 'self'; object-src 'self'` (no inline scripts, no eval)  |
| Host Permissions       | `linkedin.com` + `linkedin-ai-backend.stevenli2007.workers.dev` only |
| Content Script Scope   | `https://www.linkedin.com/*` and `https://linkedin.com/*` only       |
| API Key Storage        | `chrome.storage.local` — only used in custom mode                   |
| Shared Mode            | API key stored on backend (Cloudflare Workers secrets)              |
| No Auto-Send           | User always copies message and sends manually                        |
| No Analytics           | No tracking, no telemetry, no third-party scripts                    |
| web_accessible_resources | None — privacy.html opens as an extension page via `chrome.tabs.create` |
| Rate Limiting          | 10 requests/minute per Client ID (Cloudflare KV)                    |
| Request Logging        | Request metadata logged (no user privacy data)                       |

---

## Background Service Worker

Minimal — registers `chrome.runtime.onInstalled` listener for extension
lifecycle events. Future use: offline message queue, push notifications.

---

## Backend Proxy Architecture (Phase 09)

### Cloudflare Workers Deployment

- **URL:** `https://linkedin-ai-backend.stevenli2007.workers.dev`
- **API Version:** `/api/v1/`
- **Endpoints:**
  - `POST /api/v1/generate` — Generate AI messages
  - `POST /api/v1/refine-profile` — Refine LinkedIn profile
  - `GET /health` — Health check

### Provider Abstraction

The backend uses a provider abstraction pattern to support multiple AI providers:

```typescript
interface AIProvider {
  generate(request, customApiKey?): Promise<GenerateResponse>;
  refineProfile(request, customApiKey?): Promise<RefineProfileResponse>;
}
```

Currently implemented: `DeepSeekProvider`

Future: OpenAI, Claude, local models

### Rate Limiting

- **Storage:** Cloudflare KV (`RATE_LIMIT_STORE`)
- **Limit:** 10 requests/minute per Client ID
- **Response:** HTTP 429 with `errorCode: "RATE_LIMITED"`

### Error Handling

All errors return JSON with `errorCode`:

- `INVALID_REQUEST` (400) — Bad request format
- `UNAUTHORIZED` (401) — Invalid API key
- `RATE_LIMITED` (429) — Rate limit exceeded
- `MODEL_ERROR` (502) — AI provider error
- `TIMEOUT` (504) — Request timeout
- `INTERNAL_ERROR` (500) — Internal server error

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

4. **Backend Proxy (Phase 09)** — All AI requests go through Cloudflare Workers
   to support shared API mode, rate limiting, and future SaaS features.
   Provider abstraction allows easy addition of new AI models.

5. **Anonymous Client ID** — Each extension instance generates a UUID stored in
   Chrome Storage, used for rate limiting and analytics (no PII).
