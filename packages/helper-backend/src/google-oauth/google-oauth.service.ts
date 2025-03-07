import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OAuth2Client } from 'googleapis-common';
import { GOOGLE_OAUTH_PROVIDER } from '../google/providers/oauth.provider';
import { GetOAuthURL } from './dtos/get-url.dto';
import { InjectModel } from '@nestjs/mongoose';
import { GoogleOAuthCredentials, GoogleOAuthCredentialsDocument } from './google-oauth.schema';
import { Model } from 'mongoose';
import { Credentials } from 'google-auth-library';

@Injectable()
export class GoogleOauthService {

  constructor(
    @Inject(GOOGLE_OAUTH_PROVIDER) private readonly oauth: OAuth2Client,
    @InjectModel(GoogleOAuthCredentials.name) private readonly credentialsModel: Model<GoogleOAuthCredentialsDocument>,
  ) {}

  async getAuthURL(urlRequest: GetOAuthURL): Promise<string> {
    return this.oauth.generateAuthUrl({
      access_type: 'offline',
      scope: urlRequest.scopes,
      include_granted_scopes: true,
      state: urlRequest.userID
    });
  }

  async handleCallback(code: string, id: string): Promise<void> {
    const { tokens } = await this.oauth.getToken(code);

    await this.credentialsModel.insertOne({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      userID: id
    });
  }

  async getCredentials(id: string): Promise<Credentials & { client_id: string, client_secret: string }> {
    const creds = await this.credentialsModel.findOne({ userID: id });
    if (!creds) {
      throw new NotFoundException(`Credentials not found for the ID ${id}`);
    }

    // Refresh the token if needed
    this.oauth.setCredentials({
      refresh_token: creds.refresh_token,
      access_token: creds.access_token
    });
    const refresh = await this.oauth.refreshAccessToken();

    // Update the credentions as needed
    await this.credentialsModel.findOneAndUpdate({ userID: id }, {
      $set: {
        refresh_token: refresh.credentials.refresh_token,
        access_token: refresh.credentials.access_token
      }
    });

    // Returned the refreshed credenials
    return {
      ...refresh.credentials,
      client_id: this.oauth._clientId!,
      client_secret: this.oauth._clientSecret!
    };
  }

}
