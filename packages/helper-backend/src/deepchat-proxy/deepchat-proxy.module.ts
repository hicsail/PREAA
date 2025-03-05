import { Module } from '@nestjs/common';
import { DeepchatProxy, DeepchatProxySchema } from './deepchat-proxy.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeepchatProxy.name, schema: DeepchatProxySchema },
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class DeepchatProxyModule {}
