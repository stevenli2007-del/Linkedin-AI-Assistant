/**
 * 全局类型定义
 * Backend Proxy
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
    provider: string;
  };
  error?: string;
  requestId: string;
}
// ==================== Refine Profile ====================

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
// ==================== AI Provider ====================

export interface AIProvider {
  name: string;
  generate(
    request: GenerateRequest,
    apiKey?: string
  ): Promise<GenerateResponse["data"]>;

  refineProfile(
    request: RefineProfileRequest,
    apiKey?: string
  ): Promise<RefineProfileResponse["data"]>;
}
// ==================== Request Context ====================

export interface RequestContext {
  requestId: string;
  clientId: string;

  extensionVersion: string;
  backendVersion: string;
  apiVersion: string;

  userAgent?: string;
  ip?: string;

  apiMode: "shared" | "custom";
  /**
   * 用户自己的 API Key
   * Backend 不保存
   */
  customApiKey?: string;

  /**
   * 用户选择的 Provider
   * DeepSeek / OpenAI / Ollama
   */
  provider?: AIProviderType;
}
// ==================== Provider Type ====================
export type AIProviderType =
  | "deepseek"
  | "openai"
  | "ollama";
// ==================== Provider Config ====================

export interface ProviderConfig {
  model: string;
  apiEndpoint: string;
  timeout?: number;
  temperature?: number;
  maxTokens?: number;
}

// ==================== Environment ====================

export interface Env {

  /**
   * Shared API Keys
   */

  DEEPSEEK_API_KEY?: string;
  OPENAI_API_KEY?: string;
  /**
   * Ollama 一般没有 API Key，
   * 只需要 URL
   */
  OLLAMA_BASE_URL?: string;
  API_VERSION: string;
  ENVIRONMENT: "development" | "production";
  RATE_LIMIT_STORE: KVNamespace;
}