import { container } from '@/app/lib/container';
import { ProxyService } from '@/app/lib/proxies/proxy.service';
import { checkRateLimits, createRateLimitErrorResponse } from '@/app/lib/ratelimit/rate-limiter';

/**
 * Get the allowed origin for CORS from environment variables.
 * Supports comma-separated list of origins or a single origin.
 * Falls back to '*' in development, but should be explicitly set in production.
 */
function getAllowedOrigin(requestOrigin?: string | null): string {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  
  // If no environment variable is set, use '*' for development
  // In production, this should be explicitly configured
  if (!allowedOrigins) {
    return '*';
  }
  
  // Support comma-separated list of origins
  const origins = allowedOrigins.split(',').map(origin => origin.trim());
  
  // If a specific origin is requested, check if it's allowed
  if (requestOrigin) {
    return origins.includes(requestOrigin) ? requestOrigin : origins[0] || '*';
  }
  
  // If no specific origin requested, return first allowed origin or '*'
  return origins[0] || '*';
}

/**
 * Get CORS headers based on the request origin.
 */
function getCorsHeaders(requestOrigin?: string | null) {
  const allowedOrigin = getAllowedOrigin(requestOrigin);
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Expose-Headers': 'Content-Type, Content-Length, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset',
    'Access-Control-Allow-Credentials': allowedOrigin !== '*' ? 'true' : 'false'
  };
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  const id = (await params).id;

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Missing ID param' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }

  // Check rate limits (before processing the request)
  // Enforces: 12 requests per minute per IP, blocks for 1 hour if exceeded
  // Note: checkRateLimits handles all errors internally and returns a controlled response
  const rateLimitResult = checkRateLimits(request);
  if (!rateLimitResult.allowed) {
    // Create rate limit error response and merge with CORS headers
    const rateLimitResponse = createRateLimitErrorResponse(rateLimitResult.ipLimit, rateLimitResult.blockedUntil);
    const rateLimitHeaders = Object.fromEntries(rateLimitResponse.headers.entries());
    return new Response(rateLimitResponse.body, {
      status: rateLimitResponse.status,
      headers: {
        ...rateLimitHeaders,
        ...corsHeaders
      }
    });
  }

  // Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimitResult.ipLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.ipLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.ipLimit.resetTime.toString(),
          ...corsHeaders
        } 
      }
    );
  }

  if (!body) {
    return new Response(
      JSON.stringify({ error: 'Missing body' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimitResult.ipLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.ipLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.ipLimit.resetTime.toString(),
          ...corsHeaders
        } 
      }
    );
  }

  // Process the proxy request
  const proxyService = container.resolve(ProxyService);
  const stream = body.stream === true;

  try {
    const response = await proxyService.proxyRequest(id, body, stream);

    // Handle streaming responses - pass through SSE stream directly
    if (stream && response instanceof Response && response.body) {
      const streamHeaders = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-RateLimit-Limit': rateLimitResult.ipLimit.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.ipLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.ipLimit.resetTime.toString(),
        ...corsHeaders
      };
      
      return new Response(response.body, {
        status: response.status,
        headers: streamHeaders
      });
    }

    // Non-streaming response
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': rateLimitResult.ipLimit.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.ipLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.ipLimit.resetTime.toString(),
        ...corsHeaders
      }
    });
  } catch (error: any) {
    console.error('Proxy request error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        errorCode: 'PROXY_REQUEST_FAILED'
      }), 
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimitResult.ipLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.ipLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.ipLimit.resetTime.toString(),
          ...corsHeaders
        }
      }
    );
  }
}
