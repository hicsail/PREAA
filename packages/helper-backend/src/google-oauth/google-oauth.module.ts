import { Module } from '@nestjs/common';
import { GoogleOauthService } from './google-oauth.service';
import { GoogleOauthController } from './google-oauth.controller';
import { GoogleModule } from '../google/google.module';

@Module({
  providers: [GoogleOauthService],
  controllers: [GoogleOauthController],
  imports: [GoogleModule]
})
export class GoogleOauthModule {}
