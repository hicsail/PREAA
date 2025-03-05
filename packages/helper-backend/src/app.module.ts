import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { LangflowMappingModule } from './langflow-mapping/langflow-mapping.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { DeepchatProxyModule } from './deepchat-proxy/deepchat-proxy.module';
import { LitellmModule } from './litellm/litellm.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('mongo.uri')
      })
    }),
    LangflowMappingModule,
    DeepchatProxyModule,
    LitellmModule
  ],
  controllers: [],
  providers: [AppService]
})
export class AppModule {}
