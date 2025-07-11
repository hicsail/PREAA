import { container } from '@/app/lib/container';
import { ProxyService } from '@/app/lib/proxies/proxy.service';


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
  } catch(error) {
    console.error(error);
    return new Response('Failed to delete model', { status: 500 });
  }
}
