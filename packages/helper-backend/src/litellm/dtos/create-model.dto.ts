import { ApiProperty } from "@nestjs/swagger";
import { IsString, ValidateNested } from "class-validator";


export class CreateNewModelParams {
  @ApiProperty({
    description: 'Model name for the backend',
    example: 'chatgpt-4o'
  })
  @IsString()
  model: string;

  @ApiProperty({
    description: 'Base URL for the model',
    example: 'http://localhost:4000'
  })
  @IsString()
  api_base: string;

  @ApiProperty({
    description: 'API key needed to be passed to the model backend',
    example: 'sk-1234'
  })
  @IsString()
  api_key: string;

  @ApiProperty({
    description: 'The name of the custom provider (if needed)',
    example: 'langflow'
  })
  @IsString({})
  custom_llm_provider: string;
}

export class CreateNewModel {
  @ApiProperty({
    description: 'The name of the model',
    example: 'chatgpt-4o'
  })
  @IsString()
  model_name: string;

  @ApiProperty({
    description: 'LiteLLM parameters for configuring the model',
    type: CreateNewModelParams
  })
  @ValidateNested()
  litellm_params: CreateNewModelParams;
}


