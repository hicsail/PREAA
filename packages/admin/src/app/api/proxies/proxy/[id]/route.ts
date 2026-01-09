import { container } from '@/app/lib/container';
import { ProxyService } from '@/app/lib/proxies/proxy.service';
import { checkRateLimits, createRateLimitErrorResponse } from '@/app/lib/ratelimit/rate-limiter';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Missing ID param' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check rate limits (before processing the request)
  // Enforces: 12 requests per minute per IP, blocks for 1 hour if exceeded
  let rateLimitResult;
  try {
    rateLimitResult = checkRateLimits(request);
    if (!rateLimitResult.allowed) {
      return createRateLimitErrorResponse(rateLimitResult.ipLimit, rateLimitResult.blockedUntil);
    }
  } catch (_error) {
    // Handle IP detection failure (shouldn't happen due to try-catch in checkRateLimits, but added for safety)
    return new Response(
      JSON.stringify({ error: 'Unable to determine client IP address. Request rejected for security.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!body) {
    return new Response(
      JSON.stringify({ error: 'Missing body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Process the proxy request
  const proxyService = container.resolve(ProxyService);
  let response;
  try {
    response = await proxyService.proxyRequest(id, body);
  } catch (_error) {
    console.error('Proxy request failed:', _error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Return response with rate limit headers
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': rateLimitResult.ipLimit.limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.ipLimit.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.ipLimit.resetTime.toString()
    }
  });
}
