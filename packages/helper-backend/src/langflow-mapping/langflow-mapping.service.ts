import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LangFlowMapping, LangFlowMappingDocument } from './langflow-mapping.schema';
import { Model } from 'mongoose';
import { CreateLangFlowMapping } from './dtos/create.dto';
import { UpdateLangFlowMapping } from './dtos/update.dto';

@Injectable()
export class LangflowMappingService {
  constructor(
    @InjectModel(LangFlowMapping.name) private readonly langFlowMappingModel: Model<LangFlowMappingDocument>
  ) {}

  async get(model: string): Promise<LangFlowMapping | null> {
    return this.langFlowMappingModel.findOne({ model });
  }

  async getAll(): Promise<LangFlowMapping[]> {
    return this.langFlowMappingModel.find();
  }

  async create(mapping: CreateLangFlowMapping): Promise<LangFlowMapping> {
    return await this.langFlowMappingModel.create(mapping);
  }

  async update(mapping: UpdateLangFlowMapping): Promise<LangFlowMapping | null> {
    return await this.langFlowMappingModel.findOneAndUpdate({ model: mapping.model }, mapping, {
      new: true,
      upsert: true
    });
  }

  async delete(model: string): Promise<void> {
    await this.langFlowMappingModel.deleteOne({ model });
  }
}