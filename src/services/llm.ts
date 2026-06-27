// LLM Service — wraps the DeepSeek Chat Completions API
// DeepSeek is OpenAI-compatible, so we use the standard chat/completions format.

import type { GeneratedMessage, MessageStyle, PromptPayload, UserProfile } from "@/types";
import { buildProfileRefinePrompt } from "./prompt";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
const DEFAULT_MODEL = "deepseek-chat";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1024;
const FETCH_TIMEOUT_MS = 30_000; // 30 second timeout for all API calls

// Retry configuration (ReviewChecklist 2.9: retry with backoff, no infinite loops)
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ParsedResponse {
  messages: Array<{
    messageStyle: string;
    messageContent: string;
  }>;
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function validateMessages(messages: unknown[]): boolean {
  const validStyles = new Set([
    "professional",
    "friendly",
    "entrepreneur",
    "academic",
  ]);

  return messages.every(
    (msg) =>
      typeof msg === "object" &&
      msg !== null &&
      "messageStyle" in (msg as Record<string, unknown>) &&
      "messageContent" in (msg as Record<string, unknown>) &&
      validStyles.has((msg as Record<string, string>).messageStyle) &&
      typeof (msg as Record<string, string>).messageContent === "string" &&
      (msg as Record<string, string>).messageContent.trim().length > 0
  );
}

function parseResponse(rawContent: string): ParsedResponse {
  // DeepSeek may wrap JSON in markdown code fences
  let jsonString = rawContent.trim();

  const codeFenceMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeFenceMatch) {
    jsonString = codeFenceMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonString) as unknown;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("messages" in (parsed as Record<string, unknown>))
    ) {
      throw new Error(
        "Unexpected LLM response format. Expected a JSON object with a 'messages' array."
      );
    }

    const data = parsed as ParsedResponse;

    if (!Array.isArray(data.messages)) {
      throw new Error(
        "Unexpected LLM response format: 'messages' is not an array."
      );
    }

    if (data.messages.length < 1) {
      throw new Error("LLM returned an empty messages array.");
    }

    if (!validateMessages(data.messages)) {
      throw new Error(
        "LLM response had invalid message formats. Each message must have a valid 'messageStyle' (professional/friendly/entrepreneur/academic) and non-empty 'messageContent'."
      );
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        "Failed to parse LLM response as JSON. The model may have returned unexpected output. Please try again."
      );
    }
    throw error;
  }
}

// ── Shared API call helper with retry + backoff ────────────────────────────
//
// Phase 08 (H-3, H-4, L-1): Previously generateMessages() and refineProfile()
// each had their own copy of ~60 lines of fetch + error-handling logic, and
// neither retried on 429/5xx. This shared helper provides:
//   • Exponential backoff retry for 429, 500, 502, 503, timeouts, network errors
//   • Immediate throw (no retry) for 401, 402, and other 4xx client errors
//   • Consistent user-friendly error messages across all call sites
//   • Max 3 retries with 1s → 2s → 4s delays (no infinite loops)

function isRetriableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Calls the DeepSeek chat/completions endpoint with exponential backoff retry
 * for retriable errors (429, 500, 502, 503, timeouts, network errors).
 *
 * Non-retriable errors (401, 402, other 4xx) throw immediately with a
 * user-friendly message.
 *
 * @returns The raw content string from the API response.
 */
async function callDeepSeekAPI(
  apiKey: string,
  body: string,
  timeoutErrorMessage: string
): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body,
        signal: controller.signal,
      });

      if (response.ok) {
        let data: DeepSeekResponse;
        try {
          data = (await response.json()) as DeepSeekResponse;
        } catch {
          throw new Error("Failed to read DeepSeek API response.");
        }

        if (!data.choices || data.choices.length === 0) {
          throw new Error("DeepSeek API returned an empty response. Please try again.");
        }

        const rawContent = data.choices[0]?.message?.content;
        if (!rawContent) {
          throw new Error("DeepSeek API returned a response with no content.");
        }

        return rawContent;
      }

      const status = response.status;

      // Non-retriable client errors — throw immediately
      if (status === 401) {
        throw new Error("Invalid API Key. Please check your DeepSeek API Key and try again.");
      }
      if (status === 402) {
        throw new Error("DeepSeek account has insufficient balance. Please top up your account.");
      }

      // Retriable server errors (429/5xx)
      if (isRetriableStatus(status)) {
        if (attempt < MAX_RETRIES) {
          await sleep(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt));
          continue;
        }
        if (status === 429) {
          throw new Error("Too many requests. Please wait a moment and try again.");
        }
        throw new Error("DeepSeek server error. Please try again in a moment.");
      }

      // Other non-retriable errors
      let errorBody = "";
      try { errorBody = await response.text(); } catch { /* ignore */ }
      throw new Error(`DeepSeek API error (HTTP ${status}): ${errorBody.slice(0, 200)}`);
    } catch (err) {
      // Re-throw user-friendly errors (our own Error instances, not DOMException)
      if (err instanceof Error && !(err instanceof DOMException)) {
        throw err;
      }

      // Timeout (AbortError) — retry if attempts remain
      if (err instanceof DOMException && err.name === "AbortError") {
        if (attempt < MAX_RETRIES) {
          await sleep(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt));
          continue;
        }
        throw new Error(timeoutErrorMessage);
      }

      // Network errors (TypeError from fetch) — retry if attempts remain
      if (attempt < MAX_RETRIES) {
        await sleep(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt));
        continue;
      }

      throw new Error(
        "Network error: Unable to reach DeepSeek API. Please check your internet connection."
      );
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  // Unreachable — loop always returns or throws
  throw new Error("Unexpected error: API request failed after all retries.");
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function generateMessages(
  apiKey: string,
  prompt: PromptPayload,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<GeneratedMessage[]> {
  const model = options?.model ?? DEFAULT_MODEL;
  const temperature = options?.temperature ?? DEFAULT_TEMPERATURE;
  const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;

  const messages: DeepSeekMessage[] = [
    { role: "system", content: prompt.systemPrompt },
    { role: "user", content: prompt.userPrompt },
  ];

  const body = JSON.stringify({ model, messages, temperature, max_tokens: maxTokens });
  const rawContent = await callDeepSeekAPI(
    apiKey,
    body,
    "Request timed out after 30 seconds. Please check your connection and try again."
  );

  const parsed = parseResponse(rawContent);
  const now = Date.now();

  return parsed.messages.map((msg) => ({
    messageId: generateId(),
    messageStyle: msg.messageStyle as GeneratedMessage["messageStyle"],
    messageContent: msg.messageContent.trim(),
    generatedTime: now,
  }));
}

export async function regenerateMessage(
  apiKey: string,
  prompt: PromptPayload,
  style: MessageStyle,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<GeneratedMessage> {
  const generated = await generateMessages(apiKey, prompt, options);
  const match = generated.find((msg) => msg.messageStyle === style);

  if (!match) {
    throw new Error(
      `Failed to regenerate ${style} message. The model did not return this style.`
    );
  }

  return {
    ...match,
    messageId: generateId(),
    generatedTime: Date.now(),
  };
}

/**
 * Phase 7: Send raw LinkedIn profile text to DeepSeek for refinement.
 * The LLM parses the messy scraped text into a clean, structured UserProfile.
 */
export async function refineProfile(
  apiKey: string,
  rawText: string,
  options?: {
    model?: string;
    temperature?: number;
  }
): Promise<UserProfile> {
  const model = options?.model ?? DEFAULT_MODEL;
  const temperature = options?.temperature ?? 0.3; // Lower temp for structured extraction

  const prompt = buildProfileRefinePrompt(rawText);

  const messages: DeepSeekMessage[] = [
    { role: "system", content: prompt.systemPrompt },
    { role: "user", content: prompt.userPrompt },
  ];

  const body = JSON.stringify({ model, messages, temperature, max_tokens: 1024 });
  const rawContent = await callDeepSeekAPI(
    apiKey,
    body,
    "Profile refinement timed out after 30 seconds. Please try again."
  );

  // Parse the JSON response (may be wrapped in code fences)
  let jsonString = rawContent.trim();
  const codeFenceMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeFenceMatch) {
    jsonString = codeFenceMatch[1];
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonString) as Record<string, unknown>;
  } catch {
    throw new Error(
      "Failed to parse AI-refined profile. The model returned invalid JSON. Please try again."
    );
  }

  // Build a validated UserProfile from the parsed response
  const safeString = (key: string): string => {
    const val = parsed[key];
    return typeof val === "string" ? val.trim() : "";
  };

  const profile: UserProfile = {
    userName: safeString("userName"),
    userHeadline: safeString("userHeadline"),
    userCompany: safeString("userCompany"),
    userSchool: safeString("userSchool"),
    userBackground: safeString("userBackground"),
    userGoals: safeString("userGoals"),
    userInterests: safeString("userInterests"),
  };

  // Basic sanity check: at minimum, we should have a name
  if (!profile.userName) {
    throw new Error(
      "AI refinement did not extract a name. The profile text may be incomplete. Please try again."
    );
  }

  return profile;
}
