import { Module } from '@nestjs/common';
import { LiteLLMService } from './litellm.service';
import { LiteLLMController } from './litellm.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [LiteLLMController],
  providers: [LiteLLMService],
  exports: [LiteLLMService]
})
export class LitellmModule {}
