# LinkedIn AI Networking Assistant — Chrome Extension

> Generate personalized LinkedIn connection messages in one click, powered by GPT.

---

## Project Conventions

Every development decision must align with these five documents:

| Doc | What it governs |
|-----|-----------------|
| [docs/PRD.md](docs/PRD.md) | Product vision, features, and what is OUT of scope |
| [docs/TechStack.md](docs/TechStack.md) | React + TypeScript + Tailwind + Vite + Chrome MV3 |
| [docs/Database.md](docs/Database.md) | Data shapes and Chrome Storage key naming |
| [docs/Architecture.md](docs/Architecture.md) | Module boundaries and data flow |
| [docs/Phase.md](docs/Phase.md) | Phase-by-phase build plan with entry/exit criteria |

---

## Quick Rules

- **Language**: TypeScript everywhere
- **Naming**: camelCase variables, PascalCase components, lowercase folders
- **UI**: Minimal, Apple-style, clean white, rounded corners
- **Storage**: Chrome Local Storage only (no backend in V1)
- **LLM**: Direct OpenAI API call from the extension (no proxy in V1)
- **No auto-send**: User always clicks to send — we never touch the LinkedIn send button

---

## Status

- [x] Phase 0 — Project docs & conventions
- [x] Phase 1 — Project scaffold (Vite + React + Chrome MV3)
- [ ] Phase 2 — Profile extractor (content script)
- [ ] Phase 3 — OpenAI API integration
- [ ] Phase 4 — Message selection UI
- [ ] Phase 5 — Settings page + polish
