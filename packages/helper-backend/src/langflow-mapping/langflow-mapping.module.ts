import { Module } from '@nestjs/common';
import { LangflowMappingController } from './langflow-mapping.controller';
import { LangflowMappingService } from './langflow-mapping.service';
import { MongooseModule } from '@nestjs/mongoose';
import { LangFlowMapping, LangFlowMappingSchema } from './langflow-mapping.schema';
import { IsUniqueModelRule } from './pipes/unique';
import { DoesExistModelRule } from './pipes/exists';
import { LiteLLMService } from 'src/litellm/litellm.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: LangFlowMapping.name, schema: LangFlowMappingSchema }])],
  controllers: [LangflowMappingController],
  providers: [LangflowMappingService, IsUniqueModelRule, DoesExistModelRule, LiteLLMService],
  exports: [IsUniqueModelRule]
})
export class LangflowMappingModule {}
