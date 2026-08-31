import { container } from '@/app/lib/container';
import { ProxyService } from '@/app/lib/proxies/proxy.service';

// Cross-origin access (e.g. the embedded-chat configuration page) is served
// by the blanket CORS headers next.config.ts applies to /api/:path* — no
// route-level CORS here. Only /api/proxies/proxy/* does its own
// origin-validating CORS, as noted in next.config.ts.

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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const proxyService = container.resolve(ProxyService);

  const id = (await params).id;
  if (!id) {
    return new Response('Missing ID param', { status: 400 });
  }

  try {
    const proxy = await proxyService.get(id);
    if (!proxy) {
      return new Response('Failed to find proxy', { status: 404 });
    }

    return new Response(JSON.stringify(proxy), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    // e.g. ids that don't parse as the column type (fresh installs use uuid)
    console.error(error);
    return new Response('Failed to look up proxy', { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const proxyService = container.resolve(ProxyService);

  const id = (await params).id;
  if (!id) {
    return new Response('Missing ID param', { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch (_error) {
    return new Response('Invalid JSON in request body', { status: 400 });
  }

  if (typeof body?.suggestionsEnabled !== 'boolean') {
    return new Response('suggestionsEnabled must be a boolean', { status: 400 });
  }

  try {
    // Only suggestionsEnabled is updatable — modelName/apiKey stay create-and-delete only.
    const updated = await proxyService.update(id, { suggestionsEnabled: body.suggestionsEnabled });
    if (!updated) {
      return new Response('Failed to find proxy', { status: 404 });
    }

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(error);
    return new Response('Failed to update model', { status: 500 });
  }
}
