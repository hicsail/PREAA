import { container } from "@/app/lib/container";
import { ModelService } from "@/app/lib/models/model.service";


export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const modelService = container.resolve(ModelService);

  const id = (await params).id;

  if (!id) {
    return new Response('Missing ID param', { status: 400 });
  }

  try {
    const deleted = await modelService.delete(id);
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
