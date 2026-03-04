/**
 * Rate limiter for proxy requests
 * Enforces: 12 requests per minute per IP
 * Blocks IP for 1 hour if limit is exceeded
 *
 * IMPORTANT: This implementation uses an in-memory store and will NOT work correctly
 * in a distributed or multi-instance deployment. Each instance will have its own Map,
 * allowing users to bypass rate limits by hitting different instances. For production
 * use with multiple instances, consider implementing Redis-based rate limiting or
 * using a shared state solution.
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
// WARNING: This will not work correctly in distributed/multi-instance deployments.
// Each instance maintains its own Map, allowing rate limit bypass by hitting different instances.
// For production with multiple instances, use Redis or another shared state solution.
const ipStore = new Map<string, IPRecord>();

// Configuration
const REQUESTS_PER_MINUTE = 12;
const WINDOW_MS = 60 * 1000; // 1 minute
const BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Secret used to verify that a request has passed through a trusted proxy.
// The proxy must set the "x-trusted-proxy-secret" header to this value.
// If not set, IP headers will not be trusted (security requirement).
const TRUSTED_PROXY_SECRET = process.env.TRUSTED_PROXY_SECRET;

// Cleanup interval: run cleanup every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanupTime = Date.now();

/**
 * Basic validation for IPv4/IPv6 string formats.
 */
function isValidIP(ip: string): boolean {
  // Simple IPv4 and IPv6 regexes; not exhaustively strict but good enough to
  // prevent obviously invalid values from being used for rate limiting.
  const ipv4 =
    /^(25[0-5]|2[0-4]\d|1?\d{1,2})(\.(25[0-5]|2[0-4]\d|1?\d{1,2})){3}$/;
  const ipv6 =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(::1)|(::))$/;
  return ipv4.test(ip) || ipv6.test(ip);
}

/**
 * Verify that the request was forwarded by a trusted proxy.
 * This prevents clients from spoofing IP-related headers directly.
 * Returns true if:
 * - TRUSTED_PROXY_SECRET is not set (development mode - allows requests through)
 * - TRUSTED_PROXY_SECRET is set and matches the header value (production mode)
 */
function isRequestFromTrustedProxy(request: Request): boolean {
  // If no secret is configured, allow requests through (development mode)
  // Log a warning to encourage setting it in production
  if (!TRUSTED_PROXY_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('WARNING: TRUSTED_PROXY_SECRET is not set. IP spoofing protection is disabled. Set this in production!');
    }
    return true; // Allow in development when secret is not configured
  }
  
  // In production with secret configured, require the header to match
  const providedSecret = request.headers.get('x-trusted-proxy-secret');
  return providedSecret === TRUSTED_PROXY_SECRET;
}

/**
 * Get client IP address from request
 * @throws Error if IP cannot be determined (security requirement)
 */
function getClientIP(request: Request): string {
  // If TRUSTED_PROXY_SECRET is set, verify the request came from a trusted proxy
  // If not set, we still try to extract IP (for development) but it's less secure
  if (TRUSTED_PROXY_SECRET && !isRequestFromTrustedProxy(request)) {
    throw new Error('Unable to determine client IP address. Request rejected for security.');
  }

  // Check various headers for the real IP, in order of preference.
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip && isValidIP(ip)) {
      return ip;
    }
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP && isValidIP(realIP)) {
    return realIP;
  }

  // Check for CF-Connecting-IP (Cloudflare)
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP && isValidIP(cfIP)) {
    return cfIP;
  }

  // Development fallback: If no IP headers found and we're in development mode
  // (TRUSTED_PROXY_SECRET not set), use a fallback identifier
  if (!TRUSTED_PROXY_SECRET && process.env.NODE_ENV !== 'production') {
    // Try to create a unique identifier from available headers
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const accept = request.headers.get('accept') || 'unknown';
    // Use a simple identifier for development based on headers
    // This is not secure but allows development to work
    // Create a simple hash by summing character codes
    let hash = 0;
    const str = userAgent + accept;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const devIdentifier = `dev-${Math.abs(hash).toString(36)}`;
    console.warn(`[Rate Limiter] No IP headers found in development. Using fallback identifier: ${devIdentifier}`);
    return devIdentifier;
  }

  // In production, IP should always be set by reverse proxy
  // Reject requests without valid IP identification to prevent rate limit bypass
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
      delete record.blockedUntil;
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
 * 
 * Note: In a multi-instance deployment, this function has a race condition where
 * concurrent requests from the same IP could all pass the limit check before any
 * increments the counter. For production use with high concurrency, consider using
 * Redis with atomic operations or implementing proper locking mechanisms.
 */
export function checkRateLimits(request: Request): RateLimitResult {
  let ip: string;
  try {
    ip = getClientIP(request);
  } catch (error) {
    // Log the error for debugging and security monitoring
    console.error('IP detection failed:', error instanceof Error ? error.message : String(error));
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

  // Cleanup old entries deterministically (every CLEANUP_INTERVAL_MS)
  if (now - lastCleanupTime >= CLEANUP_INTERVAL_MS) {
    cleanupStore();
    lastCleanupTime = now;
  }

  // Get or create IP record
  // Note: In high-concurrency scenarios, there's a race condition here where
  // multiple requests could pass the limit check simultaneously. For production,
  // use Redis with atomic operations or implement proper locking.
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
    delete record.blockedUntil;
  }

  // Remove requests older than the window
  const cutoff = now - WINDOW_MS;
  record.requests = record.requests.filter((timestamp) => timestamp > cutoff);

  // Check if limit is exceeded
  if (record.requests.length >= REQUESTS_PER_MINUTE) {
    // Block the IP for 1 hour
    // Note: Clearing requests here means after the block expires, the user gets
    // a fresh window. For production, consider preserving request history or
    // implementing progressive penalties for repeat offenders.
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

  // Calculate reset time as when the current rate-limit window,
  // anchored at the oldest request, fully elapses. Note that
  // additional quota may become available earlier as individual
  // requests age out of the rolling window.
  const oldestRequest = record.requests[0] ?? now;
  const windowResetMs = oldestRequest + WINDOW_MS - now;
  const resetTime = windowResetMs > 0 ? Math.ceil(windowResetMs / 1000) : 0;

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

  // Format user-friendly error message
  let unblockInText: string | null = null;
  let unblockAtText: string | null = null;

  if (blockedUntil && blockedUntil > Date.now()) {
    const msUntilUnblock = blockedUntil - Date.now();
    const minutesUntilUnblock = Math.ceil(msUntilUnblock / 60000);
    if (minutesUntilUnblock > 0) {
      unblockInText =
        minutesUntilUnblock === 1 ? 'in 1 minute' : `in ${minutesUntilUnblock} minutes`;
    }
  }

  if (blockedUntil) {
    unblockAtText = new Date(blockedUntil).toLocaleString();
  }

  const message = blockedUntil
    ? `Rate limit exceeded. IP blocked for 1 hour. Try again ${
        unblockInText ?? `after ${unblockAtText}`
      }`
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
