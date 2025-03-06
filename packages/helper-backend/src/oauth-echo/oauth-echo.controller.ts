import { Controller, Get, Query } from '@nestjs/common';

@Controller('oauth-echo')
export class OauthEchoController {
  @Get()
  async echoCode(@Query('code') code: string) {
    return code;
  }
}
