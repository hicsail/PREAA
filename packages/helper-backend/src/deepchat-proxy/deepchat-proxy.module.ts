import { Module } from '@nestjs/common';
import { DeepchatProxy, DeepchatProxySchema } from './deepchat-proxy.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { DeepchatProxyService } from './deepchat-proxy/deepchat-proxy.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeepchatProxy.name, schema: DeepchatProxySchema },
    ]),
  ],
  controllers: [],
  providers: [DeepchatProxyService],
  exports: [],
})
export class DeepchatProxyModule {}
