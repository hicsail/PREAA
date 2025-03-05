import { Module } from '@nestjs/common';
import { DeepchatProxy, DeepchatProxySchema } from './deepchat-proxy.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { DeepchatProxyController } from './deepchat-proxy.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeepchatProxy.name, schema: DeepchatProxySchema },
    ]),
  ],
  controllers: [DeepchatProxyController],
  providers: [],
  exports: [],
})
export class DeepchatProxyModule {}
