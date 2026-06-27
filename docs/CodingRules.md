# CodingRules.md

## LinkedIn AI Networking Assistant — AI Coding Rules

---

## 1. Purpose

These rules govern how AI assistants (and any contributor) work on this codebase. They exist to prevent scope creep, protect finished work, and keep the project maintainable.

All rules are mandatory unless explicitly overridden by the user in writing.

---

## 2. Before Any Development Session

### 2.1 Read the Project Documents

Before writing or modifying any code, you must read:

- `docs/PRD.md` — Product requirements and feature boundaries.
- `docs/TechStack.md` — Approved technology stack and coding style.
- `docs/Database.md` — Data schema, storage keys, and naming conventions.
- `docs/Architecture.md` — Module responsibilities and data flow.
- `docs/Roadmap.md` — Current phase and project lifecycle.
- `docs/Decisions.md` — Active technical decisions.
- `docs/CodingRules.md` — This file.
- `docs/ReleasePlan.md` — Release strategy and constraints.
- `phases/PhaseNN_Done.md` — Reports for completed phases.

If a document is missing, ask the user before proceeding.

### 2.2 Confirm the Current Phase

You must know which phase is active and which phases are already done. Do not start work on a future phase before finishing the current one.

---

## 3. Code Modification Rules

### 3.1 Do Not Modify Completed Phases

- Once a phase is marked done and its `PhaseNN_Done.md` report is approved, you may not modify its code except to fix a blocking bug.
- A "blocking bug" means the extension cannot be built, loaded, or perform its core function.
- If a bug is found in a completed phase, the fix must be minimal, targeted, and documented in the current phase's Done Report.

### 3.2 Do Not Modify the Tech Stack

- The technology stack is defined in `docs/TechStack.md`.
- You may not change frameworks, build tools, languages, or major libraries without explicit user approval and an update to `docs/Decisions.md`.
- Minor version updates (e.g., patch releases) are allowed if they fix a security issue and do not break the build.

### 3.3 Do Not Add New Dependencies Without Approval

- Before installing any new npm package, explain why it is needed and what alternatives were considered.
- The user must approve the dependency before it is added.
- Prefer built-in browser APIs and existing dependencies over new ones.

### 3.4 Every Change Must Have a Reason

For every code change, you must be able to explain:

- What is being changed.
- Why it is necessary.
- Which requirement or decision it supports.
- What phase it belongs to.

If you cannot explain the reason, do not make the change.

### 3.5 Never Modify More Than One Module in a Single Task Unless Explicitly Approved

- A single task should focus on one module or one concern.
- If a change appears to require touching multiple modules, split it into separate tasks or ask the user for approval.
- This keeps reviews focused, reduces regression risk, and makes Done Reports easy to verify.

### 3.6 Every Completed Task Must Include Testing Steps

- Before marking a task complete, describe how it was tested.
- Testing steps may include: `npm run build`, manual browser test, console error check, popup interaction, content script verification, etc.
- If automated tests exist, run them and report results.
- A task without testing steps is not complete.

### 3.7 Never Rename Public Interfaces Without Approval

- Public interfaces include exported functions, components, storage keys, and API types that other modules depend on.
- Renaming these breaks other code and must be approved by the user.
- If a rename is truly necessary, create a migration plan and update all callers in the same task.

### 3.8 Never Assume Ambiguous Requirements. Ask Before Implementing

- If a requirement is unclear, incomplete, or conflicts with an existing document, ask the user before writing code.
- Do not guess. Do not implement the "most likely" interpretation.
- It is faster to clarify in chat than to revert and rewrite.

### 3.9 Follow the Existing Architecture

- New code must fit into the module structure defined in `docs/Architecture.md`.
- Do not bypass layers (e.g., do not call the LLM directly from the content script).
- Keep data flow unidirectional: LinkedIn Page → Content Script → Extractor → Parser → Prompt Builder → LLM → Response Parser → Popup UI → User.

### 3.10 No Silent Refactor

- You are prohibited from modifying modules that are unrelated to the current task, even if the goal is code optimization or cleanup.
- Refactoring is allowed only within the module that is the direct subject of the current phase or task.
- If you notice a code quality issue outside the current task, record it in `docs/KNOWN_ISSUES.md` or `phases/PhaseNN_Done.md` instead of silently fixing it.
- Violations of this rule make it impossible to review what changed and why.

### 3.11 Context Window Protection

- Before starting any development session, you must re-read the following documents in full:
  - `README.md`
  - `docs/PRD.md`
  - `docs/TechStack.md`
  - `docs/Database.md`
  - `docs/Architecture.md`
  - `docs/Roadmap.md`
  - `docs/Decisions.md` (all ADRs)
  - `docs/CodingRules.md` (this file)
  - `docs/ReviewChecklist.md`
  - `docs/ReleasePlan.md`
  - The current phase's `phases/PhaseNN_Done.md`
- You are not allowed to rely on conversation history or "memory" of previous sessions as a substitute for reading the documents.
- If a document has been updated since the last session, the most recent version on disk always takes precedence.

### 3.12 Diff First

- Before modifying any code, you must first state explicitly:
  1. Which files will be modified and why.
  2. Which modules or functions within those files will change.
  3. Which files or modules will **not** be modified.
- This explanation must be presented to the user and confirmed before any code change is made.
- The purpose of this rule is to prevent scope creep and give the user a clear chance to object before work begins.

---

## 4. Naming and Style Rules

### 4.1 camelCase Only

- Variables, functions, and storage keys use camelCase.
- Components use PascalCase.
- Folders use lowercase.

### 4.2 No Abbreviations

Use complete English words. Examples:

- ✅ `userProfile`, `currentCompany`, `targetHeadline`
- ❌ `uid`, `usr`, `company_name`

### 4.3 TypeScript Strictness

- Use TypeScript for all new code.
- Prefer explicit types over `any`.
- Run `npm run build` and fix all type errors before declaring work complete.

### 4.4 UI Style

- Minimal, Apple-style, clean white, rounded corners.
- No heavy shadows, no dark themes unless explicitly requested, no flashy animations.
- Keep the popup compact and focused on one primary task.

---

## 5. Phase Completion Rules

### 5.1 Each Phase Must Have a Done Report

When a phase is complete, create `phases/PhaseNN_Done.md` with:

1. Summary of what was built.
2. Files created or modified.
3. How the work was verified (manual steps, build success, etc.).
4. Known issues or limitations.
5. User approval sign-off.

### 5.2 No Phase Is Complete Without Review

A phase is not done until the user reviews and approves its Done Report. Do not start the next phase before that approval.

### 5.3 Commitment to the Current Phase

During a phase, avoid "quick additions" from other phases. If a new idea comes up, write it down as a future phase note instead of implementing it immediately.

---

## 6. Prohibited Behaviors

The following are never allowed:

- Automatically sending LinkedIn messages.
- Auto-clicking LinkedIn buttons.
- Scraping data beyond what is publicly visible on the profile page.
- Storing user data on external servers in V1.
- Adding tracking, analytics, or telemetry without explicit approval.
- Modifying code without explaining the reason.
- Skipping the Done Report.

---

## 7. When in Doubt

If you are unsure about a change, ask the user. It is better to pause and clarify than to violate these rules.
