# Database.md

## Data Storage

All data is stored in **Chrome Local Storage** (`chrome.storage.local`).
No backend database in V1.

---

## TypeScript Interfaces

### UserProfile

| Field            | Type   | Description                |
| ---------------- | ------ | -------------------------- |
| userName         | string | User's full name           |
| userHeadline     | string | User's headline / title    |
| userSchool       | string | User's school(s)           |
| userCompany      | string | User's current company     |
| userBackground   | string | Professional background    |
| userGoals        | string | Networking goals           |
| userInterests    | string | Interests / topics         |

### TargetProfile

| Field            | Type   | Description                |
| ---------------- | ------ | -------------------------- |
| targetName       | string | Target's full name         |
| targetHeadline   | string | Target's headline          |
| targetSchool     | string | Target's school(s)         |
| targetCompany    | string | Target's company           |
| targetLocation   | string | Target's location          |
| targetAbout      | string | Target's about section     |
| targetExperience | string | Target's experience        |

### AppSettings

| Field         | Type       | Description                              |
| ------------- | ---------- | ---------------------------------------- |
| userProfile   | UserProfile| User's own profile                       |
| apiKey        | string     | DeepSeek API key (sk-...)                |
| apiMode       | string     | API mode: "shared" or "custom" (default: "shared") |
| model         | string     | Model name (default: "deepseek-chat")    |
| temperature   | number     | LLM temperature 0–2 (default: 0.7)       |

### GeneratedMessage

| Field          | Type   | Description                                        |
| -------------- | ------ | -------------------------------------------------- |
| messageId      | string | Unique ID (msg_timestamp_random)                   |
| messageStyle   | string | professional / friendly / entrepreneur / academic  |
| messageContent | string | The generated message text                         |
| generatedTime  | number | Unix timestamp (ms)                                |

### MessageStyle

```typescript
type MessageStyle = "professional" | "friendly" | "entrepreneur" | "academic";
```

### PromptPayload

| Field           | Type   | Description                        |
| --------------- | ------ | ---------------------------------- |
| systemPrompt    | string | System-level instruction           |
| userPrompt      | string | User-level instruction             |
| generatedPrompt | string | Combined prompt (system + user)    |

---

## Chrome Storage Keys

| Key                       | Type                       | Description                                     |
| ------------------------- | -------------------------- | ----------------------------------------------- |
| `appSettings`             | AppSettings                | User profile, API key, apiMode, model, temperature |
| `clientId`                | string                     | Anonymous Client ID (UUID v4, generated on first install) |
| `importMyProfilePending`  | ImportPendingState \| null | Auto-import flag (60s TTL)                      |
| `pendingRawProfileText`   | string                     | Raw LinkedIn text awaiting AI refinement        |

### ImportPendingState

| Field      | Type    | Description                              |
| ---------- | ------- | ---------------------------------------- |
| pending    | true    | Always true when set                     |
| startedAt  | number  | Timestamp when import was triggered      |

> The `pending` flag expires after 60 seconds. The content script checks this
> flag before dumping profile text, preventing automatic scraping on every
> LinkedIn profile visit.

---

## Naming Convention

- **camelCase** only for variables, functions, and storage keys
- **PascalCase** for TypeScript interfaces and React components
- **lowercase** for folders
- No abbreviations — always use complete English words

| Correct              | Incorrect              |
| -------------------- | ---------------------- |
| `userProfile`        | `user_profile`         |
| `targetHeadline`     | `tgtHeadline`          |
| `appSettings`        | `app_settings`         |
| `importMyProfilePending` | `import_pending`    |
