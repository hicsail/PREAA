import { container, LITELLM_PROVIDER } from "@/app/lib/container";
import { Client as LiteLLMClient } from "../../lib/client-litellm/client/types";
import { addNewModelModelNewPost, modelInfoV1ModelInfoGet } from "@/app/lib/client-litellm";

export async function GET(_request: Request) {
  const client = container.resolve<LiteLLMClient>(LITELLM_PROVIDER);

  const all = await modelInfoV1ModelInfoGet({ client });

  if (all.error) {
    console.error(all.error);
    return new Response('Error response from LiteLLM API', { status: 500 });
  }

  if (!all.data) {
    console.error('No error, but no data returned from LiteLLM');
    return new Response('Empty response from LiteLLM API', { status: 500 });
  }

  // Need to add an ID field
  let models = (all.data as any).data as any[];
  models = models.map((model) => { return { ...model, id: model.model_info.id }});

  return new Response(JSON.stringify(models), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Range': 'models 0-2/3'
    }
  })
}

export async function POST(request: Request) {
  const client = container.resolve<LiteLLMClient>(LITELLM_PROVIDER);

  if (!request.body) {
    return new Response('Missing body', { status: 400 });
  }

  const body = await request.json();

  const result = await addNewModelModelNewPost({ body, client });
  console.log(result);

  if (result.error) {
    console.error(result.error);
    return new Response(JSON.stringify(result.error), { status: 500 });
  }

  if (!result.data) {
    console.error('Missing data payload');
    return new Response('Missing LiteLLM payload', { status: 500 });
  }

  // Add ID field
  const newModel = { ...result.data, id: (result.data as any).model_id };

  return new Response(JSON.stringify(newModel), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
