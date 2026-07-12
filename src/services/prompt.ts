// Prompt Builder — combines user profile + target profile into a structured prompt
// for the DeepSeek API to generate 4 styled LinkedIn connection messages.

import type { UserProfile, TargetProfile, PromptPayload, MessageStyle } from "@/types";

// ── Profile Refinement (Phase 7) ───────────────────────────────────────────
//
// Instead of trying to precisely parse LinkedIn's volatile DOM with fragile
// CSS selectors, we dump the entire visible text of the profile page and let
// the LLM do the parsing. This is far more robust against LinkedIn layout
// changes and produces cleaner, more useful profile data.

const PROFILE_REFINE_SYSTEM_PROMPT = `You are an expert LinkedIn profile parser. You will receive raw text scraped from a LinkedIn profile page. Your job is to thoroughly extract and structure the user's professional information into clean, concise fields.

Return ONLY valid JSON in this exact format:
{
  "userName": "...",
  "userHeadline": "...",
  "userCompany": "...",
  "userLocation": "...",
  "userSchool": "...",
  "userBackground": "...",
  "userGoals": "...",
  "userInterests": "..."
}

Field-by-field extraction instructions:

**userName**: The person's full name. Look at the very top of the page, usually the largest text. Remove any connection-degree numbers ("2 度", "3rd+"), pronouns like "Me" or "我", and any UI button text.

**userHeadline**: Their current title/job, typically appears directly below the name. This often looks like "Product Manager at Stripe" or "CS Student @ UC Berkeley | AI Researcher". Keep it concise (under 120 chars). Do NOT include the company separately here if it is already in the headline — the headline should be kept as-is.

**userCompany**: Their current company name. Look in these places (in order of priority):
1. The headline (e.g. "at Stripe" → "Stripe")
2. The Experience section — the first/most recent job entry's company name
3. Any company logo or company link near the top of the page
If the person is a student with no current company, look for university name instead. If truly no company is found, use "".

**userLocation**: Their geographic location (city, state/country). Look for a location text near the top of the profile, often right below or near the headline. It typically looks like "San Francisco Bay Area", "Shanghai, China", "New York, NY". If no location is visible, use "".

**userSchool**: ALL schools attended, comma-separated. Look in the Education section (usually headed "Education" or "教育"). Include university name, and high school if listed. Each school name should be just the institution name (e.g. "UC Berkeley, Tsinghua University"), not the full degree text.

**userBackground**: A comprehensive 3-5 sentence professional summary written in FIRST-PERSON English (e.g. "I am a..."). Synthesize from ANY professional content visible in the raw text — this includes but is NOT limited to: the About/关于 section, Experience descriptions, Education details, featured posts, or any descriptive paragraphs. Even if no explicit "About" heading exists, you MUST extract relevant biographical information from the entire page and compose a summary. Remove ALL UI noise. Keep it professional, warm, and authentic. Do NOT leave this empty if any professional description exists anywhere in the text.

**userGoals**: Infer likely networking goals based on their career stage, headline, and profile content. Examples: "seeking opportunities in AI", "connecting with fellow alumni", "building my professional network". Use your judgment — a reasonable inference is better than leaving this empty.

**userInterests**: Extract ALL visible professional interests, skills, topics, and areas of expertise. Look everywhere: Skills/技能 section, Interests/兴趣 section, keywords in About/Experience/Education, hashtags, certifications. Comma-separated list (e.g. "Machine Learning, Product Management, Fintech, Climate Tech"). Be generous — include anything professionally relevant you can find. A good guess is better than leaving this empty.

CRITICAL RULES:
- Scan the ENTIRE raw text thoroughly. LinkedIn pages contain many sections — do not stop after finding the name and headline. Look for section headings like "About", "Experience", "Education", "Skills", "Interests" to locate relevant content.
- Remove ALL LinkedIn UI noise: connection degrees ("2 度", "3rd+"), action buttons ("Connect", "Follow", "Message", "建立關係", "发消息"), navigation text ("Home", "My Network", "Jobs", "我的人脈"), ads, and sidebar clutter.
- For userBackground, userGoals, and userInterests: A reasonable inference based on available text is ALWAYS better than an empty string. These fields help generate better connection messages, so do your best to fill them.
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

function buildSystemPrompt(maxMessageLength: number, selectedCommonPoint?: string): string {
  const commonPointInstruction = selectedCommonPoint
    ? `\n\nIMPORTANT — User selected this common point to focus on: "${selectedCommonPoint}"\nYou MUST weave this specific common point into ALL four messages naturally. This is the primary reason for connecting.`
    : "";

  return `You are an expert LinkedIn networking assistant. Your task is to generate four different connection request messages based on the user's profile and the target person's profile.

CRITICAL — Common Ground Analysis (do this silently before writing any message):
Compare the user's profile and the target's profile. Identify ALL common points:
- Same school / alma mater (userSchool vs targetSchool)
- Same company / organization (userCompany vs targetCompany)
- Same city / region (infer from profile text if explicit location is available)
- Shared industry, domain, or professional field (compare headlines, background, interests, experience)
- Any other relevant commonality you can infer from the profiles

If one or more common points exist, you MUST naturally weave at least one common point into each message. The common point should feel like a genuine reason for reaching out — not a forced statement.

If NO common ground exists after analysis, write messages that reference the target's industry, interests, or recent work (the current default behavior).
${commonPointInstruction}

Generate exactly 4 messages, each with a different style:

1. **professional** — Formal, respectful, career-focused. Highlights common professional ground.
2. **friendly** — Warm, casual, conversational. Feels like a natural human connection.
3. **entrepreneur** — Direct, ambitious, opportunity-focused. Opens doors for collaboration.
4. **academic** — Scholarly, intellectual, research-oriented. Emphasizes shared academic interests.

Rules:
- Each message must be under ${maxMessageLength} characters.
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
}

function buildUserProfileSection(profile: UserProfile): string {
  const parts: string[] = [];
  if (profile.userName) parts.push(`Name: ${profile.userName}`);
  if (profile.userHeadline) parts.push(`Headline: ${profile.userHeadline}`);
  if (profile.userCompany) parts.push(`Company: ${profile.userCompany}`);
  if (profile.userLocation) parts.push(`Location: ${profile.userLocation}`);
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

function buildSingleStyleSystemPrompt(style: MessageStyle, maxMessageLength: number): string {
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
- The message must be under ${maxMessageLength} characters.
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
  style: MessageStyle,
  maxMessageLength: number,
): PromptPayload {
  const userSection = buildUserProfileSection(userProfile);
  const targetSection = buildTargetProfileSection(targetProfile);
  const systemPrompt = buildSingleStyleSystemPrompt(style, maxMessageLength);

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
  targetProfile: TargetProfile,
  maxMessageLength: number,
  selectedCommonPoint?: string,
): PromptPayload {
  const userSection = buildUserProfileSection(userProfile);
  const targetSection = buildTargetProfileSection(targetProfile);
  const systemPrompt = buildSystemPrompt(maxMessageLength, selectedCommonPoint);

  const userPrompt = `Here are the profiles:

=== MY PROFILE ===
${userSection}

=== TARGET PROFILE ===
${targetSection}

Generate 4 LinkedIn connection messages based on the above profiles.`;

  return {
    systemPrompt,
    userPrompt,
    generatedPrompt: `${systemPrompt}\n\n${userPrompt}`,
  };
}

// ── Find Common Points ──────────────────────────────────────────────────────

export function buildFindCommonPrompt(
  userProfile: UserProfile,
  targetProfile: TargetProfile,
): PromptPayload {
  const userSection = buildUserProfileSection(userProfile);
  const targetSection = buildTargetProfileSection(targetProfile);

  const systemPrompt = `You are an expert LinkedIn networking assistant. Your task is to analyze two LinkedIn profiles and identify the top 5 common points between them.

These common points will be shown to the user so they can choose which angle to use when sending a connection request.

Return ONLY valid JSON in this exact format, with no additional text:
{
  "commonPoints": [
    "Brief description of common point 1",
    "Brief description of common point 2",
    "Brief description of common point 3",
    "Brief description of common point 4",
    "Brief description of common point 5"
  ]
}

Rules:
- Each common point should be a concise, specific phrase (10-20 words).
- Focus on actionable common points that could be naturally mentioned in a connection message.
- Include a mix of: same school, same company, same industry, same location, shared skills/interests, similar career path.
- If fewer than 5 common points exist, return as many as you can find (minimum 1).
- Do NOT fabricate common points. Only list real overlaps found in the profiles.
- Write in English.`;

  const userPrompt = `Here are the two profiles:

=== MY PROFILE ===
${userSection}

=== TARGET PROFILE ===
${targetSection}

Find the top 5 common points between these two profiles. Return the result as JSON.`;

  return {
    systemPrompt,
    userPrompt,
    generatedPrompt: `${systemPrompt}\n\n${userPrompt}`,
  };
}
