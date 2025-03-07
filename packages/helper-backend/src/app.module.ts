import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { LangflowMappingModule } from './langflow-mapping/langflow-mapping.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { DeepchatProxyModule } from './deepchat-proxy/deepchat-proxy.module';
import { LitellmModule } from './litellm/litellm.module';
import { OauthEchoModule } from './oauth-echo/oauth-echo.module';
import { GoogleOauthModule } from './google-oauth/google-oauth.module';
import { GoogleModule } from './google/google.module';

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
    LitellmModule,
    OauthEchoModule,
    GoogleOauthModule,
    GoogleModule
  ],
  controllers: [],
  providers: [AppService]
})
export class AppModule {}
