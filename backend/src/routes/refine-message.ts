/**
 * /api/v1/refine-message 路由
 * 改进已生成的消息
 */

import { Env, RefineMessageRequest, RequestContext } from '../types';
import { createProvider } from '../services/provider-factory';
import { handleError } from '../middleware/error-handler';
import { successResponse, errorResponse } from '../utils/response';

/**
 * 处理 POST /api/v1/refine-message
 */
export async function handleRefineMessage(
  request: Request,
  env: Env,
  _ctx: ExecutionContext,
  requestContext: RequestContext
): Promise<Response> {
  try {
    // 1. 解析请求体
    let body: RefineMessageRequest;
    try {
      body = await request.json() as RefineMessageRequest;
    } catch (e) {
      return errorResponse('Invalid JSON body', requestContext, 400, 'INVALID_REQUEST');
    }

    // 2. 验证必需字段
    if (!body.originalContent || typeof body.originalContent !== 'string') {
      return errorResponse('originalContent is required and must be a string', requestContext, 400, 'INVALID_REQUEST');
    }
    if (!body.instruction || typeof body.instruction !== 'string') {
      return errorResponse('instruction is required and must be a string', requestContext, 400, 'INVALID_REQUEST');
    }

    // 3. 确定 API Mode
    const apiMode = request.headers.get('X-Api-Mode') || 'shared';
    requestContext.apiMode = apiMode === 'custom' ? 'custom' : 'shared';

    // 4. 如果是 Custom Mode，提取用户 API Key
    let customApiKey: string | undefined;
    if (requestContext.apiMode === 'custom') {
      customApiKey = request.headers.get('X-Custom-Api-Key') || undefined;
      if (!customApiKey) {
        return errorResponse('X-Custom-Api-Key is required for custom mode', requestContext, 400, 'INVALID_REQUEST');
      }
      requestContext.customApiKey = '[REDACTED]';
    }

    // 5. 创建 Provider
    const provider = createProvider(env);

    // 6. 调用 AI
    const result = await provider.refineMessage(body, customApiKey);

    // 6.5 验证结果
    if (!result) {
      return errorResponse('Failed to refine message', requestContext, 502);
    }

    // 7. 记录日志
    console.log('[RefineMessage]', {
      requestId: requestContext.requestId,
      clientId: requestContext.clientId,
      extensionVersion: requestContext.extensionVersion,
      backendVersion: requestContext.backendVersion,
      apiMode: requestContext.apiMode,
      originalLength: body.originalContent.length,
      refinedLength: result.refinedMessage.length,
      instruction: body.instruction,
      usage: result.usage,
      timestamp: new Date().toISOString()
    });

    // 8. 返回响应
    return successResponse({
      refinedMessage: result.refinedMessage,
      usage: result.usage
    }, requestContext);

  } catch (error) {
    return handleError(error, requestContext);
  }
}
