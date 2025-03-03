import { Module } from '@nestjs/common';
import { LangflowMappingController } from './langflow-mapping.controller';
import { LangflowMappingService } from './langflow-mapping.service';
import { MongooseModule } from '@nestjs/mongoose';
import { LangFlowMapping, LangFlowMappingSchema } from './langflow-mapping.schema';
import { IsUniqueModel } from './pipes/unique';

@Module({
  imports: [
    MongooseModule.forFeature([ { name: LangFlowMapping.name, schema: LangFlowMappingSchema }])
  ],
  controllers: [LangflowMappingController],
  providers: [LangflowMappingService, IsUniqueModel]
})
export class LangflowMappingModule {}
