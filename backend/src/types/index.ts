/**
 * 全局类型定义
 * Phase 09 — Backend Proxy
 */

// ==================== Provider 相关 ====================

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateRequest {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  /** 由 Backend 自动选择 Provider，Extension 无需指定 */
  // provider?: string; // 故意注释掉，强调 Provider 选择权在 Backend
}

export interface GenerateResponse {
  success: boolean;
  data?: {
    message: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    provider: string; // 仅用于日志，不返回给 Extension
  };
  error?: string;
  requestId: string;
}

// ==================== Refine Profile 相关 ====================

export interface RefineProfileRequest {
  rawProfileText: string;
  instruction?: string;
}

export interface RefineProfileResponse {
  success: boolean;
  data?: {
    refinedProfile: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  error?: string;
  requestId: string;
}

// ==================== Provider 抽象 ====================

export interface AIProvider {
  name: string;
  generate(request: GenerateRequest): Promise<GenerateResponse['data']>;
  refineProfile(request: RefineProfileRequest): Promise<RefineProfileResponse['data']>;
}

// ==================== 请求上下文 ====================

export interface RequestContext {
  requestId: string;
  clientId: string;
  extensionVersion: string;
  backendVersion: string;
  apiVersion: string;
  userAgent?: string;
  ip?: string;
  apiMode: 'shared' | 'custom';
  customApiKey?: string; // 仅 Custom Mode 时使用，不保存
}

// ==================== 环境变量 ====================

export interface Env {
  DEEPSEEK_API_KEY: string;
  // 未来扩展：
  // OPENAI_API_KEY?: string;
  // CLAUDE_API_KEY?: string;
  API_VERSION: string;
  ENVIRONMENT: 'development' | 'production';
  // KV Storage for rate limiting
  RATE_LIMIT_STORE: KVNamespace;
}
