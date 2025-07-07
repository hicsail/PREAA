import { container } from '@/app/lib/container';
import { ProxyService } from '@/app/lib/proxies/proxy.service';

export async function POST(request: Request) {
  const proxyService = container.resolve(ProxyService);

  if (!request.body) {
    return new Response('Missing body', { status: 400 });
  }

  const body = await request.json();

  const newProxy = await proxyService.create(body);

  return new Response(JSON.stringify(newProxy), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export async function GET(_request: Request) {
  const proxyService = container.resolve(ProxyService);

  try {
    const proxies = await proxyService.getAll();
    console.log(proxies)
    return new Response(JSON.stringify(proxies), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Range': 'proxies 0-2/3'
      }
    });
  } catch(error) {
    console.error(error);
    return new Response('Failed to create model', { status: 500 });
  }

}
