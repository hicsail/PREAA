import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GoogleOauthService } from './google-oauth.service';
import { GetOAuthURL } from './dtos/get-url.dto';

@Controller('google-oauth')
export class GoogleOauthController {
  constructor(private readonly googleOauthService: GoogleOauthService) {}

  @Post('/url')
  async getAuthURL(@Body() urlRequest: GetOAuthURL): Promise<{ url: string }> {
    return {
      url: await this.googleOauthService.getAuthURL(urlRequest)
    }
  }

  @Get('/callback')
  async callback(@Query('code') code: string | undefined, @Query('error') error: string | undefined): Promise<string> {
    if (error || !code) {
      const msg = `OAuth flow failed with code: ${error}`;
      console.error(msg);
      return msg;
    }

    await this.googleOauthService.handleCallback(code);
    return 'success';
  }

  @Get('/credentials')
  async getCredentials(): Promise<void> {

  }

}
