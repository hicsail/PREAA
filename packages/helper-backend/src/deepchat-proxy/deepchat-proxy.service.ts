import { Injectable } from "@nestjs/common";
import { DeepchatProxy, DeepchatProxyDocument } from "./deepchat-proxy.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class DeepchatProxyService {
  constructor(@InjectModel(DeepchatProxy.name) private readonly deepChatProxyModel: Model<DeepchatProxyDocument>) {}

  async get(model: string): Promise<DeepchatProxy | null> {
    return this.deepChatProxyModel.findOne({ model });
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



}