import { Inject, Injectable } from '@nestjs/common';
import { OAuth2Client } from 'googleapis-common';
import { GOOGLE_OAUTH_PROVIDER } from '../google/providers/oauth.provider';
import { GetOAuthURL } from './dtos/get-url.dto';

@Injectable()
export class GoogleOauthService {
  constructor(@Inject(GOOGLE_OAUTH_PROVIDER) private readonly oauth: OAuth2Client) {}

  async getAuthURL(urlRequest: GetOAuthURL): Promise<string> {
    return this.oauth.generateAuthUrl({
      access_type: 'offline',
      scope: urlRequest.scopes,
      include_granted_scopes: true
    });
  }

  async handleCallback(code: string): Promise<void> {
    const { tokens } = await this.oauth.getToken(code);

    console.log(tokens);
  }

}
