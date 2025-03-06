import { Module } from '@nestjs/common';
import { OauthEchoController } from './oauth-echo.controller';
import { OauthEchoService } from './oauth-echo.service';

@Module({
  controllers: [OauthEchoController],
  providers: [OauthEchoService]
})
export class OauthEchoModule {}
