# Phase 09 Technical Design

**Status:** Approved — Ready for Implementation
**Date:** 2026-06-27
**Author:** WorkBuddy AI
**Phase:** 09 — Backend Proxy
**Approved By:** User (Steven Li)

---

## Design Philosophy

> Phase 09 的目标不是"让 AI 能继续工作"，而是建立整个项目未来两到三年的后端基础设施。因此，本设计优先考虑架构的可扩展性、可维护性和安全性，而不是仅满足当前 MVP 的最低需求。

---

## 1. Backend 总体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        Chrome Extension                      │
│                                                             │
│  Popup UI (React)        Content Script (extractor.ts)      │
│       │                           │                          │
│       └───────────┬───────────────┘                          │
│                   │                                          │
│            services/llm.ts (唯一 Backend 调用入口)             │
│                   │                                          │
│           HTTPS POST /api/generate                           │
│           HTTPS POST /api/refine-profile                    │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│            Backend Proxy (Cloudflare Workers)               │
│                                                             │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │  Rate        │   │  Request     │   │  API Key     │  │
│  │  Limiter     │   │  Logger      │   │  Manager     │  │
│  │  (独立模块)  │   │              │   │              │  │
│  └──────┬──────┘   └──────┬───────┘   └──────┬───────┘  │
│         │                   │                  │          │
│         └───────────────────┼──────────────────┘          │
│                             ▼                             │
│                   ┌──────────────────┐                     │
│                   │  Provider        │                     │
│                   │  Abstraction    │                     │
│                   │  Layer          │                     │
│                   └────────┬─────────┘                     │
│                            │                                │
│         ┌──────────────────┼──────────────────┐          │
│         ▼                  ▼                  ▼          │
│   ┌──────────┐      ┌──────────┐      ┌──────────┐   │
│   │ DeepSeek  │      │  OpenAI  │      │  Claude  │   │
│   │ Provider  │      │ Provider  │      │ Provider  │   │
│   └──────────┘      └──────────┘      └──────────┘   │
│       Phase 09           Phase 10+         Phase 10+     │
│       实现               预留               预留             │
│                                                             │
│  Future (Phase 10+):                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Cloudflare D1 (DB)    │  │  KV Store │             │
│  │  User accounts, quota    │  │  Cache     │             │
│  └──────────┘  └──────────┘             │
│  ┌──────────┐                                        │
│  │  Stripe Webhooks (subscriptions)                │  │
│  └──────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

**关键设计原则：**
- Extension 不直接接触任何 API Key
- Backend 是唯一的 AI Provider 调用方
- **Provider 抽象层**：Backend 不绑定任何特定 AI 服务，未来扩展新模型无需修改业务逻辑
- **llm.ts 是唯一入口**：无论 Backend 如何升级，Popup UI 尽量无需修改
- 未来所有新功能（用户系统、订阅、配额）都在 Backend 层添加

---

## 2. 请求流程图

### Flow 2.1：Shared Mode（默认，共享 API Key）

```
Popup clicks "Generate"
        │
        ▼ 生成 requestId (UUID v4)
llm.ts: callBackendProxy({
  requestId,                      // ← 全链路贯穿
  extensionVersion: "1.0.0",
  mode: "shared",
  userProfile,
  targetProfile
})
        │
        ▼  HTTPS POST https://<worker>.workers.dev/api/generate
Backend Worker (Cloudflare)
        │
        ├── Request Logger (requestId, extensionVersion, backendVersion, ...)
        ├── Rate Limiter.check(identifier)  // 独立模块，返回 boolean
        ├── Validator.validate(requestBody)
        ├── Load shared API Key from env secret
        ├── ProviderFactory.getProvider("deepseek")  // 抽象层
        ├── provider.generateMessages(requestBody)
        │       │
        │       ▼  requestId 传递给 DeepSeek（X-Request-Id header）
        │   DeepSeek API (server-side, Key never leaves server)
        │       │
        │       ▼  JSON response (带 requestId)
        ├── ResponseFormatter.format(result, requestId)
        │
        ▼  HTTPS response { success: true, requestId, messages: [...] }
Popup displays messages
```

### Flow 2.2：Custom Mode（用户自己的 API Key）

```
Settings: User selects "Use my own API Key"
        │
        ▼
llm.ts: callBackendProxy({
  requestId,                      // ← 全链路贯穿
  extensionVersion: "1.0.0",
  mode: "custom",
  apiKey: "sk-xxx...",           // HTTPS only, 仅当前请求生命周期
  userProfile,
  targetProfile
})
        │
        ▼  HTTPS POST https://<worker>.workers.dev/api/generate
Backend Worker
        │
        ├── Request Logger (requestId, ...)
        ├── Rate Limiter.check(apiKeyHash)  // 按 Key 哈希限流
        ├── Validator.validate(requestBody)
        ├── Extract apiKey from request body (不保存)
        ├── ProviderFactory.getProvider("deepseek", apiKey)  // 用用户 Key
        ├── provider.generateMessages(requestBody)
        │       │
        │       ▼
        │   DeepSeek API (using user's key, requestId 贯穿)
        │       │
        │       ▼  Response
        ├── ResponseFormatter.format(result, requestId)
        │
        ▼  HTTPS response { success: true, requestId, ... }
Popup displays messages
```

**Security note:** Custom mode 的 API Key 在传输过程中使用 HTTPS 加密，在服务端仅在当前请求生命周期内存在，请求结束后被 GC 回收。未来加入用户登录后，可升级为服务端加密存储。

**Request ID 全链路贯穿：** `requestId` 在 Extension 端生成，通过 `X-Request-Id` header 传递给 Backend，Backend 调用 Provider 时一并传入，Provider 调用 AI API 时通过自定义 header 传递。整条链路使用同一个 `requestId`，方便日志关联排查。

---

## 3. API 接口设计

### 3.1 基础信息

| 项目 | 值 |
|------|-----|
| Base URL | `https://linkedin-ai-backend.workers.dev` (Phase 09 默认，后续可绑定自定义域名) |
| Protocol | HTTPS only |
| API Version | `/api/v1/...` (版本化，避免未来破坏兼容性) |
| Auth (Phase 09) | None (Phase 10+ 加入用户登录) |
| Content-Type | `application/json` |
| Request ID Header | `X-Request-Id: <uuid>` (全链路贯穿) |

### 3.2 `POST /api/generate`

生成连接消息。

**Request Body：**

```json
{
  "requestId": "uuid-v4-string",     // 必填，全链路贯穿
  "extensionVersion": "1.0.0",      // 必填
  "mode": "shared" | "custom",
  "apiKey": "sk-xxx...",            // only if mode === "custom"
  "model": "deepseek-chat",         // optional, default: config default
  "temperature": 0.7,               // optional, default: config default
  "userProfile": {
    "name": "Steven Li",
    "headline": "...",
    "school": "...",
    "company": "...",
    "interests": "...",
    "goals": "..."
  },
  "targetProfile": {
    "name": "Jane Doe",
    "headline": "...",
    "company": "...",
    "school": "...",
    "about": "..."
  }
}
```

**Response (Success)：**

```json
{
  "success": true,
  "requestId": "uuid-v4-string",    // 与请求一致
  "backendVersion": "1.0.0",
  "messages": {
    "professional": "Dear Jane, ...",
    "friendly": "Hi Jane! ...",
    "entrepreneur": "Hey Jane, ...",
    "academic": "Dear Dr. Doe, ..."
  },
  "usage": {
    "promptTokens": 512,
    "completionTokens": 128,
    "totalTokens": 640
  }
}
```

**Response (Error)：**

```json
{
  "success": false,
  "requestId": "uuid-v4-string",    // 即使错误也返回 requestId
  "error": {
    "code": "RATE_LIMITED" | "INVALID_REQUEST" | "PROVIDER_ERROR" | "SERVER_ERROR",
    "message": "Human-readable message for popup to display",
    "retryAfter": 30                 // seconds, only for RATE_LIMITED
  }
}
```

**错误码设计（Provider 无关）：**
- `RATE_LIMITED` — 限流触发
- `INVALID_REQUEST` — 请求体验证失败（缺少字段、格式错误）
- `PROVIDER_ERROR` — AI Provider 返回错误（覆盖 DeepSeek/OpenAI/Claude 等所有 Provider）
- `SERVER_ERROR` — Backend 内部错误

---

### 3.3 `POST /api/refine-profile`

优化用户导入的 LinkedIn 原始资料文本（Phase 6/7 功能）。

**Request Body：**

```json
{
  "requestId": "uuid-v4-string",
  "extensionVersion": "1.0.0",
  "mode": "shared" | "custom",
  "apiKey": "sk-xxx...",       // only if mode === "custom"
  "rawProfileText": "Steven Li\nUniversity of California, Berkeley\n..."
}
```

**Response (Success)：**

```json
{
  "success": true,
  "requestId": "uuid-v4-string",
  "backendVersion": "1.0.0",
  "userProfile": {
    "name": "Steven Li",
    "headline": "UC Berkeley Student Researcher",
    "school": "University of California, Berkeley",
    "company": "",
    "interests": "...",
    "goals": "..."
  }
}
```

---

### 3.4 Future Endpoints（Phase 10+，预留设计空间）

| Endpoint | 用途 | 需要登录 |
|----------|------|----------|
| `POST /api/auth/login` | 用户登录 | No |
| `GET /api/user/profile` | 获取用户云端资料 | Yes |
| `GET /api/user/usage` | 查询当月用量 | Yes |
| `POST /api/user/subscribe` | 订阅管理 | Yes |
| `GET /api/user/history` | 消息历史 | Yes |

---

## 4. Backend 文件结构

### 4.1 Cloudflare Workers 项目结构

```
backend/
├── wrangler.toml              # Cloudflare Workers 配置文件
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts               # Worker 入口，路由分发，全局错误处理
│   ├── config/
│   │   └── ai.ts            # 统一 AI 配置（默认模型、Temperature、Timeout 等）
│   ├── routes/
│   │   ├── generate.ts       # POST /api/generate handler
│   │   └── refine-profile.ts # POST /api/refine-profile handler
│   ├── services/
│   │   ├── provider.ts       # AI Provider 抽象接口 (Interface)
│   │   ├── providers/
│   │   │   ├── deepseek.ts   # DeepSeek Provider (Phase 09 实现)
│   │   │   ├── openai.ts     # OpenAI Provider (Phase 10+ 预留)
│   │   │   └── claude.ts    # Claude Provider (Phase 10+ 预留)
│   │   ├── provider-factory.ts  # Provider 工厂：根据配置/请求选择 Provider
│   │   ├── rate-limiter.ts   # Rate Limiting 独立模块 (封装，预留未来接口)
│   │   └── request-logger.ts # 请求日志 (含 extensionVersion, backendVersion)
│   ├── middleware/
│   │   ├── cors.ts           # CORS headers
│   │   ├── error-handler.ts  # 统一错误处理 (所有错误返回统一格式)
│   │   ├── validator.ts      # 请求体校验
│   │   └── request-id.ts     # Request ID 生成与传递
│   ├── types/
│   │   └── index.ts          # 共享 TypeScript 类型
│   └── utils/
│       ├── response.ts        # 统一响应格式 helper
│       └── api-key.ts         # API Key 管理工具 (Shared/Custom 模式)
├── .dev.vars                  # 本地开发环境变量（不提交 git）
└── tests/
    ├── generate.test.ts
    └── rate-limiter.test.ts
```

**关键设计决策：**

1. **`services/provider.ts` (抽象接口)** — 所有 AI Provider 实现此接口，`generateMessages()` 和 `refineProfile()` 两个方法。新增 Provider 只需新增文件，不修改现有业务逻辑。

2. **`config/ai.ts` (统一配置)** — 默认模型、Temperature、Max Tokens、Timeout、Retry Count 全部集中管理，未来修改无需全局搜索。

3. **`services/rate-limiter.ts` (独立模块)** — 封装为独立类，构造函数接受 `identifierExtractor` 参数，未来从 "IP/Custom Key" 升级到 "User ID/Tier/Quota" 时只需替换 extractor，不修改 Rate Limiter 核心逻辑。

4. **`middleware/request-id.ts`** — 统一生成/传递 `requestId`，确保全链路贯穿。

### 4.2 Extension 端改动（最小改动原则）

```
src/services/llm.ts          ← 重构：从直接调用 DeepSeek 改为调用 Backend Proxy
                                （唯一 Backend 调用入口，未来升级尽量不改）
src/types/index.ts            ← 新增 BackendProxyRequest, BackendProxyResponse 类型
                                （新增 Provider 无关的错误码类型）
popup/App.tsx                 ← 最小改动：仅修改调用 llm.ts 的方式（内部重构，UI 不变）
popup/Settings.tsx            ← 新增 API Mode 选择 UI（Shared/Custom 切换）
```

**原则：**
- Phase 09 不改变任何 UI 外观或用户流程，仅改变 API 调用方式。
- `llm.ts` 是唯一调用 Backend 的入口，Popup UI 的其他部分不直接接触 Backend。
- 未来 Backend 升级（登录、订阅、历史记录、多模型）时，主要改动集中在 `llm.ts`，Popup UI 尽量不变。

---

## 5. AI Provider 抽象层设计

### 5.1 接口定义 (`services/provider.ts`)

```typescript
interface AIProvider {
  /**
   * 生成连接消息（4 种风格）
   */
  generateMessages(request: GenerateRequest): Promise<GenerateResponse>;

  /**
   * 优化用户导入的 LinkedIn 原始资料文本
   */
  refineProfile(request: RefineProfileRequest): Promise<RefineProfileResponse>;
}

interface GenerateRequest {
  requestId: string;
  model?: string;
  temperature?: number;
  userProfile: UserProfile;
  targetProfile: TargetProfile;
  apiKey?: string;  // only for custom mode
}

interface GenerateResponse {
  messages: {
    professional: string;
    friendly: string;
    entrepreneur: string;
    academic: string;
  };
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### 5.2 Provider Factory (`services/provider-factory.ts`)

```typescript
function getProvider(providerName: string, apiKey?: string): AIProvider {
  switch (providerName) {
    case "deepseek":
      return new DeepSeekProvider(apiKey);
    case "openai":
      return new OpenAIProvider(apiKey);
    case "claude":
      return new ClaudeProvider(apiKey);
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}
```

**Phase 09 默认配置：** `config/ai.ts` 中 `defaultProvider = "deepseek"`，未来修改只需改配置文件。

### 5.3 新增 Provider 步骤（Phase 10+）

1. 创建 `services/providers/<new-provider>.ts`，实现 `AIProvider` 接口
2. 在 `provider-factory.ts` 的 switch 中新增 case
3. 在 `config/ai.ts` 中新增该 Provider 的默认配置（model, temperature 等）
4. 无需修改 `routes/generate.ts` 或 `routes/refine-profile.ts`

---

## 6. 统一配置文件设计 (`config/ai.ts`)

```typescript
export const AI_CONFIG = {
  // 默认 Provider（Phase 09: "deepseek"）
  defaultProvider: "deepseek",

  // Provider 级别默认配置
  providers: {
    deepseek: {
      model: "deepseek-chat",
      temperature: 0.7,
      maxTokens: 1024,
      timeoutMs: 30000,
      retry: {
        maxRetries: 3,
        backoffBaseMs: 1000,  // 1s, 2s, 4s
      },
    },
    openai: {
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 1024,
      timeoutMs: 30000,
      retry: { maxRetries: 3, backoffBaseMs: 1000 },
    },
    // ... 未来新增 Provider 配置
  },

  // Rate Limiting 配置
  rateLimit: {
    shared: {
      identifierType: "ip",       // Phase 09: IP; Phase 10+: "userId"
      maxRequests: 10,
      windowSeconds: 60,
    },
    custom: {
      identifierType: "apiKeyHash",
      maxRequests: 30,
      windowSeconds: 60,
    },
  },

  // 请求日志配置
  logging: {
    enabled: true,
    level: "info",  // "debug" | "info" | "warn" | "error"
    includeExtensionVersion: true,
    includeBackendVersion: true,
  },
};
```

**好处：**
- 修改默认模型 → 只改 `config/ai.ts`
- 调整限流参数 → 只改 `config/ai.ts`
- 新增 Provider 默认配置 → 只改 `config/ai.ts`
- 不散落在多个文件中

---

## 7. Rate Limiting 方案

### 7.1 设计目标

- 防止 API 滥用（保护 Shared Mode Key 配额）
- 公平分配资源（Shared Mode 下多用户共享 Key）
- **封装为独立模块，预留未来升级接口**

### 7.2 独立模块设计 (`services/rate-limiter.ts`)

```typescript
interface RateLimiterConfig {
  identifierType: "ip" | "apiKeyHash" | "userId" | "tierQuota";
  maxRequests: number;
  windowSeconds: number;
}

class RateLimiter {
  constructor(config: RateLimiterConfig);

  /**
   * 检查是否允许请求
   * @returns { allowed: boolean, retryAfter?: number }
   */
  async check(identifier: string): Promise<RateLimitResult>;
}

// Phase 09 使用方式：
const limiter = new RateLimiter(AI_CONFIG.rateLimit.shared);
const result = await limiter.check(clientIP);

// Phase 10+ 升级方式（不修改 RateLimiter 类）：
// 只需传入不同的 identifier（userId 代替 IP）和 config（tierQuota 代替 ip）
const limiterV2 = new RateLimiter({
  identifierType: "tierQuota",
  maxRequests: getUserQuota(userId),  // 根据订阅等级动态计算
  windowSeconds: 86400,  // 按天限流
});
```

**封装原则：**
- `RateLimiter` 类只关心 `identifier` + `config`，不关心 identifier 是怎么来的
- 未来升级限流维度（IP → User ID → Tier Quota）时，只需修改 `identifier` 的提取逻辑，不修改 `RateLimiter` 核心代码

### 7.3 Phase 09 实现（简单有效）

**Shared Mode：**
- 基于 IP 地址限流（`request.headers.get("CF-Connecting-IP")`)
- 限制：**每分钟 10 次请求 / IP**（可配置，见 `config/ai.ts`）
- 超限返回 `429` + `Retry-After` header

**Custom Mode：**
- 基于 API Key 的哈希值限流（不存真实 Key，存 `hash(apiKey)`）
- 限制：**每分钟 30 次请求 / API Key**（更高，因为用户用自己的 Key）
- 注：Custom Mode 的限流主要防止单个 Key 被滥用，实际成本由用户承担

### 7.4 技术实现

使用 **Cloudflare Workers KV** 存储限流计数器：

```
KV Key:   rate_limit:{identifier}:{minute_timestamp}
KV Value: request_count
TTL:      config.windowSeconds + 10 seconds (auto expire)
```

逻辑：
```
1. 提取 identifier（IP 或 apiKeyHash，由调用方决定）
2. 生成当前时间窗口的 KV key
3. 原子递增计数器（KV atomic operations）
4. 如果计数器 > 限制 → 返回 { allowed: false, retryAfter }
5. 否则 → 返回 { allowed: true }
```

### 7.5 Future：Phase 10+ 升级方案

| 阶段 | 限流方式 | 说明 |
|------|----------|------|
| Phase 09 | IP / API Key hash | 简单，无需登录 |
| Phase 10 | User ID（登录后） | 精准按用户配额 |
| Phase 11 | Tier-based quota | Free tier: 50/day; Pro: 500/day |
| Phase 12 | Stripe 订阅集成 | 付费用户更高配额 |

---

## 8. Logging 方案

### 8.1 设计目标

- 排查问题需要（哪个用户遇到了什么错误）
- 不包含敏感信息（不记录 API Key、用户资料内容）
- 成本可控（日志存储有成本）
- **记录 extensionVersion 和 backendVersion**

### 8.2 Phase 09 实现

**记录内容：**

```typescript
interface RequestLog {
  requestId: string;        // 全链路贯穿的 UUID
  timestamp: number;
  method: string;            // "generate" | "refine-profile"
  mode: string;              // "shared" | "custom"
  extensionVersion: string;   // 新增：Extension 版本（方便定位多版本 Bug）
  backendVersion: string;    // 新增：Backend 版本
  ipHash: string;            // IP 的单向哈希（不存真实 IP）
  status: number;            // HTTP status code
  durationMs: number;        // 请求处理时长
  provider?: string;         // AI Provider 名称（未来可能有多个）
  providerStatusCode?: number;// Provider 返回的状态码
  errorCode?: string;        // 错误代码（如果有）
  userAgent?: string;        // Extension 标识
}
```

**不记录：**
- API Key（任何模式下）
- userProfile / targetProfile 的具体内容
- 生成的消息内容

**存储方式：**

Phase 09 使用 **Cloudflare Workers 内置 `console.log`** + **Cloudflare Dashboard Logs** 查看。

优点：零成本，开箱即用，满足 Phase 09 需求。
缺点：日志保留时间有限（Free plan 24小时，Paid plan 15天）。

### 8.3 Future：Phase 10+ 升级方案

| 阶段 | 日志方案 | 说明 |
|------|----------|------|
| Phase 09 | console.log + Cloudflare Dashboard | 零成本，保留期短 |
| Phase 10 | Cloudflare Logpush → Supabase | 长期存储，可查询 |
| Phase 11 | 结构化日志 + 告警 | Sentry 或 Grafana Cloud |
| Phase 12 | 用户行为分析（匿名） | PostHog 或 Mixpanel |

---

## 9. API Key 管理方案

### 9.1 Shared Mode（服务端 Key 管理）

```
Cloudflare Workers Secrets
        │
        ▼
wrangler secret put DEEPSEEK_API_KEY
        │
        ▼
Key 存储在 Cloudflare 加密 Secrets 中
        │
        ▼
Worker 运行时通过 process.env.DEEPSEEK_API_KEY 访问
        │
        ▼
Key 永远不会出现在：
  - 客户端代码中
  - 网络请求的 URL 参数中
  - 控制台日志中
  - Git 仓库中
```

**DeepSeek API Key 获取方式：**
- 你在 [platform.deepseek.com](https://platform.deepseek.com) 申请 API Key
- 通过 `wrangler secret put DEEPSEEK_API_KEY` 命令存入 Cloudflare
- 只有你（项目管理员）能修改或查看

### 9.2 Custom Mode（用户自带 Key）

```
用户浏览器（chrome.storage.local）
        │
        ▼  HTTPS POST body（加密传输）
Backend Worker（内存中，仅当前请求生命周期）
        │
        ▼
使用用户 Key 调用 AI Provider
        │
        ▼
请求结束 → Key 被 GC 回收（不写入任何持久存储）
```

**Phase 09 不做：**
- ❌ 不将用户 Key 保存到数据库
- ❌ 不验证用户 Key 的余额（Provider 会返回错误，我们直接转发）

**Phase 10+ 升级方案（加入用户登录后）：**
- 用户登录后，可以将自己的 API Key 加密存储在 D1 数据库中
- 使用 AES-256-GCM 加密，密钥存储在 Cloudflare Secrets 中

---

## 10. 前端-后端接口稳定性设计

### 10.1 分层原则

```
Popup UI (React components)
        │
        ▼  (内部调用，不直接接触 Backend)
llm.ts  (唯一 Backend 调用入口)
        │
        ▼  HTTPS + JSON
Backend Proxy (Cloudflare Workers)
        │
        ▼
AI Provider Abstraction Layer
        │
        ▼
DeepSeek / OpenAI / Claude / ...
```

### 10.2 llm.ts 的职责

`llm.ts` 是 Extension 调用 Backend 的**唯一入口**，职责包括：

1. 生成 `requestId` (UUID v4)
2. 读取当前 Extension 版本号（`chrome.runtime.getManifest().version`）
3. 读取用户设置（mode, custom apiKey 等）
4. 构造 HTTPS 请求发送到 Backend
5. 处理 Backend 响应（成功/错误）
6. 错误处理（网络错误、Backend 错误、Provider 错误）

**未来 Backend 升级时：**
- 新增用户登录 → 改动集中在 `llm.ts`（新增 auth token 逻辑）
- 新增多模型选择 → 改动集中在 `llm.ts`（新增 model 参数）
- 新增消息历史 → 改动集中在 `llm.ts`（新增 history 参数）
- **Popup UI 尽量不需要修改**

### 10.3 接口稳定性保证

- API Endpoint 使用业务语义（`/api/generate`），不体现模型名称
- 请求/响应格式设计为 Provider 无关（错误码 `PROVIDER_ERROR` 覆盖所有 Provider）
- 新增字段使用 optional（向后兼容）
- `requestId` 全链路贯穿，方便未来全链路追踪

---

## 11. 技术栈确认

### 11.1 Backend: Cloudflare Workers + D1 + KV

**核心理由：**

1. **全球边缘网络**：Chrome Extension 的用户可能在全球任何地方，Cloudflare 的 200+ 边缘节点意味着每次 API 调用的延迟最低（通常 < 50ms）。

2. **成本极低**：Free Tier 每天 100,000 次请求，对 Phase 10 Beta 阶段完全够用。即便付费，每百万次请求仅 $0.50。

3. **原生扩展性**：Cloudflare 全家桶（D1 数据库、KV 存储、R2 对象存储）都与 Workers 深度集成，未来加用户系统、配额管理、消息历史几乎零摩擦。

4. **Serverless，无运维**：不需要管理服务器、不需要担心扩容、不需要配置负载均衡。deploy 完就不管了。

5. **与 Chrome Extension 的天然契合**：Cloudflare 的 `CF-Connecting-IP` header 让 Rate Limiting 实现极简单。

### 11.2 部署域名

Phase 09 使用 Cloudflare 默认 `*.workers.dev` 域名：
- 示例：`https://linkedin-ai-backend.workers.dev`
- 不购买自定义域名
- 等 Beta 或正式上线时，再绑定自己的域名

### 11.3 Shared Mode 成本

- Phase 09：由你（Steven Li）承担 DeepSeek API 调用费用
- Phase 09 不加入订阅系统
- Phase 10 再根据真实用户数量决定是否增加免费额度限制、每日配额或订阅方案

---

## 12. 风险分析

### 12.1 技术风险

| 风险 | 严重程度 | 缓解措施 |
|------|----------|----------|
| AI Provider API 故障/不可用 | 高 | Backend 返回明确错误信息；Extension 显示友好错误提示 |
| Cloudflare Workers 冷启动延迟 | 低 | Workers 冷启动 < 10ms，几乎无感 |
| Rate Limiting 过于严格导致误拦 | 中 | 限制值设得宽松（10 req/min），Phase 10 根据用户反馈调整 |
| Custom Mode 用户 Key 泄露（传输中） | 低 | HTTPS 加密传输；未来加入用户登录后可升级为服务端存储 |
| Backend 成为单点故障 | 中 | Cloudflare 有 99.9%+ SLA；可快速 rollback 到 direct API 模式（feature flag） |
| Provider 抽象层增加复杂度 | 低 | Phase 09 仅实现 DeepSeek Provider，抽象层代码量少，不影响稳定性 |

### 12.2 产品风险

| 风险 | 严重程度 | 缓解措施 |
|------|----------|----------|
| Shared Mode 的 API 成本失控 | 高 | Rate Limiting + 未来 Phase 10 加入用量监控 + 用户登录后可按用户追踪成本 |
| 用户不愿意用 Shared Mode（担心隐私） | 中 | Privacy Policy 明确说明"不记录用户资料内容"；同时提供 Custom Mode 选项 |
| Chrome Web Store 审核拒绝（涉及后端） | 中 | Privacy Policy 更新说明后端数据处理方式；符合 GDPR/CCPA |

### 12.3 时间风险

| 风险 | 严重程度 | 缓解措施 |
|------|----------|----------|
| 第一次接触 Cloudflare Workers，学习曲线导致延迟 | 中 | Phase 09 范围有限（仅 2 个 API endpoint），我可以生成所有代码，你主要负责 deploy 和 secret 管理 |
| Extension 端重构引入 bug | 中 | 保持 UI 不变，仅重构 `llm.ts` 内部实现；写简单的 manual test plan |
| Provider 抽象层设计过度工程化 | 低 | Phase 09 仅实现 DeepSeek Provider，抽象层不影响功能，只是代码组织方式 |

---

## 13. 实施计划（Implementation Plan）

### Phase 09 分 4 个 Sprint 完成

---

#### Sprint 09-1：Backend 基础框架 + Provider 抽象层 + 第一个 API

**目标：** 搭建 Cloudflare Workers 项目，实现 Provider 抽象层，`/api/generate` 在 Shared Mode 下能工作。

**任务：**
1. 初始化 Cloudflare Workers 项目（`wrangler init`）
2. 创建 `config/ai.ts`（统一配置）
3. 实现 `services/provider.ts`（抽象接口）
4. 实现 `services/providers/deepseek.ts`（DeepSeek Provider）
5. 实现 `services/provider-factory.ts`（Provider 工厂）
6. 实现 `routes/generate.ts`（Shared Mode のみ）
7. 实现 `middleware/request-id.ts`（Request ID 全链路贯穿）
8. 配置 `wrangler.toml` + 设置 `DEEPSEEK_API_KEY` secret
9. 本地测试（`wrangler dev`）
10. Deploy 到 Cloudflare（测试环境）

**交付物：** Backend 部署在 `*.workers.dev` 子域名，可以用 curl 测试 `/api/generate`。

---

#### Sprint 09-2：Extension 端重构 + Custom Mode + Provider 无关错误处理

**目标：** Extension 从直接调用 DeepSeek 改为调用 Backend Proxy；支持 Custom Mode；错误处理 Provider 无关。

**任务：**
1. 重构 `src/services/llm.ts`：新增 `callBackendProxy()` 函数（唯一 Backend 入口）
2. 修改 `popup/Settings.tsx`：新增 API Mode 选择 UI（Shared/Custom 切换）
3. 实现 Custom Mode 逻辑（API Key 通过 HTTPS 发送到 Backend）
4. 更新 `src/types/index.ts`：新增 BackendProxy 相关类型（Provider 无关错误码）
5. 确保 `requestId` 全链路贯穿（Extension → Backend → Provider → Backend → Extension）
6. 手动测试：Shared Mode ✅、Custom Mode ✅、错误场景 ✅

**交付物：** Extension 完全通过 Backend Proxy 工作，Settings 页面有模式切换，错误码 Provider 无关。

---

#### Sprint 09-3：Rate Limiting + Request Logging + 错误处理 + 配置管理

**目标：** 加入生产级别的 Rate Limiting、Logging、统一错误处理；配置集中管理。

**任务：**
1. 实现 `services/rate-limiter.ts`（独立模块，封装，预留未来接口）
2. 实现 `services/request-logger.ts`（结构化日志，含 extensionVersion、backendVersion）
3. 实现 `middleware/error-handler.ts`（统一错误格式，Provider 无关错误码）
4. 实现 `middleware/validator.ts`（请求体校验）
5. 确保 `config/ai.ts` 被正确加载和使用
6. 测试限流逻辑（连续快速请求，验证 429 响应）
7. 测试错误场景（无效 API Key、Provider 故障、超时）

**交付物：** Backend 有完整的 Rate Limiting、Logging、统一错误处理；配置集中管理。

---

#### Sprint 09-4：文档更新 + Review Checklist + Done Report

**目标：** 更新所有项目文档，通过 Review Checklist，完成 Phase 09 Done Report。

**任务：**
1. 更新 `docs/Architecture.md`（加入 Backend Proxy 架构、Provider 抽象层）
2. 更新 `docs/Decisions.md`（新增 ADR-013: Backend Proxy Architecture；ADR-014: Provider Abstraction Layer）
3. 更新 `docs/TechStack.md`（加入 Backend 技术栈）
4. 更新 `docs/Roadmap.md`（Phase 09 状态更新）
5. 运行 `docs/ReviewChecklist.md` 所有检查项
6. 写 `phases/Phase09_Done.md`

**交付物：** 文档与代码一致，Review Checklist 全通过，Phase 09 关闭。

---

### 实施时间估算

| Sprint | 估算时间 | 说明 |
|--------|----------|------|
| 09-1 | 2-3 天 | 第一次接触 Cloudflare Workers + Provider 抽象层设计 |
| 09-2 | 1-2 天 | Extension 端改动有限，主要是重构 |
| 09-3 | 2 天 | Rate Limiting 和 KV 需要调试 |
| 09-4 | 1 天 | 文档更新 |
| **总计** | **6-8 天** | 可按实际进度调整 |

---

## 14. 已确认决策

以下决策已在 Design 阶段确认，编码阶段不再变更：

1. ✅ **Backend 技术栈**：Cloudflare Workers
2. ✅ **部署域名**：Phase 09 使用 `*.workers.dev`，不购买自定义域名
3. ✅ **Shared Mode 成本**：Phase 09 由你承担，不加入订阅系统
4. ✅ **API Endpoint 设计**：使用业务语义（`/api/generate`），不体现模型名称
5. ✅ **Provider 抽象层**：Backend 不绑定特定 AI Provider，未来扩展新模型只需新增 Provider 文件
6. ✅ **Request ID 全链路贯穿**：Extension → Backend → Provider → Backend → Extension
7. ✅ **统一配置文件**：`config/ai.ts` 集中管理所有 AI 参数
8. ✅ **llm.ts 是唯一入口**：未来 Backend 升级尽量不改 Popup UI
9. ✅ **Rate Limiter 独立模块**：封装，预留未来升级接口
10. ✅ **Custom Mode Phase 09 实现**：一起做，不推迟

---

## 15. 补充优化点（用户确认后加入设计）

### 15.1 Provider 选择权完全放在 Backend

**决策：** Extension 不应指定或感知当前使用哪个 AI Provider。

**实现方式：**
- Extension 请求中**不包含 `model` 字段**（或包含但仅作为 hint，Backend 可覆盖）
- `ProviderFactory` 根据 **Backend 配置**、**未来用户等级**、**策略**自动选择 Provider
- Extension 始终调用统一的业务接口，无需知道后端用的是什么模型

**示例：**
```typescript
// Extension 请求（不指定 provider）
{ "requestId": "...", "mode": "shared", "userProfile": {...} }

// Backend 内部决策（ProviderFactory）
function selectProvider(request: GenerateRequest): AIProvider {
  // Phase 09: 始终返回 DeepSeek
  // Phase 10+: 根据 userTier、可用配额、模型性能等自动选择
  return new DeepSeekProvider(env.DEEPSEEK_API_KEY);
}
```

**好处：**
- Extension 代码极简，未来升级模型无需发版
- Backend 可以灰度切换模型、做 A/B test
- 用户无感知升级

---

### 15.2 增加匿名 Client ID

**决策：** Phase 09 不做登录系统，但 Extension 首次安装时生成 UUID（`clientId`）并持久保存，每次请求携带。

**实现方式：**

**Extension 端（`src/services/llm.ts`）：**
```typescript
// 首次安装时生成并保存
async function getOrCreateClientId(): Promise<string> {
  let clientId = await chrome.storage.local.get("clientId");
  if (!clientId) {
    clientId = generateUUIDv4();
    await chrome.storage.local.set({ clientId });
  }
  return clientId;
}

// 每次请求携带
const requestBody = {
  requestId: generateRequestId(),
  clientId: await getOrCreateClientId(),  // 新增
  extensionVersion: "...",
  mode: "shared",
  // ...
};
```

**Backend 端：**
- 使用 `clientId` 进行匿名识别
- Rate Limiting 可以按 `clientId` 维度限流（比 IP 更精准）
- 日志记录 `clientId`（不记录用户身份，仅用于排查）
- **Phase 10 用户登录后**：将 `clientId` 与 `userId` 关联，实现历史数据平滑迁移

**`clientId` 生成规则：**
- 首次安装时生成 UUID v4
- 保存在 `chrome.storage.local` 的 `clientId` key
- 用户清除 Extension 数据或重装后会生成新的 `clientId`（匿名，无影响）

---

### 15.3 接口版本化

**决策：** 从现在开始预留 API Version，避免未来升级接口时破坏兼容性。

**实现方式：**

**Backend 路由（`src/index.ts`）：**
```typescript
// 版本化路由
router.post("/api/v1/generate", async (request) => { ... });
router.post("/api/v1/refine-profile", async (request) => { ... });

// 未来升级：
// router.post("/api/v2/generate", async (request) => { ... });
```

**Extension 请求：**
```typescript
const BACKEND_API_BASE = "https://<worker>.workers.dev/api/v1";

fetch(`${BACKEND_API_BASE}/generate`, { ... });
fetch(`${BACKEND_API_BASE}/refine-profile`, { ... });
```

**版本兼容性策略：**
- Phase 09: `v1` 唯一版本
- Phase 10+: 如果需要 breaking change，发布 `v2`，同时保留 `v1` 一段时间
- Extension 在请求中携带 `Accept: application/json; version=v1` header（可选，未来使用）

---

## 16. 总结

这份 Technical Design 的核心思想是：

> **Phase 09 不是在"修一个功能"，而是在"建一个平台"。**

Backend Proxy 是整个 SaaS 架构的地基。今天多花时间在架构设计上，未来（Phase 10-12）扩展功能时会节省数倍的时间。

**关键架构决策回顾：**
- Provider 抽象层 → 未来扩展新模型零成本
- 统一配置文件 → 未来修改参数无需全局搜索
- Rate Limiter 独立模块 → 未来升级限流维度不修改核心逻辑
- llm.ts 唯一入口 → 未来 Backend 升级尽量不改 UI
- Request ID 全链路贯穿 → 未来排查问题效率高

**下一步：**
Design 已获批准，进入 **Sprint 09-1** 开始编码。

---

*This document was approved on 2026-06-27. No further changes should be made without explicit user approval.*
