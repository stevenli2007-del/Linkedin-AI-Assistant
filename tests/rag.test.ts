import assert from "node:assert/strict";
import test from "node:test";
import { formatRetrievedHistory, retrieveRelevantHistory } from "../src/services/rag.ts";
import type { HistoryEntry, TargetProfile } from "../src/types/index.ts";
import { buildPrompt } from "../src/services/prompt.ts";
import type { UserProfile } from "../src/types/index.ts";

const target: TargetProfile = {
  targetName: "Ada Lovelace",
  targetHeadline: "Machine Learning Engineer at Acme AI",
  targetSchool: "MIT",
  targetCompany: "Acme AI",
  targetLocation: "Boston",
  targetAbout: "Works on responsible machine learning systems.",
  targetExperience: "Built production NLP platforms.",
};

const user: UserProfile = {
  userName: "Lin Chen",
  userHeadline: "Product Designer",
  userSchool: "MIT",
  userCompany: "",
  userLocation: "Boston",
  userBackground: "",
  userGoals: "",
  userInterests: "AI",
};

function historyEntry(overrides: Partial<HistoryEntry>): HistoryEntry {
  return {
    id: "entry",
    timestamp: Date.now(),
    targetName: "Unknown",
    targetHeadline: "",
    targetCompany: "",
    messageStyle: "professional",
    messageContent: "A networking message",
    commonPoint: "",
    ...overrides,
  };
}

test("retrieves the most relevant target and returns a relevance score", () => {
  const results = retrieveRelevantHistory(target, [
    historyEntry({
      id: "relevant",
      targetName: "Ada Lovelace",
      targetHeadline: "Machine Learning Engineer",
      targetCompany: "Acme AI",
      messageContent: "I enjoyed learning about your responsible machine learning work.",
    }),
    historyEntry({
      id: "irrelevant",
      targetName: "Grace Hopper",
      targetHeadline: "Operations Director",
      targetCompany: "Harbor Co",
      messageContent: "I would enjoy connecting about operations leadership.",
    }),
  ]);

  assert.equal(results[0]?.id, "relevant");
  assert.ok((results[0]?.relevanceScore ?? 0) > 0);
});

test("uses IDF and diversity so generic duplicates do not dominate retrieval", () => {
  const results = retrieveRelevantHistory(target, [
    historyEntry({ id: "one", targetName: "Ada Lovelace", targetCompany: "Acme AI", messageContent: "Machine learning at Acme AI." }),
    historyEntry({ id: "two", targetName: "Ada Lovelace", targetCompany: "Acme AI", messageContent: "Machine learning at Acme AI." }),
    historyEntry({ id: "three", targetName: "Grace Hopper", targetCompany: "Acme AI", messageContent: "Machine learning research at Acme AI." }),
  ], { limit: 3 });

  assert.equal(results.length, 3);
  assert.ok(results.filter((entry) => entry.targetName === "Ada Lovelace").length <= 2);
  assert.equal(results[0]?.id, "one");
});

test("returns no memory for unrelated history and bounds formatted context", () => {
  const results = retrieveRelevantHistory(target, [
    historyEntry({ targetName: "Someone Else", targetCompany: "Unrelated Corp", messageContent: "Accounting and payroll." }),
  ]);
  assert.deepEqual(results, []);
  assert.equal(formatRetrievedHistory(results), "");
});

test("formats memory with a safety instruction and useful fields", () => {
  const results = retrieveRelevantHistory(target, [
    historyEntry({ targetName: "Ada Lovelace", targetCompany: "Acme AI", commonPoint: "MIT alumni", messageContent: "Loved your NLP work." }),
  ]);
  const formatted = formatRetrievedHistory(results);
  assert.match(formatted, /RELEVANT LOCAL NETWORKING MEMORY/);
  assert.match(formatted, /Do not copy a prior message verbatim/);
  assert.match(formatted, /MIT alumni/);
});

test("injects retrieved memory into the generation prompt", () => {
  const memory = formatRetrievedHistory(retrieveRelevantHistory(target, [
    historyEntry({ targetName: "Ada Lovelace", targetCompany: "Acme AI", messageContent: "Loved your NLP work." }),
  ]));
  const prompt = buildPrompt(user, target, 300, undefined, memory);
  assert.match(prompt.userPrompt, /RELEVANT LOCAL NETWORKING MEMORY/);
  assert.match(prompt.generatedPrompt, /Loved your NLP work/);
});
