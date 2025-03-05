import { Injectable } from "@nestjs/common";
import { DeepchatProxy, DeepchatProxyDocument } from "./deepchat-proxy.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class DeepchatProxyService {
  constructor(@InjectModel(DeepchatProxy.name) private readonly langFlowMappingModel: Model<DeepchatProxyDocument>) {}

  async get(model: string): Promise<DeepchatProxy | null> {
    return this.langFlowMappingModel.findOne({ model });
  }

  async getAll(): Promise<DeepchatProxy[]> {
    return this.langFlowMappingModel.find();
  }

  async create(mapping: DeepchatProxy): Promise<DeepchatProxy> {
    return await this.langFlowMappingModel.create(mapping);
  }

  async update(mapping: DeepchatProxy): Promise<DeepchatProxy | null> {
    return await this.langFlowMappingModel.findOneAndUpdate({ model: mapping.model }, mapping, {
      new: true,
      upsert: true,
    });
  }

  async delete(model: string): Promise<void> {
    await this.langFlowMappingModel.deleteOne({ model });
  }

}