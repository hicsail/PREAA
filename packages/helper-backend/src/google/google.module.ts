import { Module } from '@nestjs/common';
import { googleOAuthProvider } from './providers/oauth.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { GoogleOAuthCredentials, GoogleOAuthCredentialsSchema } from 'src/google-oauth/google-oauth.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GoogleOAuthCredentials.name, schema: GoogleOAuthCredentialsSchema }
    ])
  ],
  providers: [googleOAuthProvider],
  exports: [googleOAuthProvider]
})
export class GoogleModule {}
