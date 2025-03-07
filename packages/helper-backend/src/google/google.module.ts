import { Module } from '@nestjs/common';
import { googleOAuthProvider } from './providers/oauth.provider';

@Module({
  providers: [googleOAuthProvider],
  exports: [googleOAuthProvider]
})
export class GoogleModule {}
