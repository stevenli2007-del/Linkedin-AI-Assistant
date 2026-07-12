/**
 * CORS 中间件
 *
 * Phase 10 (I6): Replaced wildcard `*` with origin validation.
 * Only Chrome Extension origins (chrome-extension://<id>) are allowed.
 * This prevents arbitrary websites from making cross-origin requests to the backend.
 *
 * Note: Chrome extension IDs are unique per installation but always use the
 * `chrome-extension://` scheme. Since only installed extensions with proper
 * host_permissions can initiate requests, validating the scheme is sufficient.
 */

const CHROME_EXTENSION_ORIGIN_PREFIX = "chrome-extension://";

/**
 * Extract the allowed origin from the request's Origin header.
 * Returns the origin string if it's a Chrome extension, otherwise null.
 */
function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) {
    // No Origin header — not a CORS request (e.g., health check, curl)
    return null;
  }
  if (origin.startsWith(CHROME_EXTENSION_ORIGIN_PREFIX)) {
    return origin;
  }
  // Unknown origin — reject
  return null;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, X-Request-Id, X-Client-Id, X-Extension-Version, X-Api-Mode, X-Custom-Api-Key",
  "Access-Control-Max-Age": "86400",
};

export function handleCORS(request: Request): Response | null {
  // 处理 Preflight 请求
  if (request.method === "OPTIONS") {
    const allowedOrigin = getAllowedOrigin(request);
    const headers: Record<string, string> = { ...CORS_HEADERS };

    if (allowedOrigin) {
      headers["Access-Control-Allow-Origin"] = allowedOrigin;
    }

    return new Response(null, { headers });
  }

  return null; // 不是 Preflight，继续处理
}

/**
 * 为响应添加 CORS 头。
 * 仅当请求来源是 Chrome Extension 时才添加 Allow-Origin。
 */
export function addCORSHeaders(response: Response, request: Request): Response {
  const allowedOrigin = getAllowedOrigin(request);

  const headers: Record<string, string> = {
    ...Object.fromEntries(response.headers.entries()),
    ...CORS_HEADERS,
  };

  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
