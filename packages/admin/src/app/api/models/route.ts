import { container } from "@/app/lib/container";
import { ModelService } from "@/app/lib/models/model.service";

export async function POST(request: Request) {
  const modelService = container.resolve(ModelService);

  if (!request.body) {
    return new Response('Missing body', { status: 400 });
  }

  const body = await request.json();

  try {
    const newModel = await modelService.create(body);
    return new Response(JSON.stringify(newModel), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch(error) {
    console.error(error);
    return new Response('Failed to create model', { status: 500 });
  }
}

export async function GET(_request: Request) {
  const modelService = container.resolve(ModelService);

  try {
    const models = await modelService.getAll();
    return new Response(JSON.stringify(models), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Range': 'models 0-2/3'
      }
    });
  } catch(error) {
    console.error(error);
    return new Response('Failed to create model', { status: 500 });
  }
}
