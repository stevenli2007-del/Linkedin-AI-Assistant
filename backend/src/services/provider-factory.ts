/**
 * Provider Factory
 * 根据 Backend 配置、未来用户等级或策略自动选择 Provider
 * Extension 无感知，始终调用统一业务接口
 */

import { AIProvider } from './provider';
import { DeepSeekProvider } from './providers/deepseek';
import { AI_CONFIG } from '../config/ai';
import { Env } from '../types';

/**
 * 创建 AI Provider 实例
 * Phase 09 仅支持 DeepSeek
 * 未来可根据 userTier、请求特征、成本策略等自动选择 Provider
 */
export function createProvider(env: Env, _userTier?: 'free' | 'pro' | 'enterprise'): AIProvider {
  // Phase 09: 强制使用 DeepSeek
  // 未来扩展：
  // - Free 用户使用 DeepSeek (成本最低)
  // - Pro 用户可使用 GPT-4 (质量最高)
  // - Enterprise 用户可指定 Provider

  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const config = AI_CONFIG.providers.deepseek;
  return new DeepSeekProvider(apiKey, {
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    timeout: config.timeout,
    apiEndpoint: config.apiEndpoint
  });
}

/**
 * 未来扩展示例：
 *
 * export function createProviderV2(env: Env, userTier: string): AIProvider {
 *   switch (userTier) {
 *     case 'free':
 *       return new DeepSeekProvider(env.DEEPSEEK_API_KEY);
 *     case 'pro':
 *       return new OpenAIProvider(env.OPENAI_API_KEY, { model: 'gpt-4' });
 *     case 'enterprise':
 *       // 可根据用户配置选择
 *       return new ClaudeProvider(env.CLAUDE_API_KEY);
 *     default:
 *       return new DeepSeekProvider(env.DEEPSEEK_API_KEY);
 *   }
 * }
 */
