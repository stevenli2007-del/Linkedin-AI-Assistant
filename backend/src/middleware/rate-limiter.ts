/**
 * Rate Limiting Middleware
 * 
 * Uses Cloudflare KV to store request counters per Client ID.
 * Limit: 10 requests per minute per client.
 * 
 * Returns 429 with error code when limit exceeded.
 */

import { Env } from '../types';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a client has exceeded their rate limit
 * @param clientId - The client's unique ID
 * @param env - Cloudflare Worker environment
 * @param maxRequests - Maximum requests per minute (default: 10)
 * @param windowSeconds - Time window in seconds (default: 60)
 * @returns RateLimitResult
 */
export async function checkRateLimit(
  clientId: string,
  env: Env,
  maxRequests: number = 10,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  const key = `rate_limit:${clientId}:${windowStart}`;
  
  try {
    // Get current count from KV
    const currentCountStr = await env.RATE_LIMIT_STORE.get(key);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
    
    if (currentCount >= maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: (windowStart + windowSeconds) * 1000 // Convert to milliseconds
      };
    }
    
    // Increment counter
    const newCount = currentCount + 1;
    await env.RATE_LIMIT_STORE.put(key, newCount.toString(), {
      expirationTtl: windowSeconds * 2 // Expire after 2x window to be safe
    });
    
    return {
      allowed: true,
      remaining: maxRequests - newCount,
      resetTime: (windowStart + windowSeconds) * 1000
    };
  } catch (error) {
    console.error('[Rate Limit] KV error:', error);
    // If KV fails, allow the request (fail open)
    return {
      allowed: true,
      remaining: -1,
      resetTime: 0
    };
  }
}

/**
 * Create a 429 Too Many Requests response
 * @param resetTime - Unix timestamp (ms) when the rate limit resets
 */
export function rateLimitResponse(resetTime: number): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      errorCode: 'RATE_LIMITED',
      retryAfter,
      timestamp: new Date().toISOString()
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      }
    }
  );
}
