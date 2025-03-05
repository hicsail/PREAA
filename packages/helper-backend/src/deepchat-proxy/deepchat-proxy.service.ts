import { Injectable } from "@nestjs/common";
import { DeepchatProxy, DeepchatProxyDocument } from "./deepchat-proxy.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { LiteLLMService } from "src/litellm/litellm.service";

@Injectable()
export class DeepchatProxyService {
  constructor(@InjectModel(DeepchatProxy.name) private readonly deepChatProxyModel: Model<DeepchatProxyDocument>,
              private readonly liteLLMService: LiteLLMService) {}

  async get(id: string): Promise<DeepchatProxy | null> {
    return this.deepChatProxyModel.findOne({ _id: id });
  }

  async getAll(): Promise<DeepchatProxy[]> {
    return this.deepChatProxyModel.find();
  }

  async create(mapping: DeepchatProxy): Promise<DeepchatProxy> {
    return await this.deepChatProxyModel.create(mapping);
  }

  async update(mapping: DeepchatProxy): Promise<DeepchatProxy | null> {
    return await this.deepChatProxyModel.findOneAndUpdate({ model: mapping.model }, mapping, {
      new: true,
      upsert: true,
    });
  }

  async delete(model: string): Promise<void> {
    await this.deepChatProxyModel.deleteOne({ model });
  }

  async proxyRequest(model: string, url: string, apiKey: string, body: any): Promise<any> {
    // reshape the body
    const response = this.liteLLMService.completion(model, apiKey, url, body);
    return response;
  }

}