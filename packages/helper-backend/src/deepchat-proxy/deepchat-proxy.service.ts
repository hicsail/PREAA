import { Injectable, NotFoundException } from '@nestjs/common';
import { DeepchatProxy, DeepchatProxyDocument } from './deepchat-proxy.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LiteLLMService } from 'src/litellm/litellm.service';

@Injectable()
export class DeepchatProxyService {
  constructor(
    @InjectModel(DeepchatProxy.name)
    private readonly deepChatProxyModel: Model<DeepchatProxyDocument>,
    private readonly liteLLMService: LiteLLMService
  ) {}

  async get(id: string): Promise<DeepchatProxy | null> {
    let modelData = this.deepChatProxyModel.findOne({ _id: id });
    // remove the apiKey from the response
    modelData = modelData.select('-apiKey');
    return modelData;
  }

  async getAll(): Promise<DeepchatProxy[]> {
    // model data without the apiKey
    let modelData = this.deepChatProxyModel.find();
    // remove the apiKey from all
    modelData = modelData.select('-apiKey');
    return modelData;
  }

  async create(mapping: DeepchatProxy): Promise<DeepchatProxy> {
    return await this.deepChatProxyModel.create(mapping);
  }

  async update(id: string, mapping: DeepchatProxy): Promise<DeepchatProxy | null> {
    return await this.deepChatProxyModel.findOneAndUpdate({ _id: id }, mapping, {
      new: true,
      upsert: true
    });
  }

  async delete(model: string): Promise<void> {
    await this.deepChatProxyModel.deleteOne({ model });
  }

  async proxyRequest(id: string, body: any): Promise<any> {
    const modelData = await this.get(id);
    if (!modelData) {
      throw new NotFoundException(`No model ${id} found`);
    }
    const response = this.liteLLMService.completion(modelData.model, modelData.apiKey, modelData.url, body);
    return response;
  }
}
