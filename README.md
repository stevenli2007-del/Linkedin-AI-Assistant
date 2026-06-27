# LinkedIn AI Networking Assistant

> Generate personalized LinkedIn connection messages in one click, powered by AI.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)

---

## What It Does

LinkedIn AI Networking Assistant helps you write better LinkedIn connection
requests. Open any LinkedIn profile, click "Generate Messages," and the
extension produces four personalized connection messages in different styles:

- **Professional** — Formal, respectful, career-focused
- **Friendly** — Warm, casual, conversational
- **Entrepreneur** — Direct, ambitious, opportunity-focused
- **Academic** — Scholarly, intellectual, research-oriented

Each message highlights common ground between you and the target person (same
school, same company, shared industry, etc.) to maximize acceptance rates.

**You stay in control** — the extension never sends anything automatically.
You review, edit if needed, copy, and paste into LinkedIn yourself.

---

## Features

- **One-click generation** — Extracts the target profile and generates 4 messages instantly
- **Common ground analysis** — AI identifies shared schools, companies, and interests
- **Copy / Edit / Regenerate** — Fine-tune any message before sending
- **Auto-import your profile** — Sync your LinkedIn profile with AI refinement
- **4 message styles** — Professional, Friendly, Entrepreneur, Academic
- **Privacy-first** — API key stored locally, no analytics, no tracking
- **No auto-send** — You always review and send manually

---

## Installation

### Option A: Developer Mode (for testing)

1. Download or clone this repository
2. Run `npm install && npm run build`
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable **Developer mode** (top-right toggle)
5. Click **Load unpacked** and select the `dist/` folder
6. The extension icon appears in your toolbar

### Option B: Chrome Web Store (coming soon)

The extension will be published to the Chrome Web Store after beta testing.

---

## Setup

1. **Get a DeepSeek API Key**
   - Visit [platform.deepseek.com](https://platform.deepseek.com)
   - Sign up and generate an API key (starts with `sk-`)

2. **Open the extension**
   - Click the extension icon in your Chrome toolbar

3. **Configure Settings**
   - Click **Settings**
   - Paste your DeepSeek API Key
   - Fill in your profile (name, headline, company, school, background)
   - Optionally: Click **Sync My LinkedIn Profile** to auto-import with AI refinement
   - Click **Save Settings**

---

## Usage

1. Navigate to any LinkedIn profile page (`linkedin.com/in/...`)
2. Click the extension icon
3. Click **Generate Messages**
4. Review the 4 generated messages
5. Click **Copy** on your preferred message
6. Paste it into LinkedIn's connection request note

You can also:
- Click **Edit** to modify a message before copying
- Click **Regenerate** to get a new version of any style

---

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| UI Framework   | React + TypeScript                  |
| Styling        | Tailwind CSS                        |
| Build Tool     | Vite 5                              |
| Extension API  | Chrome Manifest V3                  |
| LLM            | DeepSeek API (deepseek-chat)        |
| Storage        | Chrome Local Storage                |
| Backend        | None (V1 — planned for Phase 09)   |

---

## Project Structure

```
src/
├── background/index.ts        # Service worker (reserved for Phase 09)
├── content/
│   ├── extractor.ts           # LinkedIn profile extraction
│   └── index.ts               # Content script entry point
├── popup/
│   ├── App.tsx                # Main UI (generate + display)
│   ├── Settings.tsx           # Settings + import + FAQ
│   ├── ErrorBoundary.tsx      # Error handling
│   └── main.tsx               # React entry
├── services/
│   ├── llm.ts                 # DeepSeek API client (retry + backoff)
│   ├── prompt.ts              # Prompt builder
│   └── settings.ts            # Chrome Storage helpers
└── types/index.ts             # Shared TypeScript interfaces

docs/                          # Project governance documents
phases/                        # Phase done reports
public/                        # manifest.json, icons, privacy.html
```

---

## Development

### Prerequisites

- Node.js 18+
- npm

### Build

```bash
npm install
npm run build
```

The built extension is in `dist/`. Load it via `chrome://extensions/` in
Developer mode.

### Development Server

```bash
npm run dev
```

This starts Vite's dev server for the popup UI. For content script and
background worker changes, rebuild and reload the extension.

---

## Privacy

- Your DeepSeek API key is stored in Chrome's local storage and only sent to
  the DeepSeek API. It never touches any other server.
- Profile data is processed in your browser and sent to DeepSeek for message
  generation. No data is stored on any external server.
- No analytics, no tracking, no third-party scripts.
- See [Privacy Policy](public/privacy.html) for full details.

---

## Project Governance

This project follows a structured phase-based development process. Key documents:

| Document | Purpose |
|----------|---------|
| [docs/PRD.md](docs/PRD.md) | Product requirements and scope |
| [docs/Roadmap.md](docs/Roadmap.md) | Development roadmap (MVP + Production tracks) |
| [docs/Architecture.md](docs/Architecture.md) | System architecture and data flow |
| [docs/TechStack.md](docs/TechStack.md) | Technology choices |
| [docs/Database.md](docs/Database.md) | Data shapes and storage keys |
| [docs/CodingRules.md](docs/CodingRules.md) | Development rules |
| [docs/Decisions.md](docs/Decisions.md) | Architecture Decision Records |
| [docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md) | Privacy policy |
| [docs/TERMS_OF_USE.md](docs/TERMS_OF_USE.md) | Terms of use |

---

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 0–7   | Done   | MVP (scaffold, extractor, LLM, UI, settings, auto-import) |
| 08    | Done   | Production Readiness (security, privacy, store assets) |
| 09    | Next   | Backend Proxy (secure API key handling) |
| 10    | Planned| Beta Testing |
| 11    | Planned| Chrome Web Store Release |
| 12    | Planned| Growth |

See [docs/Roadmap.md](docs/Roadmap.md) for details.

---

## Contact

- **Support:** stevenli2007@berkeley.edu
- **Bug Reports:** Open an issue in this repository

---

## License

MIT License — see [LICENSE](LICENSE) for details (or contact the author if no
LICENSE file is present).
