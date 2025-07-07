import DeepchatProxy, { DeepchatProxies } from '@/app/schemas/deepchat-proxy';
import { singleton } from 'tsyringe';

@singleton()
export class ProxyService {
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
}
