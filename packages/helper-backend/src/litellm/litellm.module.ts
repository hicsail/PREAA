import { Module } from '@nestjs/common';
import { LiteLLMService } from './litellm.service';
import { LiteLLMController } from './litellm.controller';
@Module({
  imports: [],
  controllers: [LiteLLMController],
  providers: [LiteLLMService],
  exports: [LiteLLMService]
})
export class LitellmModule {}
