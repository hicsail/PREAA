import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';

class LiteLLMParams {
    /** The model identifier to be used with LiteLLM */
    @Prop({ required: true })
    model: string;

    /** The base URL for the API to connect to the model */
    @Prop({ required: true })
    api_base: string;

    /** The API key for authentication; excluded from serialization */
    @Exclude()  // This property will not be included in the serialized output
    @Prop({ required: true })
    api_key: string;
}

@Schema()
export class LiteLLMNewModel {
    /** The name of the model, required for identification */
    @Prop({ required: true })
    model_name: string;

    /** Parameters specific to LiteLLM, required for model configuration */
    @Prop({ required: true, type: LiteLLMParams })  // Reference the LiteLLMParams class
    litellm_params: LiteLLMParams;
}

export type LiteLLMNewModelDocument = LiteLLMNewModel & Document;
export const LiteLLMNewModelSchema = SchemaFactory.createForClass(LiteLLMNewModel);

