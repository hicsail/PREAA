import { container } from '@/app/lib/container';
import { ProxyService } from '@/app/lib/proxies/proxy.service';
import { getCorsHeaders } from '@/app/lib/cors';

// GET and PUT are CORS-enabled so the embedded-chat configuration page
// (a different origin) can read and toggle client-safe proxy settings.
const CORS_METHODS = 'GET, PUT, OPTIONS';

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request.headers.get('origin'), CORS_METHODS)
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const proxyService = container.resolve(ProxyService);

  const id = (await params).id;

  if (!id) {
    return new Response('Missing ID param', { status: 400 });
  }

  try {
    const deleted = await proxyService.delete(id);
    return new Response(JSON.stringify(deleted), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(error);
    return new Response('Failed to delete model', { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const proxyService = container.resolve(ProxyService);
  const corsHeaders = getCorsHeaders(request.headers.get('origin'), CORS_METHODS);

  const id = (await params).id;
  if (!id) {
    return new Response('Missing ID param', { status: 400, headers: corsHeaders });
  }

  const proxy = await proxyService.get(id);
  if (!proxy) {
    return new Response('Failed to find proxy', { status: 404, headers: corsHeaders });
  }

  return new Response(JSON.stringify(proxy), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const proxyService = container.resolve(ProxyService);
  const corsHeaders = getCorsHeaders(request.headers.get('origin'), CORS_METHODS);

  const id = (await params).id;
  if (!id) {
    return new Response('Missing ID param', { status: 400, headers: corsHeaders });
  }

  let body;
  try {
    body = await request.json();
  } catch (_error) {
    return new Response('Invalid JSON in request body', { status: 400, headers: corsHeaders });
  }

  if (typeof body?.suggestionsEnabled !== 'boolean') {
    return new Response('suggestionsEnabled must be a boolean', { status: 400, headers: corsHeaders });
  }

  try {
    // Only suggestionsEnabled is updatable — modelName/apiKey stay create-and-delete only.
    const updated = await proxyService.update(id, { suggestionsEnabled: body.suggestionsEnabled });
    if (!updated) {
      return new Response('Failed to find proxy', { status: 404, headers: corsHeaders });
    }

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error(error);
    return new Response('Failed to update model', { status: 500, headers: corsHeaders });
  }
}
