import { Module } from '@nestjs/common';
import { LiteLLMService } from './litellm.service';
import { LiteLLMController } from './litellm.controller';
import { ConfigModule } from '@nestjs/config';
import { litellmProvider } from './litellm.provider';

@Module({
  imports: [ConfigModule],
  controllers: [LiteLLMController],
  providers: [LiteLLMService, litellmProvider],
  exports: [LiteLLMService, litellmProvider]
})
export class LitellmModule {}
