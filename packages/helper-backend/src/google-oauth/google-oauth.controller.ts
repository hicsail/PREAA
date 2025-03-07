import { Body, Controller, Get, Post } from '@nestjs/common';
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
  async callback(): Promise<string> {
    return 'success';
  }

}
