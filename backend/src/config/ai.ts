/**
 * AI 配置中心
 * 统一管理所有 AI 相关参数
 * Phase 09 仅实现 DeepSeek，未来可扩展 OpenAI、Claude、Gemini
 */

export const AI_CONFIG = {
  // 默认 Provider（Backend 自动选择，Extension 无感知）
  defaultProvider: 'deepseek',

  // 支持的 Providers
  providers: {
    deepseek: {
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 1000,
      timeout: 30000, // 30秒
      retryCount: 2,
      apiEndpoint: 'https://api.deepseek.com/v1/chat/completions'
    },
    // 未来扩展：
    // openai: { ... },
    // claude: { ... },
    // gemini: { ... }
  },

  // Rate Limiting 配置
  rateLimit: {
    shared: {
      windowMs: 60 * 1000, // 1分钟
      maxRequests: 10 // 每个 IP 每分钟最多 10 次
    },
    custom: {
      windowMs: 60 * 1000,
      maxRequests: 60 // 自定义 Key 每分钟最多 60 次
    }
  },

  // Request Logging 配置
  logging: {
    enableExtensionVersion: true,
    enableBackendVersion: true,
    enableClientId: true
  }
} as const;

export type ProviderName = keyof typeof AI_CONFIG.providers;
