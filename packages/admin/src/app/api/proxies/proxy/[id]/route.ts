import { container } from '@/app/lib/container';
import { ProxyService } from '@/app/lib/proxies/proxy.service';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const proxyService = container.resolve(ProxyService);

  const id = (await params).id;

  if (!id) {
    return new Response('Missing ID param', { status: 400, headers: corsHeaders });
  }

  const body = await request.json();
  if (!body) {
    return new Response('Missing body', { status: 400, headers: corsHeaders });
  }

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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Expose-Headers': 'Content-Type, Content-Length',
        'Access-Control-Allow-Credentials': 'false'
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
        ...corsHeaders
      }
    });
  } catch (error: any) {
    console.error('Proxy request error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}
