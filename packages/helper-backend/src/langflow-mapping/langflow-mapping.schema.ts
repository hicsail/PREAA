import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type LangFlowMappingDocument = LangFlowMapping & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
      delete ret.__v;
      return ret;
    }
  }
})
export class LangFlowMapping {
  @ApiProperty({ description: 'Unique identifier' })
  _id: string;

  @ApiProperty({ description: 'Model name' })
  @Prop({ required: true })
  model: string;

  /**
   * The request URL to request against including the flow ID
   *
   * ex) http://0.0.0.0:7860/api/v1/run/8e785198-f630-4d9f-94fa-26c8e945da80
   */
  @ApiProperty({ description: 'URL to the Langflow instance' })
  @Prop({ required: true })
  langflowUrl: string;

  /**
   * The ID of the history component where messages history should be passed in
   *
   * ex) CompletionInterface-qNlsX
   */
  @ApiProperty({ description: 'The history component ID for message history' })
  @Prop({ requied: true })
  historyComponentID: string;

  @ApiProperty({ description: 'Creation timestamp', format: 'date-time' })
  @Prop({ default: Date.now })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', format: 'date-time' })
  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const LangFlowMappingSchema = SchemaFactory.createForClass(LangFlowMapping);
