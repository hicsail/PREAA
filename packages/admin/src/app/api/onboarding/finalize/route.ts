import { LangflowService } from '@/app/lib/langflow/langflow.service';
import { container } from '@/app/lib/container';
import { ModelService } from '@/app/lib/models/model.service';
import { ProxyService } from '@/app/lib/proxies/proxy.service';

export async function POST(request: Request) {
  const body = await request.json();
  const { projectName, flowId, selectedModel, budget, budgetDuration } = body as {
    projectName: string;
    flowId: string;
    selectedModel: string;
    budget: string;
    budgetDuration: string;
  };

  if (!projectName || !flowId || !selectedModel) {
    return new Response('Missing required fields', { status: 400 });
  }

  const langflow = new LangflowService();
  const modelService = container.resolve(ModelService);
  const proxyService = container.resolve(ProxyService);

  try {
    const superuser = process.env.LANGFLOW_SUPERUSER || 'langflow';
    const superuserPassword = process.env.LANGFLOW_SUPERUSER_PASSWORD || 'langflow';
    const token = await langflow.authenticate(superuser, superuserPassword);

    // Create a Langflow API key scoped to this project
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const langflowApiKey = await langflow.createApiKey(token, `${slug}-key`);

    const langflowBaseUrl = process.env.LANGFLOW_BASE_URL || 'http://localhost:7860';
    const modelName = `${slug}-model`;

    // Create a LiteLLM model wrapping this Langflow flow
    await modelService.create({
      model_name: modelName,
      litellm_params: {
        model: flowId,
        api_base: langflowBaseUrl,
        api_key: langflowApiKey,
        custom_llm_provider: 'langflow'
      },
      model_info: {
        metadata: {
          underlying_model: selectedModel,
          budget,
          budget_duration: budgetDuration
        }
      }
    });

    // Create an admin proxy backed by the LiteLLM model
    const proxy = await proxyService.create({
      modelName,
      apiKey: langflowApiKey
    });

    return Response.json({
      proxyId: (proxy as any)._id.toString()
    });
  } catch (err) {
    console.error('[onboarding/finalize]', err);
    return new Response((err as Error).message || 'Finalize failed', { status: 500 });
  }
}
