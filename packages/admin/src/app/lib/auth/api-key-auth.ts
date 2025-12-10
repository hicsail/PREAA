/**
 * API Key Authentication Utility
 * Validates API keys for proxy endpoints
 */

export interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validates API key from request headers
 * Supports both X-API-Key header and Authorization Bearer token
 * Uses constant-time comparison to prevent timing attacks
 */
export function validateApiKey(request: Request): AuthResult {
  const apiKey = process.env.PROXY_API_KEY;

  if (!apiKey) {
    console.error('PROXY_API_KEY environment variable is not set');
    return {
      success: false,
      error: 'Server configuration error'
    };
  }

  // Try X-API-Key header first
  const headerKey = request.headers.get('X-API-Key');
  if (headerKey && constantTimeEquals(headerKey, apiKey)) {
    return { success: true };
  }

  // Try Authorization Bearer token
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && match[1] && constantTimeEquals(match[1], apiKey)) {
      return { success: true };
    }
  }

  return {
    success: false,
    error: 'Invalid or missing API key'
  };
}

/**
 * Creates an error response for authentication failures
 */
export function createAuthErrorResponse(error: string): Response {
  return new Response(
    JSON.stringify({
      error: error,
      code: 'AUTH_ERROR'
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}
