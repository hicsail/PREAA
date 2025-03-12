import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { GoogleOauthService } from './google-oauth.service';
import { GetOAuthURL } from './dtos/get-url.dto';
import { Credentials } from 'google-auth-library';

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
  async callback(@Query('state') state: string, @Query('code') code: string | undefined, @Query('error') error: string | undefined): Promise<string> {
    if (error || !code) {
      const msg = `OAuth flow failed with code: ${error}`;
      console.error(msg);
      return msg;
    }

    await this.googleOauthService.handleCallback(code, state);
    return 'success';
  }

  @Get('/credentials/:id')
  async getCredentials(@Param('id') id: string): Promise<Credentials & { client_id: string, client_secret: string }> {
    return this.googleOauthService.getCredentials(id);
  }
}
