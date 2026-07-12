// LLM Service — calls Backend Proxy API (Cloudflare Workers)
// Phase 09: Extension no longer calls DeepSeek directly.
// All AI requests go through backend to support shared/custom API modes.

import type { GeneratedMessage, MessageStyle, PromptPayload, UserProfile } from "@/types";
import { buildProfileRefinePrompt } from "./prompt";
import { loadClientId, saveClientId } from "./client-id";
import { API_ENDPOINTS } from "@/config";

const EXTENSION_VERSION = "1.0.0";
const FETCH_TIMEOUT_MS = 30_000;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

interface BackendMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface BackendGenerateRequest {
  messages: BackendMessage[];
  temperature?: number;
  maxTokens?: number;
}

interface BackendGenerateResponse {
  success: boolean;
  data?: {
    message: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  error?: string;
  errorCode?: string;
  requestId: string;
  timestamp: string;
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

function generateRequestId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

// ── Shared API call helper with retry + backoff ──────────────────────────────

function isRetriableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Calls the Backend Proxy API with exponential backoff retry.
 *
 * @param apiMode - "shared" (use backend's API key) or "custom" (use user's API key)
 * @param customApiKey - User's own API key (required when apiMode is "custom")
 * @param messages - The messages to send to the AI
 * @param temperature - Optional temperature parameter
 * @param maxTokens - Optional max tokens parameter
 * @param timeoutErrorMessage - Error message for timeout errors
 * @returns The raw content string from the API response.
 */
async function callBackendAPI(
  apiMode: "shared" | "custom",
  customApiKey: string | null,
  messages: BackendMessage[],
  temperature: number,
  maxTokens: number,
  timeoutErrorMessage: string
): Promise<string> {
  // Get or create client ID (persisted in chrome.storage.local)
  const clientId = await loadClientId();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const requestId = generateRequestId();

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
        "X-Client-Id": clientId,
        "X-Extension-Version": EXTENSION_VERSION,
        "X-Api-Mode": apiMode,
      };

      // In custom mode, send user's API key to backend (backend uses it for this request only)
      if (apiMode === "custom" && customApiKey) {
        headers["X-Custom-Api-Key"] = customApiKey;
      }

      const body: BackendGenerateRequest = { messages };
      if (temperature !== undefined) body.temperature = temperature;
      if (maxTokens !== undefined) body.maxTokens = maxTokens;

      const response = await fetch(
        API_ENDPOINTS.generate,
        {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );

      if (response.ok) {
        let data: BackendGenerateResponse;
        try {
          data = (await response.json()) as BackendGenerateResponse;
        } catch {
          throw new Error("Failed to read backend API response.");
        }

        if (!data.success) {
          // 使用后端返回的错误码显示更友好的提示
          const errorCode = data.errorCode;
          if (errorCode === 'RATE_LIMITED') {
            throw new Error("请求过于频繁，请稍后再试（每分钟最多 10 次）。");
          }
          if (errorCode === 'UNAUTHORIZED') {
            throw new Error("API Key 无效，请检查 Settings 中的配置。");
          }
          if (errorCode === 'MODEL_ERROR') {
            throw new Error("AI 服务暂时不可用，请稍后重试。");
          }
          throw new Error(data.error || "Backend API returned an error.");
        }

        if (!data.data || !data.data.message) {
          throw new Error("Backend API returned an empty response. Please try again.");
        }

        return data.data.message;
      }

      const status = response.status;

      // 尝试读取后端返回的错误码
      let errorCode: string | undefined;
      let errorMsg: string | undefined;
      try {
        const errorBody = await response.json();
        errorCode = errorBody.errorCode;
        errorMsg = errorBody.error;
      } catch {
        // 无法解析错误响应，使用默认处理
      }

      // Non-retriable client errors — throw immediately
      if (status === 401) {
        if (errorCode === 'UNAUTHORIZED') {
          throw new Error("API Key 无效，请检查 Settings 中的配置。");
        }
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
        if (status === 429 || errorCode === 'RATE_LIMITED') {
          throw new Error("请求过于频繁，请稍后再试（每分钟最多 10 次）。");
        }
        throw new Error("Backend server error. Please try again in a moment.");
      }

      // Other non-retriable errors
      let errorBody = "";
      try { errorBody = await response.text(); } catch { /* ignore */ }
      throw new Error(`Backend API error (HTTP ${status}): ${errorBody.slice(0, 200)}`);
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
        "Network error: Unable to reach backend API. Please check your internet connection."
      );
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  // Unreachable — loop always returns or throws
  throw new Error("Unexpected error: API request failed after all retries.");
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateMessages(
  apiMode: "shared" | "custom",
  customApiKey: string | null,
  prompt: PromptPayload,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<GeneratedMessage[]> {
  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.maxTokens ?? 1024;

  const messages: BackendMessage[] = [
    { role: "system", content: prompt.systemPrompt },
    { role: "user", content: prompt.userPrompt },
  ];

  const rawContent = await callBackendAPI(
    apiMode,
    customApiKey,
    messages,
    temperature,
    maxTokens,
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
  apiMode: "shared" | "custom",
  customApiKey: string | null,
  prompt: PromptPayload,
  style: MessageStyle,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<GeneratedMessage> {
  const generated = await generateMessages(apiMode, customApiKey, prompt, options);
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
 * Phase 7: Send raw LinkedIn profile text to Backend API for refinement.
 * The LLM parses the messy scraped text into a clean, structured UserProfile.
 */
export async function refineProfile(
  apiMode: "shared" | "custom",
  customApiKey: string | null,
  rawText: string,
  options?: {
    model?: string;
    temperature?: number;
  }
): Promise<UserProfile> {
  const temperature = options?.temperature ?? 0.3; // Lower temp for structured extraction

  const prompt = buildProfileRefinePrompt(rawText);

  const messages: BackendMessage[] = [
    { role: "system", content: prompt.systemPrompt },
    { role: "user", content: prompt.userPrompt },
  ];

  // Call backend /api/v1/refine-profile endpoint
  const clientId = await loadClientId();
  const requestId = generateRequestId();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Request-Id": requestId,
    "X-Client-Id": clientId,
    "X-Extension-Version": EXTENSION_VERSION,
    "X-Api-Mode": apiMode,
  };

  if (apiMode === "custom" && customApiKey) {
    headers["X-Custom-Api-Key"] = customApiKey;
  }

  const body = JSON.stringify({
    rawProfileText: rawText,
    instruction: prompt.userPrompt,
  });

  let rawContent: string;

  try {
    const response = await fetch(API_ENDPOINTS.refineProfile, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      let errorBody = "";
      try { errorBody = await response.text(); } catch { /* ignore */ }
      throw new Error(`Backend API error (HTTP ${response.status}): ${errorBody.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      success: boolean;
      data?: { refinedProfile: string };
      error?: string;
    };

    if (!data.success) {
      throw new Error(data.error || "Failed to refine profile.");
    }

    if (!data.data || !data.data.refinedProfile) {
      throw new Error("Backend returned an empty refined profile.");
    }

    rawContent = data.data.refinedProfile;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Network error: Unable to reach backend API.");
  }

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
    userLocation: safeString("userLocation"),
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

/**
 * Find common points between user's profile and target's profile.
 * Returns an array of common points (up to 5).
 */
export async function findCommonPoints(
  apiMode: "shared" | "custom",
  customApiKey: string | null,
  prompt: PromptPayload,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string[]> {
  const temperature = options?.temperature ?? 0.5;

  const messages: BackendMessage[] = [
    { role: "system", content: prompt.systemPrompt },
    { role: "user", content: prompt.userPrompt },
  ];

  const rawContent = await callBackendAPI(
    apiMode,
    customApiKey,
    messages,
    temperature,
    512,
    "Request timed out while finding common points. Please try again."
  );

  // Parse the JSON response
  let jsonString = rawContent.trim();
  const codeFenceMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeFenceMatch) {
    jsonString = codeFenceMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonString) as { commonPoints?: string[] };
    if (Array.isArray(parsed.commonPoints)) {
      return parsed.commonPoints.filter((p) => typeof p === "string" && p.trim().length > 0);
    }
    return [];
  } catch {
    // If JSON parse fails, try to extract common points from raw text
    const lines = rawContent.split("\n").filter((l) => l.trim().length > 0);
    return lines.slice(0, 5);
  }
}
