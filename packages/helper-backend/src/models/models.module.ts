import { Module } from '@nestjs/common';
import { ModelsService } from './models.service';
import { ModelsController } from './models.controller';
import { LitellmModule } from '../litellm/litellm.module';

@Module({
  controllers: [ModelsController],
  providers: [ModelsService],
  imports: [LitellmModule]
})
export class ModelsModule {}
