import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LangFlowMapping, LangFlowMappingDocument } from './langflow-mapping.schema';
import { Model } from 'mongoose';

@Injectable()
export class LangflowMappingService {
  constructor(@InjectModel(LangFlowMapping.name) private readonly langFlowMappingModel: Model<LangFlowMappingDocument>) {}

  async get(model: string): Promise<LangFlowMapping | null> {
    return this.langFlowMappingModel.findOne({ model });
  }
}
