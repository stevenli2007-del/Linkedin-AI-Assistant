/**
 * /api/v1/generate 路由
 * 生成 AI 回复（消息生成）
 */

import { Env, GenerateRequest, RequestContext } from '../types';
import { createProvider } from '../services/provider-factory';
import { handleError } from '../middleware/error-handler';
import { successResponse, errorResponse } from '../utils/response';

/**
 * 处理 POST /api/v1/generate
 */
export async function handleGenerate(
  request: Request,
  env: Env,
  _ctx: ExecutionContext,
  requestContext: RequestContext
): Promise<Response> {
  try {
    // 1. 解析请求体
    let body: GenerateRequest;
    try {
      body = await request.json() as GenerateRequest;
    } catch (e) {
      return errorResponse('Invalid JSON body', requestContext, 400, 'INVALID_REQUEST');
    }

    // 2. 验证必需字段
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return errorResponse('messages is required and must be a non-empty array', requestContext, 400, 'INVALID_REQUEST');
    }

    // 3. 验证 messages 格式
    for (const msg of body.messages) {
      if (!msg.role || !msg.content) {
        return errorResponse('Each message must have role and content', requestContext, 400, 'INVALID_REQUEST');
      }
    }

    // 4. 确定 API Mode（从请求头或请求体）
    const apiMode = request.headers.get('X-Api-Mode') || 'shared';
    requestContext.apiMode = apiMode === 'custom' ? 'custom' : 'shared';

    // 5. 如果是 Custom Mode，提取用户 API Key（仅用于当前请求）
    let customApiKey: string | undefined;
    if (requestContext.apiMode === 'custom') {
      customApiKey = request.headers.get('X-Custom-Api-Key') || undefined;
      if (!customApiKey) {
        return errorResponse('X-Custom-Api-Key is required for custom mode', requestContext, 400, 'INVALID_REQUEST');
      }
      requestContext.customApiKey = '[REDACTED]'; // 不记录真实 Key
    }

    // 6. 创建 Provider（Backend 自动选择，Extension 无感知）
    const provider = createProvider(env);

    // 7. 调用 AI
    const result = await provider.generate(body, customApiKey);

    // 7.5 验证结果
    if (!result) {
      return errorResponse('Failed to generate AI response', requestContext, 502);
    }

    // 8. 记录日志（包含 extensionVersion、backendVersion、clientId）
    console.log('[Generate]', {
      requestId: requestContext.requestId,
      clientId: requestContext.clientId,
      extensionVersion: requestContext.extensionVersion,
      backendVersion: requestContext.backendVersion,
      apiMode: requestContext.apiMode,
      provider: result.provider,
      usage: result.usage,
      timestamp: new Date().toISOString()
    });

    // 9. 返回响应（不返回 provider 信息给 Extension）
    return successResponse({
      message: result.message,
      usage: result.usage
    }, requestContext);

  } catch (error) {
    return handleError(error, requestContext);
  }
}
