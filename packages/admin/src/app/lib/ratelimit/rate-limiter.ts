/**
 * Rate limiter for proxy requests
 * Enforces: 12 requests per minute per IP
 * Blocks IP for 1 hour if limit is exceeded
 */

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}

interface RateLimitResult {
  allowed: boolean;
  ipLimit: RateLimitInfo;
  blockedUntil?: number; // Timestamp when block expires
}

interface IPRecord {
  requests: number[];
  blockedUntil?: number;
}

// In-memory store for rate limiting
// In production, consider using Redis for distributed systems
const ipStore = new Map<string, IPRecord>();

// Configuration
const REQUESTS_PER_MINUTE = 12;
const WINDOW_MS = 60 * 1000; // 1 minute
const BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get client IP address from request
 * @throws Error if IP cannot be determined (security requirement)
 */
function getClientIP(request: Request): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) {
      return ip;
    }
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Check for CF-Connecting-IP (Cloudflare)
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP;
  }

  // In production, IP should always be set by reverse proxy
  // Reject requests without IP identification to prevent rate limit bypass
  throw new Error('Unable to determine client IP address. Request rejected for security.');
}

/**
 * Clean up old entries from the store
 */
function cleanupStore() {
  const now = Date.now();
  for (const [ip, record] of ipStore.entries()) {
    // Remove block if expired
    if (record.blockedUntil && record.blockedUntil < now) {
      record.blockedUntil = undefined;
    }

    // Remove old request timestamps (older than 1 minute)
    const cutoff = now - WINDOW_MS;
    record.requests = record.requests.filter((timestamp) => timestamp > cutoff);

    // Remove entry if no active requests and not blocked
    if (record.requests.length === 0 && !record.blockedUntil) {
      ipStore.delete(ip);
    }
  }
}

/**
 * Check rate limits for a request
 */
export function checkRateLimits(request: Request): RateLimitResult {
  let ip: string;
  try {
    ip = getClientIP(request);
  } catch (_error) {
    // If we can't determine IP, reject the request
    // This prevents rate limit bypass attacks
    return {
      allowed: false,
      ipLimit: {
        limit: REQUESTS_PER_MINUTE,
        remaining: 0,
        resetTime: 0
      }
    };
  }

  const now = Date.now();

  // Cleanup old entries periodically (every 100 requests, roughly)
  if (Math.random() < 0.01) {
    cleanupStore();
  }

  // Get or create IP record
  let record = ipStore.get(ip);
  if (!record) {
    record = { requests: [] };
    ipStore.set(ip, record);
  }

  // Check if IP is currently blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    const resetTime = Math.ceil((record.blockedUntil - now) / 1000);
    return {
      allowed: false,
      ipLimit: {
        limit: REQUESTS_PER_MINUTE,
        remaining: 0,
        resetTime
      },
      blockedUntil: record.blockedUntil
    };
  }

  // Remove expired block
  if (record.blockedUntil && record.blockedUntil <= now) {
    record.blockedUntil = undefined;
  }

  // Remove requests older than the window
  const cutoff = now - WINDOW_MS;
  record.requests = record.requests.filter((timestamp) => timestamp > cutoff);

  // Check if limit is exceeded
  if (record.requests.length >= REQUESTS_PER_MINUTE) {
    // Block the IP for 1 hour
    record.blockedUntil = now + BLOCK_DURATION_MS;
    record.requests = []; // Clear requests

    const resetTime = Math.ceil(BLOCK_DURATION_MS / 1000);
    return {
      allowed: false,
      ipLimit: {
        limit: REQUESTS_PER_MINUTE,
        remaining: 0,
        resetTime
      },
      blockedUntil: record.blockedUntil
    };
  }

  // Add current request
  record.requests.push(now);

  // Calculate reset time (when the oldest request in the window expires)
  const oldestRequest = record.requests[0];
  const resetTime = oldestRequest
    ? Math.ceil((oldestRequest + WINDOW_MS - now) / 1000)
    : WINDOW_MS / 1000;

  return {
    allowed: true,
    ipLimit: {
      limit: REQUESTS_PER_MINUTE,
      remaining: REQUESTS_PER_MINUTE - record.requests.length,
      resetTime
    }
  };
}

/**
 * Create rate limit error response
 */
export function createRateLimitErrorResponse(
  ipLimit: RateLimitInfo,
  blockedUntil?: number
): Response {
  // Handle case where IP couldn't be determined
  if (ipLimit.resetTime === 0 && ipLimit.remaining === 0 && !blockedUntil) {
    return new Response(
      JSON.stringify({
        error: 'Unable to determine client IP address. Request rejected for security.'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  const message = blockedUntil
    ? `Rate limit exceeded. IP blocked for 1 hour. Try again after ${new Date(blockedUntil).toISOString()}`
    : 'Rate limit exceeded. Too many requests.';

  return new Response(
    JSON.stringify({
      error: message,
      rateLimit: {
        limit: ipLimit.limit,
        remaining: ipLimit.remaining,
        resetTime: ipLimit.resetTime
      }
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': ipLimit.limit.toString(),
        'X-RateLimit-Remaining': ipLimit.remaining.toString(),
        'X-RateLimit-Reset': ipLimit.resetTime.toString(),
        'Retry-After': ipLimit.resetTime.toString()
      }
    }
  );
}
