import { container } from '@/app/lib/container';
import { ProxyService } from '@/app/lib/proxies/proxy.service';

export async function POST(request: Request) {
  const proxyService = container.resolve(ProxyService);

  if (!request.body) {
    return new Response('Missing body', { status: 400 });
  }

  const body = await request.json();

  const newProxy = await proxyService.create(body);

  // Add id field and remove API field
  const proxyResponse = {
    modelName: newProxy.modelName,
    url: newProxy.url,
    id: newProxy._id
  };

  return new Response(JSON.stringify(proxyResponse), {
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

    // Reshape the results
    const proxiesResponse = proxies.map((proxy) => ({
      id: proxy._id,
      modelName: proxy.modelName,
      url: proxy.url
    }));

    return new Response(JSON.stringify(proxiesResponse), {
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
