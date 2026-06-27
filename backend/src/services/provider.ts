/**
 * AI Provider 抽象接口
 * 所有 AI Provider 必须实现此接口
 * Phase 09 实现 DeepSeek，未来可扩展 OpenAI、Claude、Gemini
 */

import { Message, GenerateRequest, GenerateResponse, RefineProfileRequest, RefineProfileResponse } from '../types';

export interface AIProvider {
  /** Provider 名称（用于日志和调试） */
  name: string;

  /**
   * 生成 AI 回复
   * @param request 生成请求
   * @param apiKey 可选，Custom Mode 时传入用户 API Key
   */
  generate(request: GenerateRequest, apiKey?: string): Promise<GenerateResponse['data']>;

  /**
   * 优化 LinkedIn Profile
   * @param request 优化请求
   * @param apiKey 可选，Custom Mode 时传入用户 API Key
   */
  refineProfile(request: RefineProfileRequest, apiKey?: string): Promise<RefineProfileResponse['data']>;
}

/**
 * 构建 Messages 数组（通用方法）
 * 所有 Provider 可以复用
 */
export function buildMessages(systemPrompt: string, userMessage: string): Message[] {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];
}

/**
 * 计算 Token 使用量（估算）
 * 简单实现：1 Token ≈ 4 字符（英文）或 1.5 字符（中文）
 */
export function estimateTokens(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars / 1.5 + otherChars / 4);
}
