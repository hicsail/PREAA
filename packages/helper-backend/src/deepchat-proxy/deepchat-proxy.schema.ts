import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';

@Schema()
export class DeepchatProxy {
  @ApiProperty({
    description: 'MongoDB generated id',
    example: '6401234567890abcdef12345'
  })
  @Expose()
  @Transform(({ value }) => value?.toString())
  _id: Types.ObjectId;

  @ApiProperty({
    description: 'The model the deepchat proxy should talk to',
    example: 'chatgpt-4o'
  })
  @Prop({ required: true })
  model: string;

  @ApiProperty({
    description: 'The LiteLLM url to communicate against',
    example: 'http://localhost:4000'
  })
  @Prop({ required: true })
  url: string;

  @Exclude()
  @Prop({ required: true })
  apiKey: string;
}

export type DeepchatProxyDocument = DeepchatProxy & Document;
export const DeepchatProxySchema = SchemaFactory.createForClass(DeepchatProxy);
