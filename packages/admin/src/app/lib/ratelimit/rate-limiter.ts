/**
 * Rate Limiting Utility
 * Implements in-memory rate limiting with configurable limits
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, consider using Redis for distributed systems
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  perIpLimit: number; // requests per window
  perModelLimit: number; // requests per window
  windowMs: number; // time window in milliseconds
}

/**
 * Get default rate limit configuration from environment variables
 */
export function getRateLimitConfig(): RateLimitConfig {
  return {
    perIpLimit: parseInt(process.env.RATE_LIMIT_PER_IP || '100', 10),
    perModelLimit: parseInt(process.env.RATE_LIMIT_PER_MODEL || '50', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10) // default 1 minute
  };
}

/**
 * Get client IP address from request
 */
function getClientIp(request: Request): string {
  // Try various headers for IP address
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('X-Real-Ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default if we can't determine IP
  // In production, ensure your reverse proxy sets X-Forwarded-For
  return 'unknown';
}

// Track last cleanup time to avoid excessive cleanup operations
let lastCleanupTime = Date.now();
const CLEANUP_INTERVAL_MS = 60000; // Clean up every minute

/**
 * Check if a key has exceeded rate limit
 */
function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up expired entries periodically (every minute)
  if (now - lastCleanupTime > CLEANUP_INTERVAL_MS) {
    cleanupExpiredEntries(now);
    lastCleanupTime = now;
  }

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    const resetTime = now + windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime
    };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

/**
 * Check rate limits for a request
 * Returns result for both IP and modelId limits
 */
export function checkRateLimits(
  request: Request,
  modelId: string
): {
  ipLimit: RateLimitResult;
  modelLimit: RateLimitResult;
  allowed: boolean;
} {
  const config = getRateLimitConfig();
  const clientIp = getClientIp(request);

  // Check IP-based rate limit
  const ipKey = `ip:${clientIp}`;
  const ipLimit = checkRateLimit(ipKey, config.perIpLimit, config.windowMs);

  // Check modelId-based rate limit
  const modelKey = `model:${modelId}`;
  const modelLimit = checkRateLimit(modelKey, config.perModelLimit, config.windowMs);

  const ipLimitResult: RateLimitResult = {
    allowed: ipLimit.allowed,
    remaining: ipLimit.remaining,
    resetTime: ipLimit.resetTime,
    limit: config.perIpLimit
  };

  const modelLimitResult: RateLimitResult = {
    allowed: modelLimit.allowed,
    remaining: modelLimit.remaining,
    resetTime: modelLimit.resetTime,
    limit: config.perModelLimit
  };

  return {
    ipLimit: ipLimitResult,
    modelLimit: modelLimitResult,
    allowed: ipLimit.allowed && modelLimit.allowed
  };
}

/**
 * Create rate limit error response
 */
export function createRateLimitErrorResponse(
  ipLimit: RateLimitResult,
  modelLimit: RateLimitResult
): Response {
  // Determine which limit was exceeded
  const exceededLimit = !ipLimit.allowed ? 'IP' : 'model';
  const resetTime = !ipLimit.allowed ? ipLimit.resetTime : modelLimit.resetTime;
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: `Rate limit exceeded for ${exceededLimit}`,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter,
      limits: {
        ip: {
          remaining: ipLimit.remaining,
          limit: ipLimit.limit
        },
        model: {
          remaining: modelLimit.remaining,
          limit: modelLimit.limit
        }
      }
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit-IP': ipLimit.limit.toString(),
        'X-RateLimit-Remaining-IP': ipLimit.remaining.toString(),
        'X-RateLimit-Limit-Model': modelLimit.limit.toString(),
        'X-RateLimit-Remaining-Model': modelLimit.remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString()
      }
    }
  );
}
