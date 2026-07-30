# Alex's Prompt System (Experimental — Not Wired In)

Experimental prompt-management scaffold by Alex.
NOT connected to the live generation pipeline.

- loader.ts  — loads prompts from .md files (dead code, never called)
- system/    — system prompt variants: default, linkedin, recruiter
- templates/ — connect_library.md (50 role templates), summary.md

Live prompt logic: src/services/prompt.ts (frontend).
Retained as reference for future backend prompt management (Phase 13/14).
