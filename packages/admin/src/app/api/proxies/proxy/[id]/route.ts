import { container } from '@/app/lib/container';
import { ProxyService } from '@/app/lib/proxies/proxy.service';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const proxyService = container.resolve(ProxyService);

  const id = (await params).id;

  if (!id) {
    return new Response('Missing ID param', { status: 400 });
  }
}
