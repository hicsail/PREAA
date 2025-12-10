import { container } from '@/app/lib/container';
import { ProxyService } from '@/app/lib/proxies/proxy.service';
import { connectMongoDB } from '@/app/lib/db/mongodb';

export async function POST(request: Request) {
  try {
    // Ensure MongoDB connection
    await connectMongoDB();
    const proxyService = container.resolve(ProxyService);

    if (!request.body) {
      return new Response(
        JSON.stringify({ error: 'Missing request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newProxy = await proxyService.create(body);

    // Add id field and remove API field
    const proxyResponse = {
      modelName: newProxy.modelName,
      id: newProxy._id
    };

    return new Response(JSON.stringify(proxyResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating proxy:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create proxy',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

export async function GET(_request: Request) {
  try {
    // Ensure MongoDB connection
    await connectMongoDB();
    const proxyService = container.resolve(ProxyService);
    const proxies = await proxyService.getAll();

    // Reshape the results
    const proxiesResponse = proxies.map((proxy) => ({
      id: proxy._id,
      modelName: proxy.modelName
    }));

    return new Response(JSON.stringify(proxiesResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Range': `proxies 0-${proxiesResponse.length - 1}/${proxiesResponse.length}`
      }
    });
  } catch(error) {
    console.error('Error fetching proxies:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch proxies',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
