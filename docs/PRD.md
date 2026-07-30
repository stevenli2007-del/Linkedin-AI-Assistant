# PRD.md
# LinkedIn AI Networking Assistant

## 1. Product Vision

LinkedIn networking is one of the most important ways for students, researchers, founders, and professionals to build valuable relationships.

However, writing personalized connection requests is repetitive and time-consuming.

This extension aims to help users generate high-quality, personalized LinkedIn connection messages with one click.

The user remains in full control and decides which message to send.

---

## 2. Target Users

Primary Users

- University students
- Researchers
- Startup founders
- Job seekers
- Venture Capital networking
- Professionals expanding their network

---

## 3. MVP Goal (Version 1.0)

When visiting a LinkedIn profile,

the extension should:

1. Detect the profile page.
2. Extract publicly visible profile information.
3. Combine
   - User Profile
   - Target Profile
4. Send them to an LLM.
5. Generate four different connection messages.
6. Display them inside the extension.
7. Allow the user to:
   - Copy
   - Edit
   - Regenerate

No automatic sending.

---

## 4. Core Features

### Feature 1 — Detect LinkedIn Profile Page

### Feature 2 — Extract Profile Information

Including:

- Name
- Headline
- Current Company
- Current School
- About
- Experience (optional)

---

### Feature 3 — User Profile Management

The extension stores:

- My Name
- My Background
- My Interests
- My Goals

This information only needs to be entered once.

---

### Feature 4 — Prompt Builder

Automatically combine

User Background + Target Background

into one prompt.

---

### Feature 5 — LLM Message Generation

Generate

- Version A — Professional
- Version B — Friendly
- Version C — Entrepreneur
- Version D — Research / Academic

---

### Feature 6 — Message Preview

User can:

- Copy
- Edit
- Regenerate

---

## 5. Non Goals (Not included in V1)

- ❌ Automatically send messages
- ❌ Auto click buttons
- ❌ CRM
- ❌ Analytics Dashboard
- ❌ Cloud Sync
- ❌ Multiple Languages

---

## 6. Success Criteria

- The user can generate four personalized connection messages within 5 seconds.
- The generated messages should feel natural and personalized.
- The user should only need one click after opening the extension.

---

## 7. Future Directions (V2+)

The following features are explicitly **out of scope for V1** but are documented here for long-term planning. They are assigned to future phases in `docs/Roadmap.md`.

### 7.1 Message Refinement & Preference Memory (v1.1.0)

- Users can refine any generated message by entering a custom prompt (e.g., "make it shorter", "more casual").
- The AI returns an improved version of the message within the user's character limit.
- Refinement prompts are saved and injected into future message generation, creating a personalized preference memory over time.
- **Status:** Planned for Phase 10-3-8-P1/P2/P3.
- **Note:** This is not full RAG (no vector database); it is a lightweight preference accumulation mechanism. True RAG remains a Phase 13 goal.

### 7.2 Premium Content Generation (Phase 14)

- **Expanded Message Options:** Increase from 4 free styles to 8 total (4 free + 4 premium). Premium styles may include Direct/Concise, Storytelling, Humorous/Warm, and Industry-Specific.
- **AI LinkedIn Post Generation:** Premium users can upload an image and the AI generates a full LinkedIn post (not just a connection message) based on the image content and user context.
- **Subscription System:** Freemium model — free tier retains core features; premium tier unlocks expanded options and Post generation.
- **Monetization decision:** See `docs/Decisions.md` ADR-015.

### 7.3 Mobile App (Phase 15)

- Bring the LinkedIn AI Assistant to mobile devices (iOS/Android).
- Cross-device sync of user profile, settings, and refinement memory.
- **Priority decision:** See `docs/Decisions.md` ADR-016. Deferred until desktop product-market fit is validated.

### 7.4 SaaS Transformation (Phase 13)

- User account system with subscription tiers.
- True RAG memory (vector database, semantic retrieval of past interactions).
- Cloud history sync across devices.
- Analytics dashboard (success rate tracking, style effectiveness).
- **Partial fulfillment:** Preference Memory (7.1) fulfills a subset of the RAG goal. Full RAG requires vector database infrastructure.

---

## 8. V1 Scope Summary

| Feature | V1 (Free) | V2+ (Premium) |
|---------|-----------|---------------|
| Message styles | 4 | 8 (4 free + 4 paid) |
| Copy / Edit / Regenerate | ✅ | ✅ |
| Message Refinement | ✅ (v1.1.0) | ✅ |
| Preference Memory | ✅ (v1.1.0) | ✅ (advanced) |
| AI LinkedIn Post generation | ❌ | ✅ (paid) |
| Image upload | ❌ | ✅ (paid) |
| Cloud sync | ❌ | ✅ (Phase 13) |
| Mobile app | ❌ | ✅ (Phase 15) |
| Automatic sending | ❌ Never | ❌ Never |
