/**
 * Prompt Loader
 *
 * Loads markdown prompts that are bundled into the project.
 */

import defaultPrompt from "./system/default.md";
import linkedinPrompt from "./system/linkedin.md";
import recruiterPrompt from "./system/recruiter.md";

import articleTemplate from "./templates/article.md";
import commentTemplate from "./templates/comment.md";
import summaryTemplate from "./templates/summary.md";

const promptMap: Record<string, string> = {
    // system prompts
    "system/default": defaultPrompt,
    "system/linkedin": linkedinPrompt,
    "system/recruiter": recruiterPrompt,

    // templates
    "templates/article": articleTemplate,
    "templates/comment": commentTemplate,
    "templates/summary": summaryTemplate,
};

export function loadPrompt(name: string): string {
    const prompt = promptMap[name];

    if (!prompt) {
        throw new Error(`Prompt "${name}" not found.`);
    }

    return prompt;
}