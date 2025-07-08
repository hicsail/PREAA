import DeepchatProxy, { DeepchatProxies } from '@/app/schemas/deepchat-proxy';
import { inject, singleton } from 'tsyringe';
import { LITELLM_PROVIDER } from '../container';
import type { Client as LiteLLMClient } from '../client-litellm/core/types';
import { chatCompletionV1ChatCompletionsPost } from '../client-litellm';

@singleton()
export class ProxyService {
  constructor(@inject(LITELLM_PROVIDER) private readonly litellmClient: LiteLLMClient) {}

  async create(newProxy: any): Promise<DeepchatProxies> {
    return DeepchatProxy.create(newProxy);
  }

  async get(id: string): Promise<DeepchatProxies | null> {
    return DeepchatProxy.findById(id);
  }

  async getAll(): Promise<DeepchatProxies[]> {
    return DeepchatProxy.find({});
  }

  async delete(id: string): Promise<DeepchatProxies | null> {
    const existing = await this.get(id);
    if (!existing) {
      return null;
    }

    await DeepchatProxy.deleteOne({ _id: id });

    return existing;
  }

  async proxyRequest(id: string, body: any): Promise<any> {
    // Get the proxy information
    const proxy = DeepchatProxy.findById(id);
    if (!proxy) {
      console.error(`Proxy with id ${id} not found`);
      throw new Error('Missing proxy data for id');
    }

    const result = await chatCompletionV1ChatCompletionsPost({ body, client: this.litellmClient as any })

    if (result.error) {
      console.error(result.error);
      throw new Error('Failed to make LiteLLM request');
    }

    if (!result.data) {
      console.error('Missing data payload from liteLLM');
      throw new Error('Missing LiteLLM Payload');
    }

    // Transform the data
    const response = result.data as any;
    response.text = response.choices[0].message.content;

    console.log(response);

    console.log(result);

    return response;
  }
}
