import { container } from '@/app/lib/container';
import { ProxyService } from '@/app/lib/proxies/proxy.service';
import { validateApiKey, createAuthErrorResponse } from '@/app/lib/auth/api-key-auth';
import { checkRateLimits, createRateLimitErrorResponse } from '@/app/lib/ratelimit/rate-limiter';
import { connectMongoDB } from '@/app/lib/db/mongodb';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // 1. Authenticate request
  const authResult = validateApiKey(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || 'Authentication failed');
  }

  const id = (await params).id;

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Missing ID parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Check rate limits (before processing the request)
  const rateLimitResult = checkRateLimits(request, id);
  if (!rateLimitResult.allowed) {
    return createRateLimitErrorResponse(rateLimitResult.ipLimit, rateLimitResult.modelLimit);
  }

  // 3. Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!body || !Array.isArray(body.messages)) {
    return new Response(
      JSON.stringify({ error: 'Invalid request body: messages array is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Ensure MongoDB connection and process the proxy request
  try {
    await connectMongoDB();
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    return new Response(
      JSON.stringify({ error: 'Database connection failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const proxyService = container.resolve(ProxyService);
  let response;
  try {
    response = await proxyService.proxyRequest(id, body);
  } catch (error) {
    console.error('Proxy request failed:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 5. Return response with rate limit headers
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit-IP': rateLimitResult.ipLimit.limit.toString(),
      'X-RateLimit-Remaining-IP': rateLimitResult.ipLimit.remaining.toString(),
      'X-RateLimit-Limit-Model': rateLimitResult.modelLimit.limit.toString(),
      'X-RateLimit-Remaining-Model': rateLimitResult.modelLimit.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.ipLimit.resetTime.toString()
    }
  });
}
