/**
 * 统一响应工具
 * 确保所有响应格式一致
 */

import { RequestContext } from '../types';

/**
 * 成功响应
 */
export function successResponse(data: any, requestContext: RequestContext, statusCode: number = 200): Response {
  const responseBody = {
    success: true,
    data,
    requestId: requestContext.requestId,
    timestamp: new Date().toISOString()
  };

  return jsonResponse(responseBody, statusCode);
}

/**
 * 错误响应
 */
export function errorResponse(
  error: string,
  requestContext: RequestContext,
  statusCode: number = 500,
  errorCode?: string,
  details?: any
): Response {
  const responseBody = {
    success: false,
    error,
    ...(errorCode && { errorCode }),
    requestId: requestContext.requestId,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  };

  return jsonResponse(responseBody, statusCode);
}

/**
 * JSON 响应
 */
function jsonResponse(body: any, statusCode: number): Response {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store' // 禁止缓存 AI 响应
    }
  });
}

/**
 * 健康检查响应
 */
export function healthCheckResponse(): Response {
  return jsonResponse({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  }, 200);
}
