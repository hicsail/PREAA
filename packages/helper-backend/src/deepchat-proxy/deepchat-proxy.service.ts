import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DeepchatProxy, DeepchatProxyDocument } from './deepchat-proxy.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LiteLLMService } from '../litellm/litellm.service';
import { plainToInstance } from 'class-transformer';
import { CreateProxyMappingDto } from './dtos/create.dto';

@Injectable()
export class DeepchatProxyService {
  constructor(
    @InjectModel(DeepchatProxy.name)
    private readonly deepChatProxyModel: Model<DeepchatProxyDocument>,
    private readonly liteLLMService: LiteLLMService
  ) {}

  async get(id: string): Promise<DeepchatProxy | null> {
    let result = await this.deepChatProxyModel.findOne({ _id: id }).lean().exec();
    return plainToInstance(DeepchatProxy, result);
  }

  async getAll(): Promise<DeepchatProxy[]> {
    // model data without the apiKey
    const results = await this.deepChatProxyModel.find().lean().exec();
    return plainToInstance(DeepchatProxy, results, {
      excludeExtraneousValues: false // This is important to keep MongoDB fields
    });
  }

  async create(mapping: CreateProxyMappingDto): Promise<DeepchatProxy> {
    // check if model with name already exists
    const existingModel = await this.deepChatProxyModel.findOne({ model: mapping.model }).lean().exec();

    if (existingModel) {
      // throw bad request error
      throw new BadRequestException(`Model with name ${mapping.model} already exists`);
    }

    const result = await this.deepChatProxyModel.create(mapping);
    return plainToInstance(DeepchatProxy, result);
  }

  async update(id: string, mapping: DeepchatProxy): Promise<DeepchatProxy | null> {
    const result = await this.deepChatProxyModel.findOneAndUpdate({ _id: id }, mapping, {
      new: true,
      upsert: true
    });
    return plainToInstance(DeepchatProxy, result);
  }

  async delete(model: string): Promise<void> {
    await this.deepChatProxyModel.deleteOne({ model });
  }

  async proxyRequest(id: string, body: any): Promise<any> {
    const modelData = await this.deepChatProxyModel.findOne({ _id: id }).lean().exec();
    if (!modelData) {
      throw new NotFoundException(`No model ${id} found`);
    }
    const response = this.liteLLMService.completion(modelData.model, modelData.apiKey, modelData.url, body);
    return response;
  }
}
