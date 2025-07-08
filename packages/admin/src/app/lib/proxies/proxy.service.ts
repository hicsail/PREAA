import DeepchatProxy, { DeepchatProxies } from '@/app/schemas/deepchat-proxy';
import { inject, singleton } from 'tsyringe';
import { LITELLM_PROVIDER } from '../container';
import type { Client as LiteLLMClient } from '../client-litellm/core/types';

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

  }
}
