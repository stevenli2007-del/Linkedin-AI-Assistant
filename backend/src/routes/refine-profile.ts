/**
 * /api/v1/refine-profile 路由
 * 优化 LinkedIn Profile
 */

import { Env, RefineProfileRequest, RequestContext } from '../types';
import { createProvider } from '../services/provider-factory';
import { handleError } from '../middleware/error-handler';
import { successResponse, errorResponse } from '../utils/response';

/**
 * 处理 POST /api/v1/refine-profile
 */
export async function handleRefineProfile(
  request: Request,
  env: Env,
  _ctx: ExecutionContext,
  requestContext: RequestContext
): Promise<Response> {
  try {
    // 1. 解析请求体
    let body: RefineProfileRequest;
    try {
      body = await request.json() as RefineProfileRequest;
    } catch (e) {
      return errorResponse('Invalid JSON body', requestContext, 400, 'INVALID_REQUEST');
    }

    // 2. 验证必需字段
    if (!body.rawProfileText || typeof body.rawProfileText !== 'string') {
      return errorResponse('rawProfileText is required and must be a string', requestContext, 400, 'INVALID_REQUEST');
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
    const result = await provider.refineProfile(body, customApiKey);

    // 6.5 验证结果
    if (!result) {
      return errorResponse('Failed to refine profile', requestContext, 502);
    }

    // 7. 记录日志
    console.log('[RefineProfile]', {
      requestId: requestContext.requestId,
      clientId: requestContext.clientId,
      extensionVersion: requestContext.extensionVersion,
      backendVersion: requestContext.backendVersion,
      apiMode: requestContext.apiMode,
      profileLength: body.rawProfileText.length,
      refinedLength: result.refinedProfile.length,
      usage: result.usage,
      timestamp: new Date().toISOString()
    });

    // 8. 返回响应
    return successResponse({
      refinedProfile: result.refinedProfile,
      usage: result.usage
    }, requestContext);

  } catch (error) {
    return handleError(error, requestContext);
  }
}
