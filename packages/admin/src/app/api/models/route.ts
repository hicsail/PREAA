import { container, LITELLM_PROVIDER } from "@/app/lib/container";
import { Client as LiteLLMClient } from "../../lib/client-litellm/client/types";
import { modelInfoV1ModelInfoGet } from "@/app/lib/client-litellm";

export async function GET(_request: Request) {
  const litellmClient = container.resolve<LiteLLMClient>(LITELLM_PROVIDER);

  const all = await modelInfoV1ModelInfoGet({ client: litellmClient });

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
