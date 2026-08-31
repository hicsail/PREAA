import { container } from '@/app/lib/container';
import { ProxyService } from '@/app/lib/proxies/proxy.service';

export async function POST(request: Request) {
  const proxyService = container.resolve(ProxyService);

  if (!request.body) {
    return new Response('Missing body', { status: 400 });
  }

  const body = await request.json();

  const newProxy = await proxyService.create({
    modelName: body.modelName,
    apiKey: body.apiKey,
    suggestionsEnabled: body.suggestionsEnabled === true
  });

  // Return the client-safe view (never includes the API key)
  const proxyResponse = {
    modelName: newProxy.modelName,
    id: newProxy.id,
    suggestionsEnabled: newProxy.suggestionsEnabled
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
      id: proxy.id,
      modelName: proxy.modelName,
      suggestionsEnabled: proxy.suggestionsEnabled
    }));

    const total = proxiesResponse.length;
    const rangeEnd = total > 0 ? total - 1 : 0;

    return new Response(JSON.stringify(proxiesResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // react-admin (simpleRestProvider) reads the total from Content-Range
        'Content-Range': `proxies 0-${rangeEnd}/${total}`
      }
    });
  } catch(error) {
    console.error(error);
    return new Response('Failed to create model', { status: 500 });
  }

}
