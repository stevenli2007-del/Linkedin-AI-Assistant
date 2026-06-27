/**
 * 统一错误处理中间件
 * 捕获所有错误，返回统一格式响应（包含 errorCode）
 */

import { RequestContext } from '../types';
import { errorResponse } from '../utils/response';

/**
 * 错误码分类
 */
enum ErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  MODEL_ERROR = 'MODEL_ERROR',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export function handleError(
  error: unknown,
  requestContext: RequestContext
): Response {
  console.error('[Error]', {
    requestId: requestContext.requestId,
    clientId: requestContext.clientId,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });

  // 根据错误类型返回不同状态码和错误码
  if (error instanceof SyntaxError) {
    return errorResponse('Invalid JSON body', requestContext, 400, ErrorCode.INVALID_REQUEST);
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return errorResponse('Failed to connect to AI provider', requestContext, 502, ErrorCode.MODEL_ERROR);
  }

  if (error instanceof Error) {
    // DeepSeek API 错误（401 = 无效 Key）
    if (error.message.includes('DeepSeek API error')) {
      const match = error.message.match(/\((\d+)\)/);
      const statusCode = match ? parseInt(match[1]) : 502;
      
      // 401 = 无效 API Key
      if (statusCode === 401) {
        return errorResponse('Invalid API key', requestContext, 401, ErrorCode.UNAUTHORIZED);
      }
      
      // 其他 API 错误
      return errorResponse(error.message, requestContext, statusCode, ErrorCode.MODEL_ERROR);
    }

    // 超时错误
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return errorResponse('Request timeout', requestContext, 504, ErrorCode.TIMEOUT);
    }

    // 配置错误
    if (error.message.includes('is required') || error.message.includes('is not configured')) {
      return errorResponse(error.message, requestContext, 500, ErrorCode.INTERNAL_ERROR);
    }
  }

  // 默认 500
  return errorResponse(
    error instanceof Error ? error.message : 'Internal server error',
    requestContext,
    500,
    ErrorCode.INTERNAL_ERROR
  );
}
