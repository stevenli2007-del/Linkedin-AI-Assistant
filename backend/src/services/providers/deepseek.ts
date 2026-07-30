/**
 * DeepSeek Provider 实现
 * Phase 09 默认（且唯一）Provider
 * 未来可扩展 OpenAI、Claude、Gemini
 */

import { AIProvider, GenerateRequest, GenerateResponse, RefineProfileRequest, RefineProfileResponse, RefineMessageRequest, RefineMessageResponse } from '../../types';
import { estimateTokens } from '../provider';

export class DeepSeekProvider implements AIProvider {
  name = 'deepseek';

  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private timeout: number;
  private apiEndpoint: string;

  constructor(apiKey: string, config: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
    apiEndpoint?: string;
  } = {}) {
    if (!apiKey) {
      throw new Error('DeepSeek API Key is required');
    }
    this.apiKey = apiKey;
    this.model = config.model || 'deepseek-chat';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 1000;
    this.timeout = config.timeout || 30000;
    this.apiEndpoint = config.apiEndpoint || 'https://api.deepseek.com/v1/chat/completions';
  }

  async generate(request: GenerateRequest, apiKey?: string): Promise<GenerateResponse['data']> {
    const key = apiKey || this.apiKey;
    const messages = request.messages;

    const response = await this.callAPI(messages, key);

    return {
      message: response.choices[0].message.content,
      usage: {
        promptTokens: response.usage?.prompt_tokens || estimateTokens(JSON.stringify(messages)),
        completionTokens: response.usage?.completion_tokens || estimateTokens(response.choices[0].message.content),
        totalTokens: response.usage?.total_tokens || 0
      },
      provider: this.name // 仅用于日志
    };
  }

  async refineProfile(request: RefineProfileRequest, apiKey?: string): Promise<RefineProfileResponse['data']> {
    const key = apiKey || this.apiKey;
    const systemPrompt = `You are a professional LinkedIn profile parser.
Your task is to extract structured information from a messy LinkedIn profile text and return it as a JSON object.

Return ONLY a valid JSON object with the following fields (omit fields that cannot be extracted):
- userName: the person's name
- userHeadline: their current headline/title
- userCompany: their current company (if applicable)
- userSchool: their school/university (if applicable)
- userBackground: a brief professional background summary
- userGoals: career goals or aspirations (if mentioned)
- userInterests: professional interests or hobbies (if mentioned)

Example output:
{
  "userName": "John Doe",
  "userHeadline": "Software Engineer",
  "userCompany": "Google",
  "userSchool": "UC Berkeley",
  "userBackground": "5+ years of experience in distributed systems",
  "userGoals": "",
  "userInterests": "AI and machine learning"
}

Return ONLY the JSON object, no markdown fences, no explanations.`;

    const userMessage = request.instruction
      ? `Please extract and structure the following LinkedIn profile text with this instruction: ${request.instruction}\n\nProfile:\n${request.rawProfileText}`
      : `Please extract and structure the following LinkedIn profile text:\n\n${request.rawProfileText}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage }
    ];

    const response = await this.callAPI(messages, key);

    return {
      refinedProfile: response.choices[0].message.content,
      usage: {
        promptTokens: response.usage?.prompt_tokens || estimateTokens(JSON.stringify(messages)),
        completionTokens: response.usage?.completion_tokens || estimateTokens(response.choices[0].message.content),
        totalTokens: response.usage?.total_tokens || 0
      }
    };
  }

  async refineMessage(request: RefineMessageRequest, apiKey?: string): Promise<RefineMessageResponse['data']> {
    const key = apiKey || this.apiKey;

    const systemPrompt = `You are an AI assistant that refines LinkedIn networking messages based on specific user instructions.

You will receive:
1. The ORIGINAL message that was previously generated
2. An INSTRUCTION describing how the user wants it improved (e.g. "make it shorter", "more casual", "add a compliment about their recent post")
3. Optional context: the USER's own profile and the TARGET recipient's profile

Rules:
- Apply ONLY the requested changes — don't rewrite things the user didn't ask to change
- Preserve the overall tone and purpose of the original message
- Keep the message appropriate for LinkedIn professional networking
- Return ONLY the refined message text — no explanations, no markdown, no JSON wrapper
- If the instruction is unclear, make your best reasonable interpretation`;

    let userMessage = `ORIGINAL MESSAGE:\n${request.originalContent}\n\nINSTRUCTION: ${request.instruction}`;

    if (request.userProfile) {
      userMessage += `\n\nMY PROFILE:\n${request.userProfile}`;
    }
    if (request.targetProfile) {
      userMessage += `\n\nRECIPIENT PROFILE:\n${request.targetProfile}`;
    }

    userMessage += '\n\nPlease return ONLY the refined message text.';

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage }
    ];

    const response = await this.callAPI(messages, key);

    return {
      refinedMessage: response.choices[0].message.content.trim(),
      usage: {
        promptTokens: response.usage?.prompt_tokens || estimateTokens(JSON.stringify(messages)),
        completionTokens: response.usage?.completion_tokens || estimateTokens(response.choices[0].message.content),
        totalTokens: response.usage?.total_tokens || 0
      }
    };
  }

  private async callAPI(messages: Array<{ role: string; content: string }>, apiKey: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: this.temperature,
          max_tokens: this.maxTokens
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error calling DeepSeek API');
    }
  }
}


