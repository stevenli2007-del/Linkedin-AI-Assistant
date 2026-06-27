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
