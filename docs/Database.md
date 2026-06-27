# Database.md

## UserProfile

| Field            | Type   | Description       |
| ---------------- | ------ | ----------------- |
| userName         | string | User's full name  |
| userHeadline     | string | User's headline   |
| userSchool       | string | User's school     |
| userCompany      | string | User's company    |
| userBackground   | string | User's background |
| userGoals        | string | User's goals      |
| userInterests    | string | User's interests  |

---

## TargetProfile

| Field            | Type   | Description            |
| ---------------- | ------ | ---------------------- |
| targetName       | string | Target's full name     |
| targetHeadline   | string | Target's headline      |
| targetSchool     | string | Target's school        |
| targetCompany    | string | Target's company       |
| targetLocation   | string | Target's location      |
| targetAbout      | string | Target's about section |
| targetExperience | string | Target's experience    |

---

## Prompt

| Field           | Type   | Description                    |
| --------------- | ------ | ------------------------------ |
| systemPrompt    | string | System-level instruction       |
| userPrompt      | string | User-level instruction         |
| generatedPrompt | string | Final combined prompt sent to LLM |

---

## GeneratedMessage

| Field          | Type   | Description              |
| -------------- | ------ | ------------------------ |
| messageId      | string | Unique message ID        |
| messageStyle   | string | professional / friendly / entrepreneur / academic |
| messageContent | string | The generated message    |
| generatedTime  | number | Unix timestamp           |

---

## Settings

| Field         | Type   | Description              |
| ------------- | ------ | ------------------------ |
| selectedModel | string | e.g. deepseek-chat       |
| temperature   | number | LLM temperature (0–1)    |
| language      | string | Output language          |

---

## Chrome Storage Keys

| Key            | Description                        |
| -------------- | ---------------------------------- |
| userProfile    | Stores the UserProfile object      |
| settings       | Stores the Settings object         |
| messageHistory | Stores array of GeneratedMessage   |

---

## Naming Convention

- camelCase only
- No snake_case
- No abbreviations
- Always use complete English words

✅ Correct: `userProfile`, `currentCompany`, `targetHeadline`

❌ Incorrect: `uid`, `usr`, `company_name`
