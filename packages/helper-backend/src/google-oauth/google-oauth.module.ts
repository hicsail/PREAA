import { Module } from '@nestjs/common';
import { GoogleOauthService } from './google-oauth.service';
import { GoogleOauthController } from './google-oauth.controller';
import { GoogleModule } from '../google/google.module';
import { MongooseModule } from '@nestjs/mongoose';
import { GoogleOAuthCredentials, GoogleOAuthCredentialsSchema } from './google-oauth.schema';

@Module({
  providers: [GoogleOauthService],
  controllers: [GoogleOauthController],
  imports: [
    GoogleModule,
    MongooseModule.forFeature([
      { name: GoogleOAuthCredentials.name, schema: GoogleOAuthCredentialsSchema }
    ])
  ]
})
export class GoogleOauthModule {}
