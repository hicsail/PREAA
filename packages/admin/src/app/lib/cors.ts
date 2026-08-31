/**
 * Shared CORS helpers for API routes that are called from other PREAA
 * origins (the embedded-chat widget and its configuration page).
 *
 * ALLOWED_ORIGINS is a comma-separated list of allowed origins. When unset
 * (development), '*' is used — set it explicitly in production.
 */

export function getAllowedOrigin(requestOrigin?: string | null): string {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;

  if (!allowedOrigins) {
    return '*';
  }

  const origins = allowedOrigins.split(',').map((origin) => origin.trim());

  if (requestOrigin) {
    return origins.includes(requestOrigin) ? requestOrigin : origins[0] || '*';
  }

  return origins[0] || '*';
}

export function getCorsHeaders(requestOrigin: string | null | undefined, methods: string): Record<string, string> {
  const allowedOrigin = getAllowedOrigin(requestOrigin);

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Expose-Headers': 'Content-Type, Content-Length, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset',
    'Access-Control-Allow-Credentials': allowedOrigin !== '*' ? 'true' : 'false'
  };
}
