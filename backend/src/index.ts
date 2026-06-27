/**
 * Cloudflare Worker 入口
 * Phase 09 — Backend Proxy
 *
 * 架构亮点：
 * 1. Provider 选择权在 Backend，Extension 无感知
 * 2. 匿名 Client ID 贯穿全链路
 * 3. API 版本化（/api/v1/...）
 * 4. Request ID 全链路贯穿
 * 5. 统一错误处理和响应格式
 */

import { Env, RequestContext } from './types';
import { handleCORS, addCORSHeaders } from './middleware/cors';
import { buildRequestContext } from './middleware/request-id';
import { checkRateLimit, rateLimitResponse } from './middleware/rate-limiter';
import { handleGenerate } from './routes/generate';
import { handleRefineProfile } from './routes/refine-profile';
import { healthCheckResponse, errorResponse } from './utils/response';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      // 1. CORS Preflight
      const corsResponse = handleCORS(request);
      if (corsResponse) {
        return corsResponse;
      }

      // 2. 构建请求上下文（全链路 requestId、clientId）
      const requestContext: RequestContext = buildRequestContext(request, env);

      // 3. 解析 URL 和路径
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      // 4. 速率限制检查（健康检查除外）
      if (path !== '/health') {
        const rateLimitResult = await checkRateLimit(requestContext.clientId, env);
        if (!rateLimitResult.allowed) {
          return rateLimitResponse(rateLimitResult.resetTime);
        }
      }

      // 5. 路由
      let response: Response;

      if (path === '/health' && method === 'GET') {
        // 健康检查
        response = healthCheckResponse();
      } else if (path === `/api/${env.API_VERSION}/generate` && method === 'POST') {
        // 生成 AI 回复
        response = await handleGenerate(request, env, ctx, requestContext);
      } else if (path === `/api/${env.API_VERSION}/refine-profile` && method === 'POST') {
        // 优化 LinkedIn Profile
        response = await handleRefineProfile(request, env, ctx, requestContext);
      } else {
        // 404
        response = errorResponse('Not Found', requestContext, 404);
      }

      // 4. 添加 CORS 头
      response = addCORSHeaders(response);

      // 5. 记录响应日志
      console.log('[Response]', {
        requestId: requestContext.requestId,
        clientId: requestContext.clientId,
        method,
        path,
        status: response.status,
        timestamp: new Date().toISOString()
      });

      return response;

    } catch (error) {
      // 最外层错误捕获
      console.error('[Fatal Error]', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
          requestId: 'unknown',
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};
