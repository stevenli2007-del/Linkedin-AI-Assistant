/**
 * Request ID 全链路贯穿中间件
 * Extension → Backend → DeepSeek → Backend → Extension
 * 整个生命周期使用同一个 requestId
 */

import { RequestContext, Env } from '../types';

/**
 * 生成 UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 从请求中提取或生成 requestId
 * 优先级：
 * 1. 请求头 X-Request-Id（Extension 生成并传递）
 * 2. 自动生成新的 UUID
 */
export function getOrCreateRequestId(request: Request): string {
  const headerRequestId = request.headers.get('X-Request-Id');
  if (headerRequestId && isValidUUID(headerRequestId)) {
    return headerRequestId;
  }
  return generateUUID();
}

/**
 * 验证 UUID 格式
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * 从请求中提取 Client ID（匿名）
 * Phase 09 不做登录，使用 Extension 生成的 clientId
 */
export function getClientId(request: Request): string {
  const clientId = request.headers.get('X-Client-Id');
  if (clientId) {
    return clientId;
  }
  // 如果没有 clientId，生成一个并返回（让 Extension 保存）
  return generateUUID();
}

/**
 * 从请求中提取 Extension Version
 */
export function getExtensionVersion(request: Request): string {
  return request.headers.get('X-Extension-Version') || 'unknown';
}

/**
 * 构建请求上下文
 */
export function buildRequestContext(request: Request, env: Env): RequestContext {
  const requestId = getOrCreateRequestId(request);
  const clientId = getClientId(request);
  const extensionVersion = getExtensionVersion(request);

  return {
    requestId,
    clientId,
    extensionVersion,
    backendVersion: '1.0.0', // 从 package.json 读取，这里硬编码
    apiVersion: env.API_VERSION || 'v1',
    userAgent: request.headers.get('User-Agent') || undefined,
    ip: request.headers.get('CF-Connecting-IP') || undefined,
    apiMode: 'shared' // 默认 shared，从请求体中解析
  };
}
