# Summary Template

Purpose:
This template guides the model to generate concise, structured summaries of LinkedIn profiles, posts, or conversations for use in RAG (retrieval-augmented generation) scenarios.

Variables:
- {{target_name}}
- {{company}}
- {{role}}
- {{industry}}
- {{mutual_interest}}
- {{reason}}
- {{profile_summary}}

Constraints:
- Maximum length: 300 characters unless otherwise specified.
- Tone: professional, neutral, and concise.
- Output: plain text only (no markdown, titles, or extraneous commentary) unless a sectioned format is requested.

Instructions (single-paragraph summary):
- Begin with a short phrase identifying the subject: e.g., "{{target_name}} — {{role}} at {{company}}." Keep this under 60 characters.
- Summarize core expertise or focus area using {{industry}} and {{profile_summary}} in one clause.
- Mention one relevant mutual interest or recent activity: {{mutual_interest}}.
- State the reason for outreach succinctly using {{reason}}.
- End with a suggested conversational hook or CTA (e.g., "Would you be open to connect?").

Example (single-paragraph, ≤300 chars):
"{{target_name}} — {{role}} at {{company}}. Experienced in {{industry}} focusing on {{profile_summary}}; recently shared insights on {{mutual_interest}}. Reaching out to discuss {{reason}}. Would you be open to connect?"

Optional: Sectioned summary (use when more structure is needed; still keep total ≤300 chars unless overridden)
- Snapshot: "{{target_name}} — {{role}} at {{company}}"
- Expertise: one-line summary from {{profile_summary}} and {{industry}}
- Recent: one-line note on {{mutual_interest}}
- Outreach: one-line reason + CTA

Examples (sectioned):
Snapshot: {{target_name}} — {{role}} at {{company}}
Expertise: {{profile_summary}} in {{industry}}
Recent: Engaged on {{mutual_interest}}
Outreach: Connect to discuss {{reason}}?

Usage notes for RAG and LLM:
- Use single-paragraph mode for in-line prompts and compact context windows.
- Use sectioned mode when downstream tooling expects labeled fields.
- Always respect the character limit; if input content is long, prioritize key facts (role, company, one expertise point, one mutual interest, and reason).
- Prefer active verbs and specific nouns (e.g., "led ML initiatives" vs "experience with ML").

Edge cases:
- Missing fields: omit clauses gracefully; do not insert placeholders as literal text in the final output.
- Multiple mutual interests: pick the most recent or most relevant one.
- Ambiguous profile_summary: choose the clearest single phrase summarizing the primary skill or focus.

Quality checklist (for generated summaries):
- Is the subject identified (name + role/company)?
- Is expertise summarized in one clear clause?
- Is there a mutual interest or trigger referenced?
- Is the outreach reason included and actionable?
- Does the final text end with a CTA or conversational hook?

Developer note:
- This template is safe to reuse for different genres; adapt phrasing for tone (more formal for executives, more casual for students/creators).
