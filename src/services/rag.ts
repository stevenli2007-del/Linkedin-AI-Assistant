import type { HistoryEntry, RetrievedHistoryEntry, TargetProfile } from "@/types";

/**
 * Local RAG retrieval for the extension.
 *
 * This deliberately does not send history to a third-party vector database.
 * It uses a small TF-IDF-like lexical index over the user's locally stored
 * history, with field weighting, phrase matches, and recency. For this small
 * corpus it is faster, private, and more reliable than adding a remote
 * embedding service or a new credential requirement.
 */

const DEFAULT_LIMIT = 5;
const MAX_CONTEXT_CHARS = 2_400;
const TOKEN_PATTERN = /[\p{L}\p{N}]+/gu;
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "at", "be", "for", "from", "in", "is", "it",
  "of", "on", "or", "the", "to", "with", "we", "our", "i", "my", "this",
  "that", "both", "you", "your", "about", "www", "com",
]);

function tokenize(value: string): string[] {
  return (value.toLocaleLowerCase().match(TOKEN_PATTERN) ?? [])
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function profileText(target: TargetProfile): string {
  return [
    target.targetName,
    target.targetHeadline,
    target.targetCompany,
    target.targetSchool,
    target.targetLocation,
    target.targetAbout,
    target.targetExperience,
  ].filter(Boolean).join(" ");
}

function entryText(entry: HistoryEntry): string {
  return [
    entry.targetName,
    entry.targetHeadline,
    entry.targetCompany,
    entry.commonPoint,
    entry.messageContent,
  ].filter(Boolean).join(" ");
}

function weightedTokens(entry: HistoryEntry): Map<string, number> {
  const weights = new Map<string, number>();
  const add = (value: string, weight: number) => {
    for (const token of tokenize(value)) {
      weights.set(token, (weights.get(token) ?? 0) + weight);
    }
  };
  add(entry.targetName, 3);
  add(entry.targetCompany, 2.5);
  add(entry.targetHeadline, 2);
  add(entry.commonPoint, 2);
  add(entry.messageContent, 1);
  return weights;
}

function scoreEntry(query: string, entry: HistoryEntry, now: number): number {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return 0;

  const weights = weightedTokens(entry);
  let overlap = 0;
  for (const token of queryTokens) overlap += weights.get(token) ?? 0;

  const normalizedQuery = query.toLocaleLowerCase();
  const normalizedEntry = entryText(entry).toLocaleLowerCase();
  const phraseBonus = normalizedQuery
    .split(/\s+/)
    .filter((part) => part.length > 3 && normalizedEntry.includes(part)).length * 0.35;

  // Prefer recent examples slightly, without allowing recency to beat relevance.
  const ageDays = Math.max(0, (now - entry.timestamp) / 86_400_000);
  const recencyBonus = Math.max(0, 0.5 - ageDays / 365);
  return overlap + phraseBonus + recencyBonus;
}

export function retrieveRelevantHistory(
  target: TargetProfile,
  history: HistoryEntry[],
  options: { limit?: number; query?: string } = {},
): RetrievedHistoryEntry[] {
  const query = options.query?.trim() || profileText(target);
  const now = Date.now();
  const limit = Math.max(1, Math.min(10, options.limit ?? DEFAULT_LIMIT));

  return history
    .filter((entry) => entry && typeof entry.messageContent === "string")
    .map((entry) => ({ ...entry, relevanceScore: scoreEntry(query, entry, now) }))
    .filter((entry) => entry.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

export function formatRetrievedHistory(entries: RetrievedHistoryEntry[]): string {
  if (entries.length === 0) return "";
  let output = "=== RELEVANT LOCAL NETWORKING MEMORY ===\n";
  output += "Use this as style and relationship context only. Do not copy a prior message verbatim or invent facts.\n";

  for (const [index, entry] of entries.entries()) {
    const item = `${index + 1}. Target: ${entry.targetName || "Unknown"}${entry.targetCompany ? ` (${entry.targetCompany})` : ""}\n` +
      `   Prior message (${entry.messageStyle}): ${entry.messageContent}\n` +
      (entry.commonPoint ? `   Common point: ${entry.commonPoint}\n` : "");
    if (output.length + item.length > MAX_CONTEXT_CHARS) break;
    output += item;
  }
  return output.trim();
}
