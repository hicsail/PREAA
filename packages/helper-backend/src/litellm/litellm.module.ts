import { Module } from '@nestjs/common';
import { LiteLLMService } from './litellm.service';

@Module({
  imports: [],
  controllers: [],
  providers: [LiteLLMService],
  exports: [LiteLLMService]
})
export class LitellmModule {}
