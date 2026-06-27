/**
 * CORS 中间件
 * 允许 Chrome Extension 跨域调用
 */

export function handleCORS(request: Request): Response | null {
  // 处理 Preflight 请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*', // Phase 09 允许所有来源，Phase 10 加入白名单
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Request-Id, X-Client-Id, X-Extension-Version, X-Api-Mode, X-Custom-Api-Key',
        'Access-Control-Max-Age': '86400' // 24小时
      }
    });
  }

  return null; // 不是 Preflight，继续处理
}

/**
 * 为响应添加 CORS 头
 */
export function addCORSHeaders(response: Response): Response {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Request-Id, X-Client-Id, X-Extension-Version, X-Api-Mode, X-Custom-Api-Key'
    }
  });

  return newResponse;
}
