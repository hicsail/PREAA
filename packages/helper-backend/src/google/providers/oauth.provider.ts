import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export const GOOGLE_OAUTH_PROVIDER = 'GOOGLE_OAUTH_PROVIDER';

export const googleOAuthProvider: Provider<OAuth2Client> = {
  provide: GOOGLE_OAUTH_PROVIDER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const clientID = configService.getOrThrow<string>('google.oauth.clientID');
    const clientSecret = configService.getOrThrow<string>('google.oauth.clientSecret');
    const redirectURL = configService.getOrThrow<string>('google.oauth.redirectURL');
    return new OAuth2Client(clientID, clientSecret, redirectURL);
  }
};
