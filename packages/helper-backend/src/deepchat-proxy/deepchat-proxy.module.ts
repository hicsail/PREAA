import { Module } from '@nestjs/common';
import { DeepchatProxy, DeepchatProxySchema } from './deepchat-proxy.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { DeepchatProxyController } from './deepchat-proxy.controller';
import { DeepchatProxyService } from './deepchat-proxy.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeepchatProxy.name, schema: DeepchatProxySchema },
    ]),
  ],
  controllers: [DeepchatProxyController],
  providers: [DeepchatProxyService],
  exports: [],
})
export class DeepchatProxyModule {}
