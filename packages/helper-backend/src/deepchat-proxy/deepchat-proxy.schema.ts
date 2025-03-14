import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';

@Schema()
export class DeepchatProxy {
  /** The name the mapping should go by */
  @Prop({ required: true })
  model: string;

  // url for the proxy
  @Prop({ required: true })
  url: string;

  // API KEY to pass as header to LiteLLM
  @Exclude()
  @Prop({ required: true })
  apiKey: string;
}

export type DeepchatProxyDocument = DeepchatProxy & Document;
export const DeepchatProxySchema = SchemaFactory.createForClass(DeepchatProxy);
