import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class GoogleOAuthCredentials {
  @Prop()
  access_token: string;

  @Prop()
  refresh_token: string;

  @Prop()
  userID: string;
}

export type GoogleOAuthCredentialsDocument = GoogleOAuthCredentials & Document;
export const GoogleOAuthCredentialsSchema = SchemaFactory.createForClass(GoogleOAuthCredentials);
