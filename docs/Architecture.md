# Architecture.md

## Data Flow

```
LinkedIn Page
      ↓
Content Script
      ↓
Profile Extractor
      ↓
Profile Parser
      ↓
Prompt Builder
      ↓
LLM Service
      ↓
Response Parser
      ↓
Popup UI
      ↓
User
```

---

## Module Responsibilities

| Module            | Responsibility                        |
| ----------------- | ------------------------------------- |
| Content Script    | Detect LinkedIn profile page          |
| Profile Extractor | Read visible profile data             |
| Prompt Builder    | Combine user profile + target profile |
| LLM Service       | Send prompt to GPT                    |
| Response Parser   | Parse returned messages               |
| Popup UI          | Display and copy messages             |

---

## File Structure (Planned)

```
src/
├── background/         # Service worker (Chrome MV3)
├── content/            # Content scripts injected into LinkedIn
│   ├── extractor.ts    # Profile Extractor
│   └── parser.ts       # Profile Parser
├── popup/              # React popup UI
│   ├── components/     # UI components (PascalCase)
│   └── pages/          # Popup pages
├── services/
│   ├── llm.ts          # LLM Service (DeepSeek API)
│   └── prompt.ts       # Prompt Builder
├── storage/            # Chrome Storage helpers
└── types/              # Shared TypeScript types
```
