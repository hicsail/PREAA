import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class LangFlowMapping {
  /** The name the mapping should go by */
  @Prop({ required: true })
  model: string;

  /**
   * The request URL to request against including the flow ID
   *
   * ex) http://0.0.0.0:7860/api/v1/run/8e785198-f630-4d9f-94fa-26c8e945da80
   */
  @Prop({ required: true })
  url: string;

  /**
   * The ID of the history component where messages history should be passed in
   *
   * ex) CompletionInterface-qNlsX
   */
  @Prop({ requied: true })
  historyComponentID: string;
}

export type LangFlowMappingDocument = LangFlowMapping & Document;
export const LangFlowMappingSchema = SchemaFactory.createForClass(LangFlowMapping);
