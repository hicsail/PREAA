import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LangFlowMapping, LangFlowMappingDocument } from './langflow-mapping.schema';
import { Model } from 'mongoose';
import { CreateLangFlowMapping } from './dtos/create.dto';
import { UpdateLangFlowMapping } from './dtos/update.dto';
import { LiteLLMService } from 'src/litellm/litellm.service';

@Injectable()
export class LangflowMappingService {
  constructor(
    @InjectModel(LangFlowMapping.name) private readonly langFlowMappingModel: Model<LangFlowMappingDocument>
  ) {}

  async get(model: string): Promise<LangFlowMapping | null> {
    return this.langFlowMappingModel.findOne({ modelName: model });
  }

  async getAll(): Promise<LangFlowMapping[]> {
    return this.langFlowMappingModel.find();
  }

  async create(mapping: CreateLangFlowMapping): Promise<LangFlowMapping> {
    const mappedData = {
      modelName: mapping.model,
      langflowUrl: mapping.url,
      historyComponentID: mapping.historyComponentID
    };
    return await this.langFlowMappingModel.create(mappedData);
  }

  async update(mapping: UpdateLangFlowMapping): Promise<LangFlowMapping | null> {
    const mappedData: any = {
      modelName: mapping.model
    };
    
    if (mapping.url) {
      mappedData.langflowUrl = mapping.url;
    }
    
    if (mapping.historyComponentID) {
      mappedData.historyComponentID = mapping.historyComponentID;
    }
    
    return await this.langFlowMappingModel.findOneAndUpdate(
      { modelName: mapping.model }, 
      mappedData, 
      {
        new: true,
        upsert: true
      }
    );
  }

  async delete(model: string): Promise<void> {
    await this.langFlowMappingModel.deleteOne({ modelName: model });
  }
}
