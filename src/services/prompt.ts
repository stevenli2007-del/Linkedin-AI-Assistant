// Prompt Builder — combines user profile + target profile into a structured prompt
// for the DeepSeek API to generate 4 styled LinkedIn connection messages.

import type { UserProfile, TargetProfile, PromptPayload } from "@/types";

// ── Profile Refinement (Phase 7) ───────────────────────────────────────────
//
// Instead of trying to precisely parse LinkedIn's volatile DOM with fragile
// CSS selectors, we dump the entire visible text of the profile page and let
// the LLM do the parsing. This is far more robust against LinkedIn layout
// changes and produces cleaner, more useful profile data.

const PROFILE_REFINE_SYSTEM_PROMPT = `You are an expert LinkedIn profile parser. You will receive raw text scraped from a LinkedIn profile page. Your job is to extract and structure the user's professional information into clean, concise fields.

Return ONLY valid JSON in this exact format:
{
  "userName": "...",
  "userHeadline": "...",
  "userCompany": "...",
  "userSchool": "...",
  "userBackground": "...",
  "userGoals": "...",
  "userInterests": "..."
}

Rules:
- **userName**: The person's full name. Remove any "人脉" (connection degree) numbers, pronouns like "Me" or "我", and any UI button text.
- **userHeadline**: Their current title/job. Keep it concise (under 120 chars).
- **userCompany**: Their current company name. If multiple companies listed, pick the current or most recent one.
- **userSchool**: ALL schools attended, comma-separated. Include university, high school if listed.
- **userBackground**: A concise 2-4 sentence professional summary. Extract key details from About, Experience, Education sections. Focus on what makes this person professionally interesting. Remove connection-degree markers, UI button text, and repetitive navigation text.
- **userGoals**: Infer likely networking goals from their profile (e.g. "seeking opportunities in AI", "connecting with fellow alumni", "exploring fintech roles"). If unclear, leave empty.
- **userInterests**: Extract professional interests, skills, and topics they care about. Comma-separated. If unclear, leave empty.

CRITICAL:
- Remove ALL LinkedIn UI noise: connection degrees ("2 度", "3rd+"), action buttons ("Connect", "Follow", "Message", "建立關係", "发消息"), navigation text ("Home", "My Network", "Jobs", "我的人脈"), ads, and sidebar clutter.
- If a field cannot be determined from the text, use an empty string "" — never fabricate data.
- For userBackground, write in first-person English (e.g. "I am a..."). Keep it professional and warm.
- For userGoals and userInterests, base your inference on actual profile content. If there's no basis, leave empty.
- Return ONLY the JSON object. No markdown, no code fences, no extra text.`;

export function buildProfileRefinePrompt(rawText: string): PromptPayload {
  const userPrompt = `Here is the raw text scraped from a LinkedIn profile page. Please extract and structure the profile information.

=== RAW LINKEDIN PROFILE TEXT ===
${rawText}

Parse this into the specified JSON format.`;

  return {
    systemPrompt: PROFILE_REFINE_SYSTEM_PROMPT,
    userPrompt,
    generatedPrompt: `${PROFILE_REFINE_SYSTEM_PROMPT}\n\n${userPrompt}`,
  };
}

// ── Connection Message Generation ──────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert LinkedIn networking assistant. Your task is to generate four different connection request messages based on the user's profile and the target person's profile.

CRITICAL — Common Ground Analysis (do this silently before writing any message):
Compare the user's profile and the target's profile. Identify ALL common points:
- Same school / alma mater (userSchool vs targetSchool)
- Same company / organization (userCompany vs targetCompany)
- Same city / region (infer from profile text if explicit location is available)
- Shared industry, domain, or professional field (compare headlines, background, interests, experience)
- Any other relevant commonality you can infer from the profiles

If one or more common points exist, you MUST naturally weave at least one common point into each message. The common point should feel like a genuine reason for reaching out — not a forced statement.

If NO common ground exists after analysis, write messages that reference the target's industry, interests, or recent work (the current default behavior).

Generate exactly 4 messages, each with a different style:

1. **professional** — Formal, respectful, career-focused. Highlights common professional ground.
2. **friendly** — Warm, casual, conversational. Feels like a natural human connection.
3. **entrepreneur** — Direct, ambitious, opportunity-focused. Opens doors for collaboration.
4. **academic** — Scholarly, intellectual, research-oriented. Emphasizes shared academic interests.

Rules:
- Each message must be under 300 characters.
- Each message must reference at least one specific detail from the target's profile.
- When a common point exists, it MUST appear in the message naturally (e.g. "I noticed we both studied at...", "I saw we both work in...").
- Do NOT fabricate information not present in the profiles.
- Write in a natural, human tone — not corporate-speak.
- Messages should feel authentic, not AI-generated.

Return ONLY valid JSON in this exact format, with no additional text:
{
  "messages": [
    { "messageStyle": "professional", "messageContent": "..." },
    { "messageStyle": "friendly", "messageContent": "..." },
    { "messageStyle": "entrepreneur", "messageContent": "..." },
    { "messageStyle": "academic", "messageContent": "..." }
  ]
}`;

function buildUserProfileSection(profile: UserProfile): string {
  const parts: string[] = [];
  if (profile.userName) parts.push(`Name: ${profile.userName}`);
  if (profile.userHeadline) parts.push(`Headline: ${profile.userHeadline}`);
  if (profile.userCompany) parts.push(`Company: ${profile.userCompany}`);
  if (profile.userSchool) parts.push(`School: ${profile.userSchool}`);
  if (profile.userBackground) parts.push(`Background: ${profile.userBackground}`);
  if (profile.userGoals) parts.push(`Goals: ${profile.userGoals}`);
  if (profile.userInterests) parts.push(`Interests: ${profile.userInterests}`);
  return parts.length ? parts.join("\n") : "User profile not yet configured.";
}

function buildTargetProfileSection(profile: TargetProfile): string {
  const parts: string[] = [];
  if (profile.targetName) parts.push(`Name: ${profile.targetName}`);
  if (profile.targetHeadline) parts.push(`Headline: ${profile.targetHeadline}`);
  if (profile.targetCompany) parts.push(`Company: ${profile.targetCompany}`);
  if (profile.targetSchool) parts.push(`School: ${profile.targetSchool}`);
  if (profile.targetLocation) parts.push(`Location: ${profile.targetLocation}`);
  if (profile.targetAbout) parts.push(`About: ${profile.targetAbout}`);
  if (profile.targetExperience) parts.push(`Experience: ${profile.targetExperience}`);
  return parts.join("\n");
}

const STYLE_DESCRIPTIONS: Record<
  import("@/types").MessageStyle,
  string
> = {
  professional:
    "Formal, respectful, career-focused. Highlights common professional ground.",
  friendly:
    "Warm, casual, conversational. Feels like a natural human connection.",
  entrepreneur:
    "Direct, ambitious, opportunity-focused. Opens doors for collaboration.",
  academic:
    "Scholarly, intellectual, research-oriented. Emphasizes shared academic interests.",
};

function buildSingleStyleSystemPrompt(style: import("@/types").MessageStyle): string {
  const description = STYLE_DESCRIPTIONS[style];

  return `You are an expert LinkedIn networking assistant. Your task is to generate ONE ${style} style connection request message based on the user's profile and the target person's profile.

Style: ${style} — ${description}

CRITICAL — Common Ground Analysis (do this silently before writing):
Compare the user's profile and the target's profile. Identify ALL common points:
- Same school / alma mater (userSchool vs targetSchool)
- Same company / organization (userCompany vs targetCompany)
- Same city / region (infer from profile text if explicit location is available)
- Shared industry, domain, or professional field (compare headlines, background, interests, experience)
- Any other relevant commonality you can infer from the profiles

If one or more common points exist, you MUST naturally weave at least one common point into the message. The common point should feel like a genuine reason for reaching out — not a forced statement.

If NO common ground exists after analysis, write a message that references the target's industry, interests, or recent work.

Rules:
- The message must be under 300 characters.
- The message must reference at least one specific detail from the target's profile.
- When a common point exists, it MUST appear in the message naturally.
- Do NOT fabricate information not present in the profiles.
- Write in a natural, human tone — not corporate-speak.
- The message should feel authentic, not AI-generated.

Return ONLY valid JSON in this exact format, with no additional text:
{
  "messages": [
    { "messageStyle": "${style}", "messageContent": "..." }
  ]
}`;
}

export function buildSingleStylePrompt(
  userProfile: UserProfile,
  targetProfile: TargetProfile,
  style: import("@/types").MessageStyle
): PromptPayload {
  const userSection = buildUserProfileSection(userProfile);
  const targetSection = buildTargetProfileSection(targetProfile);
  const systemPrompt = buildSingleStyleSystemPrompt(style);

  const userPrompt = `Here are the profiles:

=== MY PROFILE ===
${userSection}

=== TARGET PROFILE ===
${targetSection}

Generate 1 LinkedIn connection message in the ${style} style based on the above profiles.`;

  return {
    systemPrompt,
    userPrompt,
    generatedPrompt: `${systemPrompt}\n\n${userPrompt}`,
  };
}

export function buildPrompt(
  userProfile: UserProfile,
  targetProfile: TargetProfile
): PromptPayload {
  const userSection = buildUserProfileSection(userProfile);
  const targetSection = buildTargetProfileSection(targetProfile);

  const userPrompt = `Here are the profiles:

=== MY PROFILE ===
${userSection}

=== TARGET PROFILE ===
${targetSection}

Generate 4 LinkedIn connection messages based on the above profiles.`;

  return {
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    generatedPrompt: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
  };
}
